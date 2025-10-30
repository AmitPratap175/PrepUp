# PrepUp - Your Personal AI-Powered Exam Preparation Platform

PrepUp is a comprehensive, full-stack web application meticulously engineered to empower students preparing for high-stakes competitive examinations like the CAT (Common Admission Test) and GATE (Graduate Aptitude Test in Engineering). It offers a sophisticated, clean, and intuitive digital ecosystem for taking practice tests, full-length mocks, and targeted quizzes.

## 🎯 Project Philosophy

The core philosophy behind PrepUp is to democratize and personalize the test preparation experience. We believe that every student deserves access to high-quality, realistic, and adaptive learning tools that were once only available through expensive coaching centers. Our goal is to create a platform that not only simulates the pressure and format of real exams but also provides intelligent feedback and personalized learning paths. We are committed to leveraging modern technology, including AI, to create a supportive and effective study environment that helps students achieve their academic and career aspirations.

## 👥 Target Audience

This platform is designed for:

*   **Aspiring MBA Candidates:** Students preparing for the Common Admission Test (CAT) who need extensive practice with Quantitative Aptitude, Verbal Ability, and Data Interpretation sections.
*   **Engineering Graduates:** Students and professionals preparing for the Graduate Aptitude Test in Engineering (GATE) across various disciplines.
*   **Self-Sufficient Learners:** Individuals who prefer a self-paced learning environment and want to track their progress meticulously.
*   **Educational Institutions:** Coaching centers or colleges that need a robust platform to administer mock tests to their students.

---

## ✨ In-Depth Features

PrepUp is more than just a question bank. It's a suite of powerful tools designed to provide a holistic preparation experience.

#### 1. Realistic Test Environment
*   **Exam Simulation:** Our test interface mirrors the actual UI of exams like CAT and GATE, including timers, question palettes, and navigation controls. This helps reduce anxiety and builds familiarity with the real test environment.
*   **Variety of Test Formats:**
    *   **Full-Length Mocks:** Timed simulations of the entire exam.
    *   **Sectional Tests:** Focus on specific sections (e.g., Verbal Ability) to build strength in weaker areas.
    *   **Practice Quizzes:** Short, topic-wise quizzes for quick revision and concept reinforcement.

#### 2. Personalized Dashboard & Analytics
*   **Progress Tracking:** Visualize your performance over time with intuitive charts and graphs. Track your scores, accuracy, and time management skills across different subjects.
*   **Attempt History:** Review every question from your past attempts, analyze your answers, and understand detailed solutions.
*   **Performance Metrics:** Get insights into your strengths and weaknesses, helping you to focus your study efforts where they are needed most.

#### 3. AI-Powered Chatbot Assistant
Our integrated chatbot is a sophisticated study companion powered by Google's Gemini Pro. It's designed to provide instant, contextual help through both **voice and text commands**.
*   **Interactive Learning:** Ask complex questions, get definitions of difficult words, or seek clarification on concepts without leaving the test interface.
*   **Smart Actions:**
    *   **Bookmarking:** Simply say or type, "Bookmark this question," and the chatbot will save it for you.
    *   **Vocabulary Building:** Highlight a word and ask the chatbot to save it to your personal word list with its meaning and context.
*   **API-Driven Tools:** The chatbot's abilities are defined by a robust OpenAPI schema, allowing it to interact with the backend to manage user-specific data like bookmarks and vocabulary lists securely.

#### 4. Customization and Accessibility
*   **User Settings:** Adjust the theme (light/dark mode), text size, and other display settings to create a comfortable study environment.
*   **Responsive Design:** The platform is fully responsive and works seamlessly on desktops, tablets, and mobile phones, so you can study anytime, anywhere.

---

## 🏗️ Architecture Overview

PrepUp is built on a modern, decoupled architecture, with a clear separation between the frontend and backend concerns.

*   **Backend (Django):** The entire backend is a robust Django application located in the `auth_server/` directory. It exposes a RESTful API using the Django REST Framework. Its responsibilities include:
    *   User authentication and authorization.
    *   Serving quiz and question data.
    *   Processing user answers and calculating scores.
    *   Managing user-specific data like bookmarks, saved words, and test progress.
    *   Interfacing with the PostgreSQL database.

*   **Frontend (React + Vite):** The frontend is a dynamic single-page application (SPA) built with React and TypeScript, located in the `frontend/` directory. It is responsible for:
    *   Rendering the user interface and all interactive components.
    *   Managing client-side state using tools like TanStack Query.
    *   Communicating with the backend API to fetch data and submit user actions.
    *   Providing the rich, interactive chatbot experience.

*   **Database (PostgreSQL):** A powerful, open-source object-relational database system that stores all application data, including user profiles, quiz content, and test results.

