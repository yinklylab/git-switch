import * as keytar from 'keytar';
import chalk from 'chalk';

const SERVICE_NAME = 'gitSwitch';

export class TokenService {
  async saveToken(accountName: string, token: string): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, accountName, token);
  }

  async getToken(accountName: string): Promise<string | null> {
    return await keytar.getPassword(SERVICE_NAME, accountName);
  }

  async deleteToken(accountName: string): Promise<boolean> {
    const deleted = await keytar.deletePassword(SERVICE_NAME, accountName);
    if (deleted) {
      console.log(chalk.yellow(`🗑️  Deleted saved token for ${accountName}.`));
      return true;
    } else {
      console.log(chalk.gray(`ℹ️  No saved token found for ${accountName}.`));
      return false;
    }
  }
}
