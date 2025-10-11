import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CliService } from './cli/cli.service';
import chalk from 'chalk';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const cliService = app.get(CliService);
  const [command, option1, option2] = process.argv.slice(2);

  const showHelp = () => {
    console.log(chalk.cyan('\nAvailable Commands:'));
    console.log(chalk.green('  setup') + '             → Run GitHub account setup wizard');
    console.log(chalk.green('  list') + '              → List all configured GitHub accounts');
    console.log(chalk.green('  switch <account>') + '  → Switch active GitHub account');
    console.log(chalk.green('  delete <account>') + '  → Delete a specific GitHub account');
    console.log(chalk.green('  verify <user> [tk]') + ' → Verify a GitHub username or token');
    console.log('');
  };

  try {
    switch (command) {
      case 'list':
        await cliService.listAccounts();
        break;

      case 'switch':
        await cliService.switchAccount(option1);
        break;

      case 'delete':
        await cliService.deleteAccount(option1);
        break;

      case 'verify':
        if (!option1) {
          console.log(chalk.yellow('⚠️ Usage: gitswitch verify <username> [token]\n'));
        } else {
          await cliService.verifyAccount(option1, option2);
        }
        break;

      case 'setup':
      case undefined:
        await cliService.runSetup();
        break;

      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;

      default:
        console.log(chalk.red(`\n❌ Unknown command: ${command}\n`));
        showHelp();
        break;
    }
  } catch (err: any) {
    console.error(chalk.red(`❌ Error: ${err.message}`));
    if (process.env.DEBUG) {
      console.error(chalk.gray(err.stack));
    }
  } finally {
    await app.close();
  }
}

bootstrap();
