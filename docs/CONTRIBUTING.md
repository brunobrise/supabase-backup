# Contributing to Supabase Backup Tool

First off, thank you for considering contributing to Supabase Backup Tool! It's people like you that make this tool better for everyone.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing Guidelines](#testing-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include logs and error messages**
- **Specify your environment:**
  - OS and version
  - Node.js version
  - Supabase version
  - Tool version

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear and descriptive title**
- **Detailed description of the proposed feature**
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**
- **Mock-ups or examples if applicable**

### Your First Code Contribution

Unsure where to begin? Look for issues tagged with:

- `good first issue` - Simple issues for newcomers
- `help wanted` - Issues that need community help
- `documentation` - Documentation improvements

## Development Setup

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL client tools
- Git
- A Supabase project for testing

### Setup Steps

1. **Fork the repository**
   ```bash
   # Click 'Fork' on GitHub, then:
   git clone https://github.com/YOUR_USERNAME/supabase-backup.git
   cd supabase-backup
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/brunobrise/supabase-backup.git
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your test Supabase credentials
   ```

5. **Verify setup**
   ```bash
   npm run backup:db
   ```

### Development Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... edit files ...

# Test your changes
npm run backup
npm run verify

# Commit your changes
git add .
git commit -m "feat: add your feature description"

# Push to your fork
git push origin feature/your-feature-name

# Open a Pull Request on GitHub
```

## Pull Request Process

### Before Submitting

1. **Update documentation** if you've changed APIs or added features
2. **Test your changes** thoroughly
3. **Follow the coding standards** outlined below
4. **Update CHANGELOG.md** with your changes
5. **Ensure your code lints** and passes all checks

### PR Guidelines

1. **Use a clear and descriptive title**
   - Good: `feat: add incremental backup support`
   - Bad: `updates`

2. **Fill out the PR template** completely

3. **Link related issues** using keywords:
   - `Fixes #123`
   - `Closes #123`
   - `Relates to #123`

4. **Keep PRs focused** - One feature/fix per PR

5. **Update tests** if applicable

6. **Request reviews** from maintainers

### PR Review Process

- Maintainers will review your PR within 3-5 business days
- Address any requested changes
- Once approved, a maintainer will merge your PR
- Your contribution will be included in the next release!

## Coding Standards

### JavaScript Style

We follow modern JavaScript best practices:

```javascript
// ✅ Good
const backupDatabase = async (config) => {
  try {
    const result = await performBackup(config);
    return result;
  } catch (error) {
    logger.error('Backup failed:', error);
    throw error;
  }
};

// ❌ Bad
function backupDatabase(config) {
  performBackup(config, function(err, result) {
    if (err) console.log(err);
    return result;
  });
}
```

### Code Conventions

- **Use ES6+ features** (async/await, arrow functions, destructuring)
- **Use meaningful variable names** (`backupPath` not `bp`)
- **Add comments for complex logic**
- **Keep functions small and focused** (single responsibility)
- **Handle errors properly** (try/catch, error logging)
- **Use async/await** over callbacks
- **Validate inputs** where appropriate

### File Organization

```
supabase-backup/
├── backup.js           # Main backup script
├── restore.js          # Main restore script
├── verify-backup.js    # Verification script
├── lib/                # Shared utilities (if needed)
│   ├── database.js
│   ├── storage.js
│   └── auth.js
├── tests/              # Test files
│   ├── backup.test.js
│   └── restore.test.js
└── docs/               # Documentation
    └── ...
```

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

### Examples

```bash
# Feature
git commit -m "feat(backup): add incremental backup support"

# Bug fix
git commit -m "fix(restore): handle missing bucket metadata"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Breaking change
git commit -m "feat(backup): redesign backup config format

BREAKING CHANGE: Config format changed from JSON to YAML"
```

### Scope

Use these scopes when applicable:
- `backup` - Backup functionality
- `restore` - Restore functionality
- `storage` - Storage operations
- `database` - Database operations
- `auth` - Authentication operations
- `docker` - Docker-related changes
- `ci` - CI/CD changes
- `docs` - Documentation

## Testing Guidelines

### Manual Testing

Before submitting a PR, test these scenarios:

1. **Full backup** on a test project
   ```bash
   npm run backup
   ```

2. **Partial backups**
   ```bash
   npm run backup:db
   npm run backup:storage
   ```

3. **Restore** to a new project
   ```bash
   node restore.js ./backups/YYYY-MM-DD_HH-MM-SS
   ```

4. **Verification**
   ```bash
   npm run verify
   ```

5. **Edge cases**
   - Empty database
   - Large files
   - Special characters in filenames
   - Network interruptions

### Automated Testing (Future)

When we add automated tests, run:
```bash
npm test
npm run test:integration
```

## Documentation

### Code Comments

```javascript
// ✅ Good - Explains WHY, not WHAT
// Skip system tables to avoid permission errors
if (table.schema === 'pg_catalog') continue;

// ❌ Bad - States the obvious
// Loop through tables
for (const table of tables) { ... }
```

### Documentation Files

When updating documentation:
- Use clear, concise language
- Include code examples
- Add screenshots for UI-related features
- Test all commands/examples
- Update table of contents

## Questions?

- 💬 Open a [Discussion](https://github.com/brunobrise/supabase-backup/discussions)
- 🐛 File an [Issue](https://github.com/brunobrise/supabase-backup/issues)
- 📧 Contact maintainers

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for contributing! 🎉
