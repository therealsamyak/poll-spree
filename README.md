# Poll Spree 🗳️

A modern, real-time polling application built with React, TanStack Router, and Convex. Create polls, vote on them, and see results in real-time with a beautiful, responsive interface.

![Poll Spree](https://img.shields.io/badge/Poll-Spree-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Convex](https://img.shields.io/badge/Convex-000000?style=for-the-badge&logo=convex&logoColor=white)

## ✨ Features

- **🗳️ Create & Vote on Polls** - Create custom polls with multiple options and vote on them
- **👀 Real-time Results** - See poll results update instantly as votes come in
- **🔐 User Authentication** - Secure authentication with Clerk
- **👤 User Profiles** - Custom usernames and profile images
- **📱 Responsive Design** - Beautiful UI that works on all devices
- **🌙 Dark/Light Mode** - Toggle between themes
- **⚡ Instant Updates** - Real-time data synchronization with Convex
- **🎨 Modern UI** - Built with shadcn/ui components and Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Bun](https://bun.sh/) (recommended) or npm
- [Convex](https://convex.dev/) account

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd poll-spree-2
   ```

2. **Install dependencies**

   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up Convex backend**

   ```bash
   bun run convex:codegen
   bun run convex:dev
   ```

   Follow the prompts to create a new Convex project and connect it to your application.

4. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   VITE_CONVEX_URL=your_convex_url
   ```

5. **Start the development server**

   ```bash
   bun run dev:frontend
   # or
   npm run dev:frontend
   ```

6. **Open your browser**

   Navigate to [http://localhost:3001](http://localhost:3001) to see the application.

## 🏗️ Tech Stack

### Frontend

- **React 19** - Modern React with concurrent features
- **TanStack Router** - Type-safe file-based routing
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Lucide React** - Beautiful icons
- **React Hook Form** - Performant forms with validation
- **Zod** - TypeScript-first schema validation

### Backend

- **Convex** - Reactive backend-as-a-service
- **Real-time Database** - Automatic data synchronization
- **Type-safe API** - Full TypeScript support

### Authentication

- **Clerk** - Complete authentication solution
- **User Management** - Profiles, usernames, and avatars

### Development Tools

- **Vite** - Fast build tool and dev server
- **Biome** - Fast linter and formatter
- **Bun** - Fast JavaScript runtime and package manager

## 📁 Project Structure

```text
poll-spree-2/
├── convex/                 # Backend functions and schema
│   ├── _generated/        # Auto-generated Convex types
│   ├── polls.ts           # Poll-related mutations and queries
│   ├── schema.ts          # Database schema definition
│   └── healthCheck.ts     # Health check endpoint
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components (shadcn/ui)
│   │   ├── poll-card.tsx # Individual poll display
│   │   ├── polls-list.tsx # Polls listing
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

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `bun dev:frontend` | Start the frontend development server |
| `bun dev:backend` | Start the Convex development server |
| `bun build` | Build both frontend and backend |
| `bun build:frontend` | Build only the frontend |
| `bun build:backend` | Deploy the backend to Convex |
| `bun preview` | Preview the production build |
| `bun check` | Run Biome linting and formatting |
| `bun check-types` | Check TypeScript types |
| `bun convex:codegen` | Generate Convex TypeScript types |
| `bun convex:dev` | Start Convex development server |
| `bun convex:deploy` | Deploy to Convex production |

## 🗄️ Database Schema

The application uses Convex with the following main tables:

- **`polls`** - Stores poll questions, metadata, and vote counts
- **`pollOptions`** - Individual poll options with vote tracking
- **`pollUsers`** - Tracks user votes on polls
- **`users`** - User profiles with usernames and avatars

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key

# Convex Backend
VITE_CONVEX_URL=https://your-project.convex.cloud
```

### Convex Setup

1. Create a Convex account at [convex.dev](https://convex.dev)
2. Create a new project
3. Run `bun run convex:dev` and follow the setup prompts
4. Copy the generated URL to your environment variables

## 🚀 Deployment

### Frontend Deployment

The frontend can be deployed to any static hosting service:

```bash
bun run build:frontend
```

### Backend Deployment

The Convex backend is automatically deployed:

```bash
bun run convex:deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Built with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Authentication by [Clerk](https://clerk.com/)
- Backend by [Convex](https://convex.dev/)

---

Made with ❤️ using modern web technologies
