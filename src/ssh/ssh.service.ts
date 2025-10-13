import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import * as lockfile from 'proper-lockfile';
import * as fs from 'fs-extra';
import * as path from 'path';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

@Injectable()
export class SshService {
  private sshDir = path.join(
    process.env.HOME ?? process.env.USERPROFILE ?? '',
    '.ssh',
  );

  private normalizePath(p: string): string {
    return p.replace(/\\/g, '/');
  }

  async generateKey(email: string, keyName: string): Promise<string> {
    await fs.ensureDir(this.sshDir);
    await fs.chmod(this.sshDir, 0o700);

    const keyPath = path.join(this.sshDir, keyName);

    if (await fs.pathExists(`${keyPath}.pub`)) {
      console.log(`⚠️ SSH key for '${keyName}' already exists — skipping generation.`);
      return keyPath;
    }

    console.log(`🔑 Generating SSH key for '${keyName}'...`);
    const command = `ssh-keygen -t rsa -b 4096 -C "${email}" -f "${keyPath}" -N ""`;
    try {
      await execAsync(command);
      console.log(`✅ SSH key successfully created at: ${keyPath}`);
      return keyPath;
    } catch (err) {
      console.error(`❌ Failed to generate SSH key:`, err);
      throw err;
    }
  }

  async updateSshConfig(accountName: string, keyPath: string, hostAlias: string) {

    if (!accountName || !keyPath || !hostAlias) {
      throw new Error('Invalid SSH config parameters.');
    }

    await fs.ensureDir(this.sshDir);
    const configPath = path.join(this.sshDir, 'config');

    const normalizedKeyPath = this.normalizePath(keyPath);

    const configEntry = [
      `Host ${hostAlias}`,
      `  HostName github.com`,
      `  User git`,
      `  IdentityFile ${normalizedKeyPath.replace('.pub', '')}`,
      `  IdentitiesOnly yes`,
      '',
    ].join('\n');

    await fs.ensureFile(configPath);

    let release: (() => Promise<void>) | undefined;

    try {
      
      release = await lockfile.lock(configPath);
  
      const currentConfig = (await fs.pathExists(configPath))
        ? await fs.readFile(configPath, 'utf-8')
        : '';
  
      if (currentConfig.includes(`Host ${hostAlias}`)) {
        console.log(`⚠️ SSH config for '${hostAlias}' already exists — skipping.`);
        return;
      }
  
      console.log(`🧩 Updating SSH config with alias '${hostAlias}'...`);
      await fs.appendFile(configPath, configEntry);
  
      console.log(`✅ SSH config updated at ${configPath}`);
    } catch (error) {
      console.error(chalk.red(`❌ Failed to update SSH config:`), error);
    } finally {
      if (release) await release();
    }
  }

  async getPublicKey(keyName: string): Promise<string> {
    let pubPath = path.join(this.sshDir, `${keyName}`);
    if (!pubPath.endsWith('.pub')) pubPath += '.pub';

    if (!(await fs.pathExists(pubPath))) {
      throw new Error(`Public key not found at ${pubPath}`);
    }

    return (await fs.readFile(pubPath, 'utf8')).trim();
  }

  async removeFromSshConfig(accountName: string): Promise<void> {
    const configPath = path.join(this.sshDir, 'config');
    if (!fs.existsSync(configPath)) {
      console.log(chalk.gray('ℹ️ No SSH config file found.'));
      return;
    }

    let release: (() => Promise<void>) | undefined;

    try {
      release = await lockfile.lock(configPath);

      let content = await fs.promises.readFile(configPath, 'utf8');
  
      const regex = new RegExp(
        `(# gitSwitch-${accountName}[\\s\\S]*?(?=\\n# gitSwitch-|$))|(Host github-${accountName}[\\s\\S]*?(?=\\nHost |$))`,
        'g'
      );
  
      const newContent = content.replace(regex, '').trim();
  
      if (newContent !== content) {
        await fs.promises.writeFile(configPath, newContent + '\n', 'utf8');
        console.log(chalk.yellow(`🧹 Removed SSH config for ${accountName}.`));
      } else {
        console.log(chalk.gray(`ℹ️ No SSH config entry found for ${accountName}.`));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to update SSH config:`), error);
    } finally {
      if (release) await release();
    }
  }

  async copyPublicKeyToClipboard(keyName: string): Promise<boolean> {
    let pubPath = path.join(this.sshDir, `${keyName}.pub`);
    if (!pubPath.endsWith('.pub')) pubPath += '.pub';

    if (!(await fs.pathExists(pubPath))) return false;

    try {
      if (process.platform === 'win32') {
        await execAsync(`type "${pubPath}" | clip`);
      } else if (process.platform === 'darwin') {
        await execAsync(`pbcopy < "${pubPath}"`);
      } else {
        await execAsync(`xclip -selection clipboard < "${pubPath}"`);
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  async deleteSSHKeys(accountName: string): Promise<boolean> {
    const privateKeyPath = path.join(this.sshDir, `id_rsa_${accountName}`);
    const publicKeyPath = `${privateKeyPath}.pub`;
    const altPrivateKeyPath = path.join(this.sshDir, `${accountName}`);
    const altPublicKeyPath = `${altPrivateKeyPath}.pub`;

    const deleted: string[] = [];

    for (const file of [privateKeyPath, publicKeyPath, altPrivateKeyPath, altPublicKeyPath]) {
      if (fs.existsSync(file)) {
        await fs.promises.unlink(file);
        deleted.push(file);
      }
    }

    if (deleted.length > 0) {
      console.log(chalk.yellow(`🗑️  Deleted SSH keys for ${accountName}:`));
      deleted.forEach(f => console.log(chalk.gray(`- ${f}`)));
      return true;
    } else {
      console.log(chalk.gray(`ℹ️  No SSH keys found for ${accountName}.`));
      return false;
    }
  }
}