This decoupled structure allows for independent development, scaling, and maintenance of the frontend and backend services.

---

## 🚀 Getting Started: A Developer's Guide

This guide will walk you through setting up the project on your local machine for development and contribution. Both Docker-based and manual setup instructions are provided.

### Method 1: Docker (Recommended for Quick Setup)

#### Prerequisites
*   [Docker](https://www.docker.com/get-started)
*   [Docker Compose](https://docs.docker.com/compose/install/)

#### Setup and Execution
1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Environment Variables:** The backend requires database credentials. These are defined in `docker-compose.yml` for the database service. You can modify them there if needed. Ensure they match what the Django settings expect.

3.  **Build and Run with Docker Compose:**
    ```bash
    docker-compose up --build
    ```
    This single command builds the Docker images for the frontend, backend, and database, and then starts all the services.
    *   **Frontend:** `http://localhost:3000`
    *   **Backend API:** `http://localhost:8000`

### Method 2: Manual Local Setup

#### Prerequisites
*   Python 3.11+ and `uv` (or `pip`)
*   Node.js 18+ and npm
*   PostgreSQL server

#### Backend Setup (`auth_server/`)
1.  **Navigate to the Backend Directory:**
    ```bash
    cd auth_server
    ```

2.  **Create a Virtual Environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install Dependencies:** We recommend using `uv` for fast dependency management.
    ```bash
    uv pip install -r requirements.txt
    ```

4.  **Setup PostgreSQL:**
    *   Install PostgreSQL for your operating system.
    *   Start the PostgreSQL service. On Linux, this is often `sudo service postgresql start`.
    *   Create a dedicated user and database for the application.
        ```sql
        CREATE USER prepup_user WITH PASSWORD 'your_secure_password';
        CREATE DATABASE prepup_db OWNER prepup_user;
        ```

5.  **Configure Environment Variables:** Create a `.env` file in the `auth_server/` directory and add the following. **Never commit this file.**
    ```env
    DB_NAME=prepup_db
    DB_USER=prepup_user
    DB_PASS=your_secure_password
    DB_HOST=127.0.0.1
    DB_PORT=5432
    VITE_GEMINI_API_KEY=your_google_gemini_api_key
    ```
    *Note: The Django settings are configured to read these variables.*

6.  **Run Database Migrations:**
    ```bash
    python manage.py migrate
    ```

7.  **Start the Backend Server:**
    ```bash
    python manage.py runserver
    ```

#### Frontend Setup (`frontend/`)

1.  **Navigate to the Frontend Directory:**
    ```bash
    cd frontend
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:** Create a `.env` file in the `frontend/` directory. Vite only exposes variables prefixed with `VITE_`.
    ```env
    VITE_GEMINI_API_KEY=your_google_gemini_api_key
    ```
    *Note: This key is required for the chatbot's voice features.*

4.  **Start the Frontend Dev Server:**
    ```bash
    npm run dev
    ```

#### Troubleshooting Common Issues
*   **CORS Errors:** Ensure the frontend URL (`http://localhost:3000`) is included in the `CORS_ALLOWED_ORIGINS` in Django's `settings.py`.
*   **Database Connection Failed:** Double-check that your PostgreSQL server is running and that the credentials in your `.env` file are correct.
*   **Vite Server Hangs:** If you are not in a Replit environment, you may need to remove any Replit-specific plugins from `frontend/vite.config.ts`.

---

## 🧪 Testing the Application

#### Backend Tests
From the `auth_server/` directory:
```bash
pytest
```
This will run the entire suite of backend tests, including those for the API and chatbot logic.

#### Frontend Tests
From the `frontend/` directory:
```bash
npm test
```
This will launch the test runner for the React components.

---

## 🤝 How to Contribute

We welcome contributions from the community! To contribute, please follow these steps:

1.  **Fork the Repository:** Create your own fork of the project.
2.  **Create a Feature Branch:**
    ```bash
    git checkout -b feature/your-amazing-feature
    ```
3.  **Commit Your Changes:** Follow a conventional commit message format (e.g., `feat: Add user profile page`, `fix: Correct login bug`).
4.  **Push to Your Branch:**
    ```bash
    git push origin feature/your-amazing-feature
    ```
5.  **Open a Pull Request:** Submit a PR from your branch to the `main` branch of the original repository. Please provide a detailed description of your changes.

---

## 📄 API Documentation

The backend API is self-documenting thanks to the OpenAPI schema. Once the backend server is running, you can access the interactive API documentation at:

`http://localhost:8000/api/schema/swagger-ui/`

This interface allows you to explore all available endpoints, view their expected inputs, and even try them out live.
