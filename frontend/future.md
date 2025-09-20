# Overview

This is a comprehensive online exam preparation platform called "PrepUp" designed to help students prepare for competitive exams like CAT and GATE. The application features a modern full-stack architecture with React frontend, Express.js backend, and PostgreSQL database integration. It provides practice tests, study materials, user progress tracking, and course management functionality.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for consistent, accessible design
- **Styling**: Tailwind CSS with custom design system including dark mode support
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful APIs with comprehensive route handling
- **Middleware**: Custom logging, error handling, and request processing
- **Development**: Hot reload with Vite integration in development mode

## Database & ORM
- **Database**: PostgreSQL with connection pooling
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Centralized schema definitions with Zod validation
- **Migrations**: Drizzle Kit for database migrations and schema management

## Key Features & Modules
- **User Management**: Registration, authentication, and profile management
- **Course System**: Structured courses for different exam types (CAT, GATE)
- **Practice Tests**: Interactive test interface with timer, question navigation, and result tracking
- **Study Materials**: Resource management with filtering and categorization
- **Progress Tracking**: User performance analytics and streak management
- **Session Management**: Test session state management and persistence

## Shared Type System
- **Schema Definitions**: Centralized in `/shared/schema.ts` with Drizzle and Zod integration
- **Type Safety**: End-to-end type safety from database to frontend
- **Validation**: Consistent validation rules across client and server

## Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **Code Quality**: TypeScript with strict configuration
- **Styling**: PostCSS with Tailwind CSS processing
- **Development Experience**: Hot module replacement and error overlays

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting via `@neondatabase/serverless`
- **Connection Management**: PostgreSQL session store with `connect-pg-simple`

## UI Component Libraries
- **Radix UI**: Comprehensive set of accessible React components including dialogs, dropdowns, navigation, forms, and data display components
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Carousel/slider functionality for content display

## Utility Libraries
- **Class Variance Authority**: Component variant management for design system
- **clsx & tailwind-merge**: Conditional CSS class utilities
- **date-fns**: Date manipulation and formatting
- **cmdk**: Command palette interface component

## Development Dependencies
- **Vite Plugins**: React support, runtime error handling, and Replit-specific tooling
- **TypeScript**: Full type checking and compilation
- **ESBuild**: Fast JavaScript bundling for production builds

## Authentication & Session Management
- **Express Session**: Session-based authentication with PostgreSQL storage
- **Session Store**: Persistent session management using `connect-pg-simple`

## API Integration
- **TanStack Query**: Server state synchronization, caching, and background updates
- **Fetch API**: Native HTTP client for API communications with credential management