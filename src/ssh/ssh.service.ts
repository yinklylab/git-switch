import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
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
  }
}
