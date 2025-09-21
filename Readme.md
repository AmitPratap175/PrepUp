# PrepUp - Online Test Preparation Platform

PrepUp is a full-stack web application designed to help students prepare for competitive examinations like CAT (Common Admission Test) and GATE (Graduate Aptitude Test in Engineering). It provides a modern, clean, and intuitive interface for taking practice tests and quizzes.

## ✨ Features

- **Realistic Test Environment**: Simulates the experience of actual exams with timed quizzes and a variety of question types.
- **Google Authentication**: Securely sign in with your Google account.
- **Responsive Design**: Fully responsive interface that works on all devices, from desktops to mobile phones.
- **Rich Content Rendering**: Supports complex mathematical notations using KaTeX and provides a clean reading experience for passages.
- **User Dashboard**: A dedicated space for users to track their progress and review past attempts.

## 🚀 Tech Stack

This project is a monorepo with a React frontend and a Django backend.

| Category      | Technology                                                                                               |
|---------------|----------------------------------------------------------------------------------------------------------|
| **Backend**   | [Django](https://www.djangoproject.com/), [Django REST Framework](https://www.django-rest-framework.org/) |
| **Frontend**  | [React](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)     |
| **Database**  | [PostgreSQL](https://www.postgresql.org/)                                                                |
| **Styling**   | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)                             |
| **Authentication** | [django-allauth](https://django-allauth.readthedocs.io/en/latest/), [dj-rest-auth](https://dj-rest-auth.readthedocs.io/en/latest/), [djangorestframework-simplejwt](https://django-rest-framework-simplejwt.readthedocs.io/en/latest/) |

## 📂 Project Structure

```
/
├── auth_server/          # Django backend application
│   ├── auth_project/     # Django project settings
│   ├── api/              # API app for serving data
│   └── users/            # Users app for authentication and user management
├── frontend/             # React frontend application (Vite)
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Top-level page components
│   │   └── ...
│   └── ...
└── docker-compose.yml    # Docker Compose file for orchestration
```

## 🏁 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd PrepUp
    ```

2.  **Set up environment variables:**

    Create a `.env` file in the `auth_server` directory and add the following variables:
    ```env
    DB_NAME=auth_db
    DB_USER=user
    DB_PASS=password
    DB_HOST=postgres
    GOOGLE_CLIENT_ID=<your-google-client-id>
    GOOGLE_CLIENT_SECRET=<your-google-client-secret>
    ```

    Create a `.env` file in the `frontend` directory and add the following variable:
    ```env
    VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
    ```

3.  **Build and run the application with Docker Compose:**
    ```bash
    docker-compose up --build
    ```

    The application will be available at `http://localhost:5000`.
