# PollSpree

A modern, real-time polling application where you can create polls, vote on them, comment, and see results update instantly. Built with cutting-edge web technologies for a seamless user experience.

**Live Site:** [https://pollspree.com](https://pollspree.com)

![PollSpree](https://img.shields.io/badge/Poll-Spree-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Convex](https://img.shields.io/badge/Convex-000000?style=for-the-badge&logo=convex&logoColor=white)

## Features

- **Create & Vote on Polls** - Create custom polls with multiple options and vote on them
- **Real-time Results** - See poll results update instantly as votes come in
- **Comments System** - Comment on polls with real-time updates and profanity filtering
- **Poll Likes** - Like polls to show appreciation
- **Trending Polls** - Discover popular polls on the dedicated trending page
- **User Profiles** - Custom usernames, profile images, and public profile pages
- **Advanced Filtering** - Filter user polls by "authored" or "voted" status
- **Poll Sorting** - Sort by recent, oldest, most-voted, or least-voted
- **View Tracking** - Track poll view counts
- **Infinite Scroll** - Smooth browsing through polls with virtual scrolling
- **User Authentication** - Secure authentication with Clerk
- **Responsive Design** - Beautiful UI that works on all devices
- **Dark/Light Mode** - Toggle between themes
- **SEO Optimized** - Comprehensive SEO with structured data and sitemaps
- **Content Moderation** - Automatic profanity filtering for polls and comments
- **Instant Updates** - Real-time data synchronization with Convex
- **Modern UI** - Built with shadcn/ui components and Tailwind CSS

## Tech Stack

### Frontend

- **React 19** - Modern React with concurrent features
- **TanStack Router** - Type-safe file-based routing
- **TanStack Query** - Server state management
- **TypeScript** - Full type safety
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **React Hook Form** - Form handling with validation
- **date-fns** - Date formatting utilities
- **react-window** - Virtual scrolling for performance
- **sonner** - Toast notifications
- **Radix UI** - Accessible UI primitives

### Backend

- **Convex** - Reactive backend-as-a-service
  - **Real-time Database** - Automatic data synchronization
  - **Type-safe API** - Full TypeScript support
  - **Server Functions** - Backend logic with full TypeScript support

### Authentication

- **Clerk** - Complete authentication solution

### Content Moderation

- **bad-words** - Profanity filtering library

### Development Tools

- **Biome** - Fast linter and formatter (2 spaces, 100 char width)
- **Bun** - Fast JavaScript runtime and package manager
- **Lefthook** - Git hooks for pre-commit checks
- **Concurrently** - Run multiple scripts together
- **Zod** - Schema validation

## Database Schema

The application uses Convex with the following main tables:

- **`polls`** - Stores poll questions, metadata, vote counts, views, and likes
- **`pollOptions`** - Individual poll options with vote tracking
- **`pollUsers`** - Tracks user votes on polls
- **`pollLikes`** - Tracks user likes on polls
- **`comments`** - Poll comments with user info and timestamps
- **`users`** - User profiles with usernames, avatars, and custom profile data

## Project Structure

```text
poll-spree/
├── convex/                 # Backend functions and schema
│   ├── _generated/        # Auto-generated Convex types
│   ├── polls.ts           # Poll-related mutations and queries
│   ├── users.ts           # User-related functions
│   ├── comments.ts        # Comment system functions
│   ├── schema.ts          # Database schema definition
│   ├── badWordsFilter.ts  # Content moderation
│   └── badWordsList.ts    # Profanity word list
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components (shadcn/ui)
│   │   ├── poll-card/    # Individual poll display
│   │   ├── polls-list/   # Polls listing
│   │   ├── comments/     # Comment system
│   │   ├── user-polls/   # User poll management
│   │   ├── sidebar/      # Navigation sidebar
│   │   ├── seo/          # SEO components
│   │   ├── custom-profile-dialog/  # Profile customization
│   │   ├── username-setup/         # Username setup
│   │   └── ...           # Other components
│   ├── routes/           # TanStack Router routes
│   │   ├── __root.tsx    # Root layout
│   │   ├── index.tsx     # Home page
│   │   ├── polls.$pollId.tsx     # Individual poll page
│   │   ├── trending.tsx  # Trending polls page
│   │   ├── users.$username.tsx   # User profile pages
│   │   ├── sign-in.tsx   # Sign in page
│   │   ├── sign-up.tsx   # Sign up page
│   │   └── sitemap.xml.tsx       # Sitemap generation
│   ├── lib/              # Utility functions and configurations
│   │   ├── utils.ts      # General utilities
│   │   ├── clerk.ts      # Clerk configuration
│   │   ├── seo.ts        # SEO utilities
│   │   └── badWordsFilter.ts     # Client-side profanity filter
│   ├── hooks/            # Custom React hooks
│   │   ├── useCreatePoll.ts       # Poll creation hook
│   │   └── index.ts      # Hook exports
│   ├── types.ts          # TypeScript type definitions
│   ├── index.css         # Global styles
│   └── main.tsx          # Application entry point
├── public/               # Static assets
├── index.html            # HTML entry point
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
├── biome.json           # Biome linting/formatting config
├── components.json       # shadcn/ui configuration
├── lefthook.yml         # Git hooks configuration
└── LICENSE              # License file
```

## Development

### Prerequisites

- **Bun** - JavaScript runtime and package manager
- **Node.js** (optional, for some tools)

### Getting Started

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/poll-spree.git
   cd poll-spree
   ```

2. Install dependencies
   ```bash
   bun install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Fill in your environment variables
   ```

4. Start development servers
   ```bash
   # Start both frontend and backend
   bun run dev
   
   # Or start them separately
   bun run dev:f  # Frontend only (port 3001)
   bun run dev:b  # Backend only
   ```

### Available Scripts

- **`bun run dev`** - Start both frontend and backend in parallel
- **`bun run dev:f`** - Build and run frontend on port 3001
- **`bun run dev:b`** - Run Convex backend with codegen
- **`bun run build`** - Build both frontend and backend
- **`bun run build:frontend`** - Build frontend only
- **`bun run build:backend`** - Deploy to Convex
- **`bun run check`** - Run Biome linter and formatter with auto-fix
- **`bun run check-types`** - Run TypeScript compiler check
- **`bun run convex:codegen`** - Generate TypeScript types from Convex schema
- **`bun run convex:dev`** - Start Convex development server
- **`bun run convex:deploy`** - Deploy to Convex production
- **`bun run update`** - Update dependencies to latest versions
- **`bun run prepare`** - Set up Git hooks (runs automatically on install)

### Code Style

- **Indentation**: 2 spaces
- **Line width**: 100 characters
- **Semicolons**: As-needed (Biome config)
- **Quotes**: Double quotes for strings
- **Path aliases**: Use `@/` for `src/`, `@/components/`, `@/hooks/`, `@/lib/`, `@/routes/`
- **Auto-organize imports**: Enabled in Biome

### Git Hooks

The project uses Lefthook for Git hooks:
- **Pre-commit**: Runs Biome check and TypeScript type checking
- **Pre-push**: Runs tests (when available)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Contributors

<a href="https://github.com/therealsamyak/poll-spree/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=therealsamyak/poll-spree" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## Star History

<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="
      https://api.star-history.com/svg?repos=therealsamyak/poll-spree&type=Date&theme=dark
    "
  />
  <source
    media="(prefers-color-scheme: light)"
    srcset="
      https://api.star-history.com/svg?repos=therealsamyak/poll-spree&type=Date
    "
  />
  <img
    alt="Star History Chart"
    src="https://api.star-history.com/svg?repos=therealsamyak/poll-spree&type=Date"
  />
</picture>

## License

This project is open source under the [Non-Profit Open Software License](LICENSE) - see the LICENSE file for details.

**Copyright © 2025 Samyak Kakatur**
