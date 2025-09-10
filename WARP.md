# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

PrepUp is a full-stack online test preparation platform for competitive examinations like CAT and GATE. It features a hybrid architecture with a Node.js/Express main server, Django authentication server, React frontend, and PostgreSQL database with Drizzle ORM.

## Development Commands

### Main Development Workflow
```bash
# Install dependencies
npm install

# Start development server (includes both frontend and backend with hot-reload)
npm run dev

# Type check across the entire monorepo
npm run check

# Database schema push
npm run db:push
```

### Production Build & Deployment
```bash
# Build for production (builds both client and server)
npm run build

# Run production server
npm run start
```

### Python/Django Auth Server
```bash
# Navigate to auth server directory
cd auth_server

# Install Python dependencies (requires Python >=3.12)
uv install  # or pip install -r requirements.txt

# Run Django migrations
python manage.py migrate

# Start Django auth server for network access (port 8000)
python manage.py runserver 0.0.0.0:8000
```

### Database Operations
```bash
# Push schema changes to database
npm run db:push

# Generate Drizzle migrations (when needed)
npx drizzle-kit generate

# View database schema
npx drizzle-kit introspect
```

### Running Tests
```bash
# Run Python tests for auth server
cd auth_server && python manage.py test

# TypeScript/frontend tests would typically be:
# npm run test (not currently configured)
```

## Architecture Overview

### Hybrid Backend Architecture
The project uses a **dual backend architecture**:

1. **Main Server** (`server/`): Node.js/Express/TypeScript
   - Handles quiz data, practice tests, study materials, courses
   - Uses PostgreSQL with Drizzle ORM
   - Serves the React frontend in production
   - Port: 5000 (default)

2. **Auth Server** (`auth_server/`): Django/Python
   - Handles user authentication, registration, tokens
   - Uses Django REST Framework with token authentication
   - Separate PostgreSQL database for auth
   - Custom User model in `users` app

### Frontend Architecture (`client/`)
- **React 18** with **TypeScript**
- **Vite** for development and building
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **TanStack Query** for server state management
- **shadcn/ui** + **Tailwind CSS** for UI components
- **KaTeX** for mathematical notation rendering

### Database Schema (`shared/schema.ts`)
Core entities and relationships:
- **Users**: Student profiles with exam types (CAT/GATE)
- **Courses**: Paid course offerings with features and pricing
- **Study Materials**: PDFs, videos, practice sets with ratings
- **Practice Tests**: Quiz collections with questions and metadata
- **Test Sessions**: User attempts with answers and scoring
- **User Progress**: Course completion tracking

### Data Structure
Quiz questions are stored as JSON files in `data/`:
- `data/cat/`: CAT exam questions (quantitative-aptitude, verbal-ability, data-interpretation)
- `data/gate/`: GATE exam questions (computer-science, general-aptitude, mathematics)

Each question follows the interface:
```typescript
interface Question {
  qid: string;
  passage_text: string;
  question_text: string;
  options: QuestionOption[];
  correct_option_data: string;
  solution_text: string | null;
  full_markdown: string;
}
```

## Key Technical Patterns

### Monorepo Structure
- `client/src/`: Frontend React app with pages, components, hooks, lib utilities
- `server/`: Express API routes and storage layer
- `shared/`: Database schema and types shared between client/server
- `auth_server/`: Django authentication microservice

### Path Aliases (configured in tsconfig.json & vite.config.ts)
- `@/*`: Maps to `client/src/*`
- `@shared/*`: Maps to `shared/*`
- `@assets/*`: Maps to `attached_assets/*`

### State Management Pattern
- **Server State**: TanStack Query for API calls and caching
- **Auth State**: React Context (`contexts/auth-context.tsx`)
- **UI State**: React hooks and local component state
- **Form State**: React Hook Form with Zod validation

### API Architecture
RESTful API with consistent patterns:
- `/api/users`, `/api/courses`, `/api/study-materials`
- `/api/practice-tests`, `/api/test-sessions`
- Error handling with proper HTTP status codes
- Request logging middleware in development

## Environment Setup

### Required Environment Variables
Create `.env` file in root:
```bash
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
```

### Database Requirements
- PostgreSQL database (recommended: Neon.tech for development)
- Separate auth database for Django (configured in auth_server/settings.py)

### Node.js Requirements
- Node.js v20.x or later
- Package manager: npm/pnpm/yarn

## Network Access Configuration

The application is configured to work across multiple devices on the same network:

### Main Server (Port 5000)
- Automatically binds to `0.0.0.0:5000` (all network interfaces)
- CORS configured to accept requests from any origin
- Frontend dynamically adapts to the current hostname

### Django Auth Server (Port 8000)
- Must be started with `0.0.0.0:8000` for network access
- `ALLOWED_HOSTS = ['*']` configured for development
- CORS headers enabled for cross-origin requests

### Accessing from other devices
1. Find your laptop's IP address: `ip addr show | grep "inet.*scope global"`
2. Start both servers as described above
3. Access from other devices using: `http://YOUR_LAPTOP_IP:5000`
4. Authentication will automatically work across all devices

## Development Workflow

### Frontend Development
- Components use shadcn/ui patterns with Tailwind CSS
- All new UI should follow the existing shadcn component structure
- Use the `@/components/ui/` namespace for reusable components
- Page components go in `client/src/pages/`
- Custom hooks in `client/src/hooks/`

### Backend Development
- Follow the existing Express route patterns in `server/routes.ts`
- Database operations go through the storage layer (`server/storage.ts`)
- Use Zod schemas for request validation
- Maintain the shared schema in `shared/schema.ts` as the single source of truth

### Database Development
- Schema changes should be made in `shared/schema.ts`
- Use `npm run db:push` to sync changes to database
- Follow Drizzle ORM patterns for type-safe database operations

### Adding New Features
1. Update database schema in `shared/schema.ts` if needed
2. Add API routes in `server/routes.ts` with proper validation
3. Implement storage layer functions in `server/storage.ts`
4. Create frontend components and pages as needed
5. Add proper TypeScript types and error handling

## Production Considerations

### Build Process
- Vite builds the frontend to `dist/public/`
- esbuild bundles the server to `dist/index.js`
- Production server serves static files from `dist/public/`

### Environment-Specific Behavior
- Development: Vite dev server with HMR + tsx for backend hot-reload
- Production: Express serves built static files + compiled server bundle

### Database Deployment
- Use `npm run db:push` to sync schema to production database
- Ensure DATABASE_URL points to production PostgreSQL instance
- Consider running migrations for schema versioning in production
