# PollSpree

Real-time polling app. Create polls, vote, comment, see results instantly.

**Live:** [pollspree.com](https://pollspree.com)

![PollSpree](https://img.shields.io/badge/Poll-Spree-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Convex](https://img.shields.io/badge/Convex-000000?style=for-the-badge&logo=convex&logoColor=white)

## Features

- Create & vote on polls
- Real-time results & comments
- User profiles & trending polls
- Dark/light mode
- Content moderation

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Convex (real-time database)
- **Auth:** Clerk
- **Tools:** Bun, Biome, TanStack Router

## Quick Start

```bash
git clone https://github.com/therealsamyak/poll-spree.git
cd poll-spree
bun install
cp .env.example .env.local
bun run dev
```

## Development

- `bun run dev` - Start both frontend & backend
- `bun run check` - Lint & format
- `bun run check-types` - Type check

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions.

## Database Schema

- **`polls`** - Poll questions, metadata, vote counts, views, likes
- **`pollOptions`** - Individual poll options with vote tracking
- **`pollUsers`** - User votes on polls
- **`pollLikes`** - User likes on polls
- **`comments`** - Poll comments with user info and timestamps
- **`users`** - User profiles with usernames and avatars

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

Non-Profit Open Software License - see [LICENSE](./LICENSE) for details.