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
          headers: { "User-Agent": "gitSwitch" },
        });
        console.log(response)
        if (response.status === 200 && response.data?.login?.toLowerCase() === username.toLowerCase()) {
          console.log(chalk.green(`✅ GitHub account '${username}' exists.`));
          return { valid: true };
        } else {
          console.log(chalk.red(`❌ GitHub account '${username}' not found.`));
          return { valid: false, reason: "not_found" };
        }
      } catch (error: any) {
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
          "User-Agent": "gitSwitch",
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
}
