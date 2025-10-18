# Git Switch — Effortless Multi-GitHub Account Manager (by Yinkly)

**Git Switch** is a powerful and user-friendly CLI tool built with NestJS that helps developers manage multiple GitHub accounts seamlessly on a single machine.

Whether you juggle personal, client, and work accounts — Git Switch keeps you in control without manually editing `.gitconfig` or SSH files.

## Features

✅ Manage multiple GitHub accounts (personal, work, client, etc.)  
✅ Automatically handle `.gitconfig` and SSH configurations  
✅ Quick account switching from the terminal  
✅ Secure key storage and verification  
✅ Works on **Windows, macOS, and Linux**  
✅ Built-in setup wizard and validation commands  
✅ Locking & concurrency protection to prevent corruption  

## Installation

Install globally via **npm** or **yarn**:

```bash
npm install -g @yinklylab.dev/gitswitch
# or
yarn global add @yinklylab.dev/gitswitch
````

Verify installation:

```bash
gitswitch -v
```

## Quick Start

Run the setup wizard to configure your first GitHub account:

```bash
gitswitch setup
```

List all configured accounts:

```bash
gitswitch list
```

Switch between accounts easily:

```bash
gitswitch use <account>
```

Delete an account configuration:

```bash
gitswitch delete <account>
```

Verify a GitHub username or token:

```bash
gitswitch verify <username> [token]
```

## Example Workflow

```bash
# Step 1: Setup your work account
gitswitch setup

# Step 2: Add your personal GitHub account
gitswitch setup

# Step 3: View all available accounts
gitswitch list

# Step 4: Switch to your personal account
gitswitch use personal

# Step 5: Verify your token or username
gitswitch verify myusername ghp_xxxxxxxxx
```

Git Switch will update your local `.gitconfig`, `.ssh/config`, and SSH keys automatically.
No more manual editing or confusing GitHub authentication issues.

## Supported Platforms

* Windows
* macOS
* Linux

> Works wherever Node.js (v18+) is installed.

## Troubleshooting

If you get permission or concurrency errors:

* Run the CLI with admin privileges (Windows)
* Ensure `.gitconfig` and `.ssh` folders are writable
* For version errors: run `npm version patch` and re-publish

## Author

**Oluyinka Abubakar**
Developer, Innovator & Open Source Enthusiast
[GitHub](https://github.com/lexico4real) · [LinkedIn](https://linkedin.com/in/oluyinka-abubakar)

## License

MIT License © 2025 [Yinkly Lab](https://github.com/yinkly)


