# PrepUp - Online Test Preparation Platform

PrepUp is a full-stack web application designed to help students prepare for competitive examinations like CAT (Common Admission Test) and GATE (Graduate Aptitude Test in Engineering). It provides a modern, clean, and intuitive interface for taking practice tests, mock tests, and quizzes.

## ✨ Features

-   **Realistic Test Environment**: Simulates the experience of actual exams with timed quizzes, sectional tests, and full-length mock tests.
-   **Comprehensive Content**: Covers various subjects across different exams, organized into categories like Quantitative Aptitude, Verbal Ability, and Data Interpretation.
-   **User Authentication**: Secure user registration and login system.
-   **Personalized Dashboard**: A dedicated space for users to track their progress, review past attempts, and manage their profile.
-   **Bookmarking**: Allows users to save questions for later review.
-   **Responsive Design**: Fully responsive interface that works on all devices, from desktops to mobile phones.
-   **Customizable Settings**: Users can personalize their experience with theme, text size, and other display settings.

## 🚀 Tech Stack

This project follows a monorepo-like structure, combining a Django backend with a React frontend.

| Category       | Technology                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Backend**    | [Django](https://www.djangoproject.com/), [Django REST Framework](https://www.django-rest-framework.org/)             |
| **Frontend**   | [React](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)              |
| **Database**   | [PostgreSQL](https://www.postgresql.org/)                                                                         |
| **Styling**    | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)                                        |
| **API & State**  | [TanStack Query](https://tanstack.com/query/latest)                                                               |
| **Deployment** | [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/)                              |

## 📂 Project Structure

The repository is organized to keep the frontend and backend code separate and maintainable.

```
/
├── frontend/             # Frontend React application (Vite)
│   ├── client/
│   │   ├── src/
│   │   └── ...
│   └── ...
├── auth_server/          # Backend Django application
│   ├── api/              # API-related logic, views, and serializers
│   ├── users/            # User management and authentication
│   └── auth_project/     # Django project settings
├── data/                 # Static JSON data for quizzes
│   ├── cat/
│   └── gate/
├── docker-compose.yml    # Docker Compose configuration
└── ...
```

## 🏁 Getting Started

Follow these instructions to get the project up and running on your local machine using Docker.

### Prerequisites

-   [Docker](https://www.docker.com/get-started)
-   [Docker Compose](https://docs.docker.com/compose/install/)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Set up environment variables:**

    The backend service requires database credentials. These are typically set in the `docker-compose.yml` file or a separate `.env` file. Refer to `auth_server/auth_project/settings.py` for the required environment variables (`DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`).

3.  **Build and run the application with Docker Compose:**
    ```bash
    docker-compose up --build
    ```

    This command will build the Docker images for the frontend and backend services and start the containers.

-   The frontend will be accessible at `http://localhost:3000`.
-   The backend API will be running on `http://localhost:8000`.

### Running without Docker

#### Backend

1.  **Navigate to the backend directory:**
    ```bash
    cd auth_server
    ```
2.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt # Or use your preferred package manager
    ```
3.  **Run database migrations:**
    ```bash
    python manage.py migrate
    ```
4.  **Start the development server:**
    ```bash
    python manage.py runserver
    ```

#### Frontend

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend/client
    ```
2.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```
3.  **Start the development server:**
    ```bash
    npm run dev
    ```

## 📜 Available Scripts

### Frontend (`frontend/client`)

-   `npm run dev`: Starts the Vite development server.
-   `npm run build`: Bundles the application for production.
-   `npm run preview`: Serves the production build locally.

### Backend (`auth_server`)

-   `python manage.py runserver`: Starts the Django development server.
-   `python manage.py migrate`: Applies database migrations.
-   `python manage.py createsuperuser`: Creates an admin user.
-   `python manage.py test`: Runs the test suite.
