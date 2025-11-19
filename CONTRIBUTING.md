# Contributing to Poll Spree

Welcome! We're excited to have you contribute to Poll Spree.

## Prerequisites

Before you start, make sure you have:

- **Node.js** (v18 or higher)
- **Bun** - Our primary package manager and runtime
- **Git** - For version control
- **GitHub CLI** - For GitHub operations
- **Convex account** - For backend services

## Development Environment Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub first
gh repo fork poll-spree --clone
cd poll-spree
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Configure your environment variables
# You'll need:
# - Clerk authentication keys
# - Convex deployment URL
# - Other API keys as needed
```

### 4. Start Development

```bash
# Start both frontend and backend in parallel
bun run dev:f  # Frontend (port 3001)
bun run dev:b  # Backend (Convex)
```

## Development Commands

- **Linting**: `bun run check` (runs Biome linter and formatter)
- **Type checking**: `bun run check-types`
- **Build**: `bun run build`
- **Convex codegen**: `bun run convex:codegen`

## Code Style

- **Indentation**: 2 spaces
- **Line width**: 100 characters
- **Components**: PascalCase
- **Files**: kebab-case
- **Use path aliases**: `@/` for `src/`

## Project Structure

```
src/
├── components/     # React components
├── hooks/         # Custom hooks
├── lib/           # Utilities
├── routes/        # TanStack Router pages
convex/            # Backend functions and schema
```

## Contributing Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run `bun run check` and `bun run check-types`
4. Test your changes
5. Submit a pull request

## Getting Help

- Check existing issues and discussions
- Read the code comments and documentation
- Ask questions in GitHub discussions

Happy coding! 🚀