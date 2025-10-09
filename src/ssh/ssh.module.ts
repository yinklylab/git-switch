import { Module } from '@nestjs/common';
import { SshService } from './ssh.service';
import { SshController } from './ssh.controller';

@Module({
  controllers: [SshController],
  providers: [SshService],
})
export class SshModule {}
