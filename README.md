
# GitSwitch — by Yinkly

> Effortlessly manage multiple GitHub accounts, SSH keys, and tokens from a single interactive CLI.

**Website:** [https://yinkly.dev](https://yinkly.dev)  
**Repository:** [github.com/yinklylab/git-switch](https://github.com/yinklylab/git-switch)



## Why GitSwitch?

Switching between personal, work, and client GitHub accounts is painful.  
GitSwitch automates SSH key generation, `.ssh/config` entries, per-account git configuration, and optional GitHub key upload — so you can switch context, not your workflow.



## Features

- Generate and manage multiple SSH identities  
- Update `~/.ssh/config` safely with host aliases  
- Create per-account `.gitconfig-<name>`  
- List all configured accounts → `gitswitch list`  
- Switch active git identity → `gitswitch switch` or `gitswitch switch <account>`  
- Delete an account → `gitswitch delete <account>`  
- Securely store GitHub PATs with Keytar (optional)  
- Upload SSH keys to GitHub when a PAT is provided  
- Interactive CLI with non-interactive flags for automation  



## Quickstart

```bash
# dev: run locally via ts-node
npx ts-node src/main.ts setup

# or after build (recommended for users)
npm run build
node dist/main.js setup
````

### Common Commands

```bash
# setup a github account
gitswitch setup

# list configured accounts
gitswitch list

# switch active account (interactive)
gitswitch switch

# switch by name
gitswitch switch <account>

# delete an account
gitswitch delete <account>
```



## Installation (future)

Will include **npm package** / **Homebrew** instructions when released.



## Contributing

1. Fork the repo → create a feature branch per change (e.g. `feat/xxx` or `fix/xxx`)
2. Run tests and linters before opening a PR
3. Write clear commit messages and PR descriptions
4. Follow **Conventional Commits** for history clarity



## License

MIT © 2025 [Yinkly.dev](https://yinkly.dev)



## Contact

Built by [Yinkly](https://yinkly.dev)
Project: **GitSwitch** — Manage multiple GitHub accounts with confidence.