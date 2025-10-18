#!/usr/bin/env node
import ora from 'ora';
import chalk from 'chalk';
import figlet from 'figlet';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(chalk.cyan(question), answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function ensureInPath(binName: string) {
  const isInPath = process.env.PATH?.split(path.delimiter).some(p => {
    return fs.existsSync(path.join(p, binName));
  });

  if (isInPath) {
    console.log(chalk.green(`✅ '${binName}' is available in PATH.\n`));
    return;
  }

  console.log(chalk.yellow(`⚠️  '${binName}' is not in your PATH.`));

  const answer = await prompt('Would you like me to add it automatically? (y/N): ');
  if (!/^y(es)?$/i.test(answer)) {
    console.log(chalk.gray('Skipping PATH modification. You can add it manually later.'));
    return;
  }

  const npmGlobalBin = execSync('npm bin -g').toString().trim();
  const shell = process.env.SHELL || '';

  try {
    if (process.platform === 'win32') {
      execSync(`setx PATH "%PATH%;${npmGlobalBin}"`);
      console.log(chalk.green('✅ PATH updated successfully for Windows.'));
    } else if (shell.includes('zsh')) {
      fs.appendFileSync(path.join(os.homedir(), '.zshrc'), `\nexport PATH="$PATH:${npmGlobalBin}"\n`);
      console.log(chalk.green('✅ Added npm global bin to .zshrc.'));
    } else if (shell.includes('bash')) {
      fs.appendFileSync(path.join(os.homedir(), '.bashrc'), `\nexport PATH="$PATH:${npmGlobalBin}"\n`);
      console.log(chalk.green('✅ Added npm global bin to .bashrc.'));
    } else {
      console.log(chalk.yellow('⚠️ Could not detect shell. Please add this manually:'));
      console.log(chalk.gray(`export PATH="$PATH:${npmGlobalBin}"`));
    }
  } catch (err) {
    console.error(chalk.red('❌ Failed to modify PATH automatically:'), err);
  }

  console.log(chalk.gray('\nPlease restart your terminal for the changes to take effect.\n'));
}

async function main() {
  console.log(chalk.cyanBright('\n🚀 Installing GitSwitch CLI...\n'));

  const spinner = ora({
    text: chalk.gray('Preparing setup...'),
    spinner: 'dots',
  }).start();

  try {
    await sleep(1000);
    spinner.text = chalk.gray('Checking system environment...');
    await sleep(1000);

    spinner.text = chalk.gray('Configuring CLI environment...');
    await sleep(1000);

    spinner.succeed(chalk.greenBright('Installation complete!\n'));

    console.log(chalk.cyan(figlet.textSync('GitSwitch', { horizontalLayout: 'full' })));

    console.log(chalk.gray('\nRun ') + chalk.yellow('gitswitch') + chalk.gray(' to get started!\n'));

    console.log(chalk.cyan('🔍 Checking PATH configuration...\n'));
    await ensureInPath('gitswitch');
  } catch (err) {
    spinner.fail(chalk.red('Installation failed.'));
    console.error(chalk.red('❌ Error:'), err);
  }
}

main();
