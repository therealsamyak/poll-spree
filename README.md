# PollSpree

A modern, real-time polling application where you can create polls, vote on them, and see results update instantly. Built with cutting-edge web technologies for a seamless user experience.

**Live Site:** [https://pollspree.com](https://pollspree.com)

![PollSpree](https://img.shields.io/badge/Poll-Spree-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Convex](https://img.shields.io/badge/Convex-000000?style=for-the-badge&logo=convex&logoColor=white)

## Features

- **Create & Vote on Polls** - Create custom polls with multiple options and vote on them
- **Real-time Results** - See poll results update instantly as votes come in
- **User Authentication** - Secure authentication with Clerk
- **User Profiles** - Custom usernames and profile images
- **Responsive Design** - Beautiful UI that works on all devices
- **Dark/Light Mode** - Toggle between themes
- **Instant Updates** - Real-time data synchronization with Convex
- **Modern UI** - Built with shadcn/ui components and Tailwind CSS

## Tech Stack

### Frontend

- **React 19** - Modern React with concurrent features
- **TanStack Router** - Type-safe file-based routing
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components

### Backend

- **Convex** - Reactive backend-as-a-service
  - **Real-time Database** - Automatic data synchronization
  - **Type-safe API** - Full TypeScript support

### Authentication

- **Clerk** - Complete authentication solution

### Development Tools

- **Biome** - Fast linter and formatter
- **Bun** - Fast JavaScript runtime and package manager

## Database Schema

The application uses Convex with the following main tables:

- **`polls`** - Stores poll questions, metadata, and vote counts
- **`pollOptions`** - Individual poll options with vote tracking
- **`pollUsers`** - Tracks user votes on polls
- **`users`** - User profiles with usernames and avatars

## Project Structure

```text
poll-spree/
├── convex/                 # Backend functions and schema
│   ├── _generated/        # Auto-generated Convex types
│   ├── polls.ts           # Poll-related mutations and queries
│   ├── users.ts           # User-related functions
│   ├── schema.ts          # Database schema definition
│   └── badWordsFilter.ts  # Content moderation
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components (shadcn/ui)
│   │   ├── poll-card/    # Individual poll display
│   │   ├── polls-list/   # Polls listing
│   │   └── ...           # Other components
│   ├── routes/           # TanStack Router routes
│   ├── lib/              # Utility functions and configurations
│   ├── hooks/            # Custom React hooks
│   └── types.ts          # TypeScript type definitions
├── index.html            # HTML entry point
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── biome.json           # Biome linting/formatting config
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
