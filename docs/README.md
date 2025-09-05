# GitHub Automation for ZX Pixel Smoosher

This directory contains GitHub-specific automation and configuration files that help maintain the repository automatically.

## Files Overview

### `dependabot.yml`
Configures Dependabot to automatically check for and create pull requests for dependency updates:

- **GitHub Actions**: Updates weekly on Mondays
- **NPM Dependencies**: Updates weekly on Tuesdays (for future use)
- **Docker**: Updates weekly on Wednesdays (for future use) 
- **Python**: Updates weekly on Thursdays (for future use)

**Features:**
- Automatic PR creation for dependency updates
- Configurable review assignments and labels
- Smart grouping of related dependencies
- Major version update protection

### `workflows/dependabot-auto-merge.yml`
Automatically handles Dependabot pull requests:

- **Patch updates**: Auto-approved and merged
- **GitHub Actions**: Auto-approved and merged
- **Minor updates**: Conditional auto-merge
- **Major updates**: Requires manual review

### `workflows/dependency-test.yml` 
Runs tests when dependencies change:

- **Multi-Node testing**: Tests against Node.js 18, 20, 22
- **Syntax validation**: Checks JavaScript files for errors
- **Application validation**: Verifies core files exist
- **Security audit**: Runs npm audit when applicable
- **Linting**: Runs linting if configured

## How It Works

1. **Weekly Scans**: Dependabot checks for updates every week
2. **Automatic PRs**: Creates pull requests for available updates
3. **CI Testing**: Each PR triggers automated testing
4. **Smart Merging**: Safe updates are automatically approved/merged
5. **Manual Review**: Major updates require human review

## Benefits

- **Security**: Automatic security updates for dependencies
- **Maintenance**: Keeps dependencies current without manual work  
- **Safety**: Testing ensures updates don't break the application
- **Efficiency**: Reduces manual dependency management overhead

## Customization

To modify the automation:

1. **Update schedules**: Edit `schedule.interval` in `dependabot.yml`
2. **Change reviewers**: Update `reviewers` and `assignees` lists
3. **Modify auto-merge rules**: Edit conditions in `dependabot-auto-merge.yml`
4. **Add test steps**: Extend `dependency-test.yml` workflow

## Current Status

Since ZX Pixel Smoosher is currently a vanilla JavaScript project with no external dependencies, the configuration is prepared for future use when dependencies are added. The GitHub Actions monitoring is active and will help maintain workflow security.