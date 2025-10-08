import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TokenModule } from './token/token.module';
import { GithubModule } from './github/github.module';

@Module({
  imports: [TokenModule, GithubModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
