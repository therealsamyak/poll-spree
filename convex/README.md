# Convex Backend

This directory contains the Convex backend functions and schema for Poll Spree.

## Files

- **`schema.ts`** - Database schema definition for polls, users, and votes
- **`polls.ts`** - Poll-related mutations and queries (create, vote, list polls)
- **`users.ts`** - User management functions
- **`badWordsFilter.ts`** - Content moderation for poll creation
- **`_generated/`** - Auto-generated TypeScript types (do not edit)

## Development

```bash
# Generate types
bun run convex:codegen

# Start development server
bun run convex:dev

# Deploy to production
bun run convex:deploy
```

For more information about Convex functions, see the [Convex documentation](https://docs.convex.dev/functions).
