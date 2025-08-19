# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Closer Club is a comprehensive learning management system built with React Router v7 (Remix), featuring course management, analytics, and lead capture capabilities for teams, agents, and students.

## Tech Stack & Key Dependencies

- **Framework**: React Router v7 (Remix) with SSR
- **Runtime**: Bun (primary), Node.js compatible
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with custom role-based system
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives, shadcn-style components
- **CDN/Storage**: Bunny.net (video streaming and file storage)
- **Caching**: Redis (Upstash)
- **Code Quality**: Biome for linting and formatting
- **Forms**: React Hook Form with Zod validation

## Essential Development Commands

```bash
# Development
bun run dev              # Start development server
bun run build           # Build for production
bun run start           # Run production build

# Code Quality
bun run typecheck       # Run TypeScript type checking
bun run lint            # Run Biome linter
bun run format          # Format code with Biome

# Database
bunx drizzle-kit generate  # Generate migrations
bunx drizzle-kit migrate   # Run migrations
bun run seed             # Seed database (seed.server.ts)
```

## Architecture & Code Organization

### Route Structure
- File-based routing using React Router v7 conventions
- Route prefixes determine access control:
  - `_admin.*` - Admin-only routes
  - `_team.*` - Team leader routes
  - `_agent.*` - Agent/student routes
  - `_admin._editor.*`, `_team._editor.*`, `_agent._editor.*` - Editor layouts for each role

### Data Layer Architecture
- **Server-only code**: All `.server.ts` files run only on the server
- **Actions**: Located in `app/lib/{role}/actions/` - handle form submissions and mutations
- **Data Access**: Located in `app/lib/{role}/data-access/` - database queries and business logic
- **Loaders**: Fetch data for routes, typically call data-access functions

### Database Schema
- Core tables: `user`, `session`, `account` (auth)
- Business tables: `agentsTable`, `teamLeadersTable`, `coursesTable`, `modulesTable`, `segmentsTable`, etc.
- All tables use UUID primary keys except auth tables (text IDs from Better Auth)

### Authentication Flow
- Better Auth handles core authentication
- Custom role system: `admin`, `team-leader`, `agent`
- Protected routes check session and role in loaders
- Auth utilities in `app/lib/auth/auth.server.ts`

## Key Patterns & Conventions

### Form Handling
- Use React Router's `Form` component with action functions
- Validate with Zod schemas from `app/lib/zod-schemas/`
- Return `data()` helper with success/error messages

### File Uploads
- Bunny CDN integration through `app/lib/bunny.server.ts`
- Video uploads for course segments
- File attachments for course materials

### Component Organization
- `app/components/ui/` - Reusable UI primitives
- `app/components/features/` - Feature-specific components organized by domain
- `app/components/global/` - Shared application components
- `app/components/marketing/` - Landing page components

### Error Handling
- Use `data()` helper with appropriate HTTP status codes
- Consistent error message format in actions
- Client-side error display through toast notifications (Sonner)

## Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Better Auth secret key (minimum 32 characters, use `openssl rand -base64 32` to generate)
- `BUNNY_LIBRARY_ID` - Bunny.net Video Library ID (found in Video Library settings)
- `BUNNY_STREAM_ACCESS_KEY` - Bunny.net Stream API key (Video Library → API section)
- `BUNNY_STORAGE_ACCESS_KEY` - Bunny.net Storage Zone password (Storage Zone → FTP & API Access)
- `REDIS_URL` - Redis connection for caching

Optional environment variables:
- `MAX_VIDEO_SIZE_MB` - Maximum video upload size in MB (default: 2048 MB = 2GB). Set to adjust upload limits without code changes.

### Bunny.net Configuration

To set up Bunny.net for video and file storage:

1. **Get Stream API Key**: 
   - Go to your Video Library in Bunny.net dashboard
   - Click on the API section
   - Copy the API key and set as `BUNNY_STREAM_ACCESS_KEY`

2. **Get Storage API Key**:
   - Go to your Storage Zone in Bunny.net dashboard
   - Navigate to FTP & API Access
   - Copy the password (this is your API key) and set as `BUNNY_STORAGE_ACCESS_KEY`

3. **Get Library ID**:
   - Found in your Video Library settings
   - Set as `BUNNY_LIBRARY_ID`

Note: Each service uses its own API key - the main account API key will not work for Stream or Storage operations.

## Import Aliases

Use `~/*` alias for absolute imports from the `app` directory:
```typescript
import { auth } from "~/lib/auth/auth.server";
import { Button } from "~/components/ui/button";
```

## Testing Approach

Currently no test suite configured. When implementing tests:
- Check for test framework in package.json before assuming
- Use existing patterns if tests are added later

## Security Considerations

- All server-side code in `.server.ts` files
- Role-based access control enforced at route level
- SQL injection prevention through Drizzle ORM
- Input validation with Zod schemas
- Rate limiting via Upstash Redis

## Performance Optimizations

- Server-side rendering with React Router v7
- CDN for video/file delivery (Bunny.net)
- Redis caching for frequently accessed data
- Database indexes on foreign keys and frequently queried fields

## Video Upload System

### Upload Methods
The system automatically selects the optimal upload method based on file size:
- **Direct upload** (< 100MB): Simple XMLHttpRequest for smaller files
- **Chunked upload** (100MB - 500MB): Custom chunked implementation with resume capability
- **TUS resumable upload** (> 500MB): Industry-standard resumable upload protocol

### Features
- **Configurable size limits**: Set via `MAX_VIDEO_SIZE_MB` environment variable
- **Progress tracking**: Real-time progress with speed and time estimates
- **Pause/Resume**: Users can pause and resume large uploads
- **Automatic retry**: Failed chunks are automatically retried with exponential backoff
- **Session persistence**: Upload sessions survive browser refreshes
- **Memory optimization**: Large files are processed in chunks to prevent browser memory issues

### File Size Recommendations
- **Default limit**: 2GB (configurable via environment variable)
- **Optimal range**: 100MB - 1GB for best balance of quality and upload time
- **Bunny.net limit**: Supports up to 30GB per file
- **Performance tip**: Encourage H.264/H.265 compression for optimal delivery