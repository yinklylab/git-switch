import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import simpleGit from 'simple-git';
import axios from 'axios';
import chalk from 'chalk';
import { TokenService } from '../token/token.service';

@Injectable()
export class GithubService {
  constructor(private readonly tokenService: TokenService) { }
  private homeDir = os.homedir();
  private mainGitConfig = path.join(this.homeDir, '.gitconfig');
  private baseUrl = process.env.GITHUB_USERS_URL || 'https://api.github.com/users';

  async verifyAccount(username: string, token?: string): Promise<{
    valid: boolean;
    reason?: string;
    authenticatedUser?: string;
  }> {
    if (!token) {
      console.log(chalk.yellow("⚠️ No GitHub token provided. Checking if username exists..."));
      try {
        const response = await axios.get(`${this.baseUrl}/${username}`, {
          headers: { "User-Agent": "GitSwitch" },
        });
        if (response.status === 200 && response.data?.login?.toLowerCase() === username.toLowerCase()) {
          console.log(chalk.green(`✅ GitHub account '${username}' exists.`));
          return { valid: true };
        } else {
          console.log(chalk.red(`❌ GitHub account '${username}' not found.`));
          return { valid: false, reason: "not_found" };
        }
      } catch (error: any) {
        if (error?.includes('ENOTFOUND')) {
          console.error(chalk.red('❌ Verification! Please check your internet connection'));
          return { valid: false, reason: 'ENOTFOUND' }
        }

        if (error.response?.status === 404) {
          console.error(chalk.red(`❌ GitHub account '${username}' not found.`));
          return { valid: false, reason: 'not_found' };
        }

        console.error(chalk.red(`⚠️ Error verifying GitHub account:`), error.message);
        return { valid: false, reason: "network_error" };
      }
    }

    try {
      const response = await axios.get("https://api.github.com/user", {
        headers: {
          Authorization: `token ${token}`,
          "User-Agent": "GitSwitch",
        },
      });

      const authenticatedUser = response.data?.login;
      if (authenticatedUser.toLowerCase() === username.toLowerCase()) {
        console.log(chalk.green(`✅ Verified token belongs to '${username}'.`));
        return { valid: true, authenticatedUser };
      } else {
        console.log(
          chalk.red(
            `❌ Token belongs to '${authenticatedUser}', not '${username}'. Please check the token.`
          )
        );
        return { valid: false, reason: 'wrong_user', authenticatedUser };
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log(chalk.red("❌ Invalid or expired GitHub token."));
        return { valid: false, reason: 'unauthorized' };
      } else {
        console.log(chalk.red(`⚠️ Error verifying token: ${error.message}`));
      }
      return { valid: false, reason: 'network_error' };
    }
  }

  async setupGitConfig(accountName: string, email: string): Promise<void> {
    const gitConfigPath = path.join(os.homedir(), `.gitconfig-${accountName}`);
    const gitConfigContent = `
    [user]
      name = ${accountName}
      email = ${email}
    `;

    await fs.writeFile(gitConfigPath, gitConfigContent);
  }

  async listAccounts(): Promise<{ name: string; validToken: boolean }[]> {
    const files = await fs.readdir(this.homeDir);
    const accountFiles = files.filter((f) => f.startsWith('.gitconfig-'));
    const accounts: { name: string; validToken: boolean }[] = [];

    for (const file of accountFiles) {
      const accountName = file.replace('.gitconfig-', '');
      const token = await this.tokenService.getToken(accountName);
      let verification = { valid: false };

      if (token) {
        verification = await this.verifyAccount(accountName, token);
      }

      accounts.push({ name: accountName, validToken: verification.valid });
    }

    return accounts;
  }

  async deleteAccountConfig(accountName: string): Promise<boolean> {
    const filePath = path.join(this.homeDir, `.gitconfig-${accountName}`);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(chalk.yellow(`🗑️  Deleted ${filePath}`));
      return true;
    } else {
      console.log(chalk.gray(`ℹ️  No local config found for ${accountName}.`));
      return false;
    }
  }

  async switchAccount(username: string): Promise<void> {
    const configPath = path.join(this.homeDir, `.gitconfig-${username}`);
    const mainConfig = path.join(this.homeDir, '.gitconfig');
    const activeFile = path.join(this.homeDir, '.active-account');

    try {
      // Step 1: Check if the target account exists
      await fs.access(configPath);
    } catch {
      console.log(chalk.red(`❌ Account '${username}' does not exist.`));
      return;
    }

    // Step 2: Verify token (optional but recommended)
    const token = await this.tokenService.getToken(username);
    if (!token) {
      console.log(chalk.yellow(`⚠️ No token found for '${username}'. Proceeding without verification...`));
    } else {
      const isValid = await this.verifyAccount(username, token);
      if (!isValid) {
        console.log(chalk.red(`❌ Invalid or expired token for '${username}'. Aborting switch.`));
        return;
      }
    }

    // Step 3: Replace global .gitconfig
    try {
      await fs.copyFile(configPath, mainConfig);
    } catch (err) {
      console.log(chalk.red(`❌ Failed to update .gitconfig: ${err.message}`));
      return;
    }

    // Step 4: Persist the active account
    try {
      await fs.writeFile(activeFile, username, 'utf8');
    } catch (err) {
      console.log(chalk.red(`⚠️ Could not record active account: ${err.message}`));
    }

    console.log(chalk.green(`✅ Switched successfully to '${username}'.`));
  }

  async getActiveAccount(): Promise<string | null> {
    if (!(await fs.pathExists(this.mainGitConfig))) return null;
    const content = await fs.readFile(this.mainGitConfig, 'utf-8');
    const match = content.match(/name\s*=\s*(.*)/);
    return match ? match[1].trim() : null;
  }

  async cloneRepoWithAccount(repoUrl: string, accountAlias: string, targetDir: string) {
    const git = simpleGit();
    const sshUrl = repoUrl.replace('github.com', `${accountAlias}`);
    await git.clone(sshUrl, targetDir);
  }

  async keyExistsOnGithub(username: string, publicKey: string, token: string): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/user/keys`, {
        headers: { Authorization: `token ${token}` },
      });

      const keys = response.data as { key: string }[];
      return keys.some((k) => k.key.trim() === publicKey.trim());
    } catch (err) {
      console.error(chalk.red('⚠️ Could not verify SSH key on GitHub:'), err.response?.data || err.message);
      return false;
    }
  }

  async uploadKey(publicKey: string, token: string, title: string): Promise<void> {
    const response = await fetch('https://api.github.com/user/keys', {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, key: publicKey }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`GitHub key upload failed: ${err}`);
    }
  }
}
