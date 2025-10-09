import { Injectable } from '@nestjs/common';
import * as inquirer from 'inquirer';
import * as fs from 'fs-extra';
import chalk from 'chalk';
import figlet from 'figlet';
import { SshService } from '../ssh/ssh.service';
import { GithubService } from '../github/github.service';
import { TokenService } from '../token/token.service';


@Injectable()
export class CliService {
  constructor(
    private readonly sshService: SshService,
    private readonly githubService: GithubService,
    private readonly tokenService: TokenService,
  ) { }
  
}
