# Advent Calendar

[English](README.md) | [日本語](README.ja.md)

An advent calendar website for engineers. A web application that allows publishing articles daily from December 1st to 25th.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)

## Features

- 📅 **Calendar Display**: User-friendly display of articles from December 1st to 25th
- ✍️ **Markdown Editor**: Advanced editor with real-time preview (CodeMirror 6)
- 🌓 **Dark Mode**: Toggle between Light/Dark/System themes
- 🔒 **Authentication**: Admin authentication with NextAuth.js
- 🏷️ **Tag Management**: Article categorization
- 📤 **Export/Import**: Manage articles as Markdown files
- 🎨 **Responsive Design**: Mobile, tablet, and desktop support
- ⚡ **High Performance**: Fast rendering with ISR, image optimization, and code splitting
- ♿ **Accessibility**: WCAG AA compliant with keyboard navigation support

## Tech Stack

### Frontend
- **Next.js 16** - React framework (App Router)
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Accessible UI components
- **CodeMirror 6** - Markdown editor
- **react-markdown** - Markdown rendering

### Backend
- **Next.js API Routes** - API endpoints
- **Prisma ORM** - Database management
- **SQLite** (development) / **PostgreSQL** (production)
- **NextAuth.js** - Authentication and session management
- **bcrypt** - Password hashing
- **Zod** - Validation

### Development Tools
- **Biome** - Linter + Formatter
- **@next/bundle-analyzer** - Bundle size analysis
- **Playwright** - Screenshot capture and E2E testing infrastructure

## Setup

### Requirements

- Node.js 20 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/username/advent-calendar.git
   cd advent-calendar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="development-secret"
   ADMIN_USERNAME="admin"
   ADMIN_PASSWORD="password"
   ADMIN_EMAIL="admin@example.com"
   ```

4. **Setup database**
   ```bash
   # Run migrations
   npx prisma migrate dev

   # Seed initial data (admin user + sample articles)
   npx prisma db seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Access at http://localhost:3000

### Admin Panel Access

- URL: http://localhost:3000/admin/login
- Username: `admin` (configured in environment variables)
- Password: `password` (configured in environment variables)

## Usage

### Creating Articles

1. Login to admin panel
2. Click "Create New Article"
3. Enter title, date (1-25), content (Markdown), tags, and status
4. Click "Save"

### Editing Articles

1. Select an article from the dashboard or article list
2. Modify content in the edit page
3. Auto-save is enabled (2-second debounce)
4. Manual save is also available via "Save" button

### Export/Import Articles

**Export**:
- Click "Export" button on each article's edit page
- Download as Markdown file (with frontmatter)

**Import**:
- Click "Import" in the dashboard
- Upload a Markdown file
- Option to overwrite existing articles

## Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Run formatter
npm run format

# Run linter + formatter (auto-fix)
npm run check

# Analyze bundle size
npm run analyze

# Database migration
npx prisma migrate dev

# Open Prisma Studio (GUI)
npx prisma studio

# Seed database
npx prisma db seed

# Playwright screenshot capture (desktop, light mode)
npm run debug:screenshot

# Playwright screenshot capture (mobile, light/dark)
npm run debug:screenshot:mobile

# Playwright screenshot capture (desktop, dark mode)
npm run debug:screenshot:dark

# Open Playwright debug browser
npm run debug:browser

# Install Playwright browsers
npm run playwright:install
```

## Playwright Screenshot Feature

Provides screenshot capture functionality using Playwright for visual verification during development.

### Setup

1. **Install Playwright browsers**
   ```bash
   npm run playwright:install
   ```

### Usage

**Prerequisites**: Development server must be running.
```bash
npm run dev
```

#### Desktop View (Light Mode) Screenshots

```bash
npm run debug:screenshot
```

Captures screenshots of:
- Calendar list page
- Article detail page (if exists)
- Admin login page

Saved to: `screenshots/desktop/light/`

#### Desktop View (Dark Mode) Screenshots

```bash
npm run debug:screenshot:dark
```

Saved to: `screenshots/desktop/dark/`

#### Mobile View (Light/Dark) Screenshots

```bash
npm run debug:screenshot:mobile
```

Captures screenshots with Pixel 5 emulation.

Saved to:
- Light mode: `screenshots/mobile/light/`
- Dark mode: `screenshots/mobile/dark/`

#### Open Debug Browser

```bash
npm run debug:browser
```

Opens Playwright browser for manual interaction. Useful for debugging.

### Troubleshooting

#### Development Server Not Running

```
❌ Next.js development server is not running
   Please run `npm run dev`
```

**Solution**: Run `npm run dev` in another terminal and verify http://localhost:3000 is accessible.

#### Browser Won't Launch

```
❌ Error: browserType.launch: Executable doesn't exist
```

**Solution**: Install Playwright browsers.

```bash
npm run playwright:install
```

#### Screenshots Not Saved

**Solution**: Check write permissions for the `screenshots/` directory. The script automatically creates directories, but if permission errors occur, create them manually.

```bash
mkdir -p screenshots/desktop/light screenshots/desktop/dark screenshots/mobile/light screenshots/mobile/dark
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel deployment instructions.

## Directory Structure

```
advent-calendar/
├── .claude/                # Agent management files
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── playwright/             # Playwright scripts
│   ├── config.ts           # Playwright configuration
│   ├── scripts/            # Screenshot capture scripts
│   │   ├── screenshot.ts
│   │   ├── screenshot-dark.ts
│   │   ├── screenshot-mobile.ts
│   │   └── open-browser.ts
│   └── utils/              # Utility functions
│       ├── server-check.ts
│       └── paths.ts
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration files
│   └── seed.ts             # Seed data
├── public/                 # Static files
├── screenshots/            # Screenshot storage (Git excluded)
│   ├── desktop/
│   │   ├── light/
│   │   └── dark/
│   └── mobile/
│       ├── light/
│       └── dark/
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (public)/       # Public pages
│   │   ├── admin/          # Admin pages
│   │   └── api/            # API Routes
│   ├── components/         # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── theme/          # Theme-related components
│   │   ├── calendar/       # Calendar display
│   │   ├── post/           # Article display
│   │   ├── editor/         # Markdown editor
│   │   └── layout/         # Layout components
│   ├── lib/                # Utilities
│   ├── types/              # Type definitions
│   └── middleware.ts       # Authentication middleware
├── .env.example            # Environment variable template
├── .env.production.example # Production environment template
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── biome.json              # Biome configuration
└── package.json
```

## Troubleshooting

### Database Connection Error

```bash
# Regenerate Prisma Client
npx prisma generate

# Reset database (Warning: deletes all data)
npx prisma migrate reset
```

### Build Error

```bash
# Clear cache
rm -rf .next
npm run build
```

### Type Error

```bash
# Regenerate Prisma Client
npx prisma generate

# Clear TypeScript cache
rm -rf node_modules/.cache
```

### Cannot Login

- Check `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env.local`
- Verify seed data has been inserted (`npx prisma db seed`)
- Clear browser cookies

## License

MIT License

## Contributing

Issues and Pull Requests are welcome!

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## Support

If you encounter any issues, please create an [Issue](https://github.com/username/advent-calendar/issues).
