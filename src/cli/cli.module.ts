import { Module } from '@nestjs/common';
import { CliService } from './cli.service';
import { SshModule } from '../ssh/ssh.module';
import { GithubModule } from '../github/github.module';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [SshModule, GithubModule, TokenModule],
  providers: [CliService],
})
export class CliModule {}
