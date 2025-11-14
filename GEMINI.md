## Project Overview

This is a full-stack web application called "PrepUp" designed for students preparing for competitive exams like CAT and GATE. It provides a platform for taking practice tests, mock tests, and quizzes.

**Technologies:**

*   **Backend:** Django, Django REST Framework, PostgreSQL. The backend code is located in the `auth_server/` directory.
*   **Frontend:** React, Vite, TypeScript. The frontend code is in the `frontend/` directory, with the main source in `frontend/client/src/`.
*   **AI:** The application uses Google's Gemini Pro for a chatbot assistant.

**Architecture:**

The project follows a decoupled architecture with a separate frontend and backend. The frontend communicates with the backend through a RESTful API.

## Building and Running

### Docker (Recommended)

The easiest way to get the project running is to use Docker.

1.  **Build and run the services:**
    ```bash
    docker-compose up --build
    ```
2.  The frontend will be available at `http://localhost:5000` and the backend at `http://localhost:8000`.

### Manual Setup

#### Backend (`auth_server/`)

1.  **Install dependencies:**
    ```bash
    uv pip install -r requirements.txt
    ```
2.  **Run database migrations:**
    ```bash
    python manage.py migrate
    ```
3.  **Start the development server:**
    ```bash
    python manage.py runserver
    ```

#### Frontend (`frontend/`)

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Start the development server:**
    ```bash
    npm run dev
    ```

## Testing

### Backend

From the `auth_server/` directory:

```bash
pytest
```

### Frontend

From the `frontend/` directory:

```bash
npm test
```

## Development Conventions

*   The backend follows standard Django project structure.
*   The frontend uses a feature-based folder structure inside `frontend/client/src/pages`.
*   The project uses `wouter` for routing on the frontend.
*   State management on the frontend is done using a combination of TanStack Query for server state and React Context for global UI state.
*   The UI is built with a component library that seems to be based on Shadcn/UI, using Radix UI, Lucide Icons, and Tailwind CSS.
