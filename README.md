
# PrepUp - Online Test Preparation Platform

PrepUp is a full-stack web application designed to help students prepare for competitive examinations like CAT (Common Admission Test) and GATE (Graduate Aptitude Test in Engineering). It provides a modern, clean, and intuitive interface for taking practice tests and quizzes.

## ✨ Features

- **Realistic Test Environment**: Simulates the experience of actual exams with timed quizzes and a variety of question types.
- **Multiple Subjects**: Covers various subjects across different exams, organized into categories like Quantitative Aptitude, Verbal Ability, Data Interpretation, etc.
- **Rich Content Rendering**: Supports complex mathematical notations using KaTeX and provides a clean reading experience for passages.
- **User Dashboard**: A dedicated space for users to track their progress and review past attempts (feature in development).
- **Responsive Design**: Fully responsive interface that works on all devices, from desktops to mobile phones.

## 🚀 Tech Stack

This project is a monorepo-like structure, combining a React frontend with a Node.js backend.

| Category      | Technology                                                                                               |
|---------------|----------------------------------------------------------------------------------------------------------|
| **Backend**   | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [TSX](https://github.com/esbuild-kit/tsx) |
| **Frontend**  | [React](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)     |
| **Database**  | [PostgreSQL](https://www.postgresql.org/), [Drizzle ORM](https://orm.drizzle.team/), [Neon](https://neon.tech/) |
| **Styling**   | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Lucide Icons](https://lucide.dev/) |
| **Routing**   | [Wouter](https://github.com/molefrog/wouter) (Client-side)                                               |
| **API & State** | [TanStack Query](https://tanstack.com/query/latest) (Server State), [Zod](https://zod.dev/) (Validation) |
| **Auth**      | [Passport.js](http://www.passportjs.org/) (Local Strategy), [Express Session](https://github.com/expressjs/session) |

## 📂 Project Structure

The repository is organized to keep the client, server, and shared code separate and maintainable.

```
/
├── client/               # Frontend React application (Vite)
│   ├── src/
│   │   ├── components/   # Reusable UI components (including shadcn/ui)
│   │   ├── pages/        # Top-level page components
│   │   ├── lib/          # Utility functions, query client
│   │   ├── hooks/        # Custom React hooks
│   │   └── App.tsx       # Main app component with routing
│   └── index.html        # Entry point for the frontend
├── server/               # Backend Node.js application (Express)
│   ├── index.ts          # Main server entry point
│   └── routes.ts         # API route definitions
├── shared/               # Code shared between client and server
│   └── schema.ts         # Drizzle ORM database schema
├── data/                 # Static JSON data for quizzes
│   ├── cat/
│   └── gate/
├── drizzle.config.ts     # Drizzle Kit configuration
├── package.json          # Project dependencies and scripts
└── vite.config.ts        # Vite configuration
```

## 🏁 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) (v20.x or later recommended)
- [pnpm](https://pnpm.io/installation) (or npm/yarn)
- A [PostgreSQL](https://www.postgresql.org/download/) database. You can get a free one from [Neon](https://neon.tech/).

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd PrepUp
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of the project and add your PostgreSQL database connection string:
    ```env
    DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
    ```

4.  **Sync the database schema:**

    Push the schema defined in `shared/schema.ts` to your database using Drizzle Kit.
    ```bash
    npm run db:push
    ```

### Running the Application

-   **Development:**
    To run the application in development mode (with hot-reloading for both client and server), use:
    ```bash
    npm run dev
    ```
    This will start the server on `http://localhost:5000`.

-   **Production Build:**
    To build the optimized frontend and backend assets for production:
    ```bash
    npm run build
    ```

-   **Start Production Server:**
    To serve the production-ready application:
    ```bash
    npm run start
    ```

## 📜 Available Scripts

-   `npm run dev`: Starts the Vite dev server for the frontend and `tsx` for the backend.
-   `npm run build`: Bundles the client with Vite and the server with esbuild.
-   `npm run start`: Runs the built application from the `dist/` directory.
-   `npm run check`: Runs the TypeScript compiler to check for type errors.
-   `npm run db:push`: Pushes the Drizzle ORM schema to the database.

# Ed-Tech Platform

This is a full-stack educational platform with a Django backend and a React frontend.

## Features

- User authentication (login, signup)
- Practice tests
- Mock tests
- Sectional tests
- Study materials
- And more!

## Adding Questions

A new feature has been added to allow logged-in users to add new questions to the question bank.

### Via the Frontend

1.  Log in to the application.
2.  Navigate to the `/add-question` page.
3.  Fill out the form with the new question details.
4.  Click "Add Question".

### Via the API

You can also add questions directly via the API by sending a `POST` request to `/api/questions/add/`.

**Endpoint:** `/api/questions/add/`

**Method:** `POST`

**Authentication:** Required (user must be logged in)

**Request Body:**

```json
{
  "examType": "cat",
  "subject": "quantitative-aptitude",
  "question": {
    "passage_text": "An optional passage for the question.",
    "question_text": "The text of the question.",
    "options": [
      {
        "option_text": "Option A",
        "is_correct": false
      },
      {
        "option_text": "Option B (Correct)",
        "is_correct": true
      }
    ],
    "solution_text": "An optional explanation for the solution."
  }
}
```

The `examType` and `subject` fields determine which JSON file the question will be added to. For example, the data above would be added to `auth_server/data/cat/quantitative-aptitude.json`.

# PrepUp - Online Test Preparation Platform

PrepUp is a full-stack web application designed to help students prepare for competitive examinations like CAT (Common Admission Test) and GATE (Graduate Aptitude Test in Engineering). It provides a modern, clean, and intuitive interface for taking practice tests and quizzes.

## ✨ Features

- **Realistic Test Environment**: Simulates the experience of actual exams with timed quizzes and a variety of question types.
- **Multiple Subjects**: Covers various subjects across different exams, organized into categories like Quantitative Aptitude, Verbal Ability, Data Interpretation, etc.
- **Rich Content Rendering**: Supports complex mathematical notations using KaTeX and provides a clean reading experience for passages.
- **User Dashboard**: A dedicated space for users to track their progress and review past attempts (feature in development).
- **Responsive Design**: Fully responsive interface that works on all devices, from desktops to mobile phones.

## 🚀 Tech Stack

This project is a monorepo-like structure, combining a React frontend with a Node.js backend.

| Category      | Technology                                                                                               |
|---------------|----------------------------------------------------------------------------------------------------------|
| **Backend**   | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [TSX](https://github.com/esbuild-kit/tsx) |
| **Frontend**  | [React](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)     |
| **Database**  | [PostgreSQL](https://www.postgresql.org/), [Drizzle ORM](https://orm.drizzle.team/), [Neon](https://neon.tech/) |
| **Styling**   | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Lucide Icons](https://lucide.dev/) |
| **Routing**   | [Wouter](https://github.com/molefrog/wouter) (Client-side)                                               |
| **API & State** | [TanStack Query](https://tanstack.com/query/latest) (Server State), [Zod](https://zod.dev/) (Validation) |
| **Auth**      | [Passport.js](http://www.passportjs.org/) (Local Strategy), [Express Session](https://github.com/expressjs/session) |

## 📂 Project Structure

The repository is organized to keep the client, server, and shared code separate and maintainable.

```
/
├── client/               # Frontend React application (Vite)
│   ├── src/
│   │   ├── components/   # Reusable UI components (including shadcn/ui)
│   │   ├── pages/        # Top-level page components
│   │   ├── lib/          # Utility functions, query client
│   │   ├── hooks/        # Custom React hooks
│   │   └── App.tsx       # Main app component with routing
│   └── index.html        # Entry point for the frontend
├── server/               # Backend Node.js application (Express)
│   ├── index.ts          # Main server entry point
│   └── routes.ts         # API route definitions
├── shared/               # Code shared between client and server
│   └── schema.ts         # Drizzle ORM database schema
├── data/                 # Static JSON data for quizzes
│   ├── cat/
│   └── gate/
├── drizzle.config.ts     # Drizzle Kit configuration
├── package.json          # Project dependencies and scripts
└── vite.config.ts        # Vite configuration
```

## 🏁 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) (v20.x or later recommended)
- [pnpm](https://pnpm.io/installation) (or npm/yarn)
- A [PostgreSQL](https://www.postgresql.org/download/) database. You can get a free one from [Neon](https://neon.tech/).

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd PrepUp
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of the project and add your PostgreSQL database connection string:
    ```env
    DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
    ```

4.  **Sync the database schema:**

    Push the schema defined in `shared/schema.ts` to your database using Drizzle Kit.
    ```bash
    npm run db:push
    ```

### Running the Application

-   **Development:**
    To run the application in development mode (with hot-reloading for both client and server), use:
    ```bash
    npm run dev
    ```
    This will start the server on `http://localhost:5000`.

-   **Production Build:**
    To build the optimized frontend and backend assets for production:
    ```bash
    npm run build
    ```

-   **Start Production Server:**
    To serve the production-ready application:
    ```bash
    npm run start
    ```

## 📜 Available Scripts

-   `npm run dev`: Starts the Vite dev server for the frontend and `tsx` for the backend.
-   `npm run build`: Bundles the client with Vite and the server with esbuild.
-   `npm run start`: Runs the built application from the `dist/` directory.
-   `npm run check`: Runs the TypeScript compiler to check for type errors.
-   `npm run db:push`: Pushes the Drizzle ORM schema to the database.
