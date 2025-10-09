import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TokenModule } from './token/token.module';
import { GithubModule } from './github/github.module';
import { SshModule } from './ssh/ssh.module';

@Module({
  imports: [TokenModule, GithubModule, SshModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
