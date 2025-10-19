# PrepUp Feature Proposals

This document outlines potential new features for the PrepUp platform. Each proposal includes a description of the feature, its potential impact, and a high-level implementation guide.

## 1. Feature: AI Supervisor Agent Integration (Priority 1)

### Description

Integrate the existing `supervisor.py` agent as the core of a new, intelligent chatbot interface. This AI supervisor will act as a central point of contact for the user, delegating tasks to a team of specialized agents. The initial setup includes a `chatbot` agent and a `researcher` agent. This feature will not only integrate the supervisor but also expand its capabilities to make it more helpful.

### How the Supervisor can be more helpful

1.  ~~**Expand the Agent Team:** Introduce more specialized agents for the supervisor to manage:~~
    *   ~~**`AnalyticsAgent`**: To interpret a user's performance data. A user could ask, "Where am I weakest?" and this agent would provide a detailed breakdown with recommendations.~~
    *   ~~**`GoalSettingAgent`**: To help users define, track, and manage their study goals. A user could say, "I want to score 90% in Quant in 3 weeks," and the agent would help create a study plan.~~
    *   ~~**`ContentAgent`**: To find specific study materials, practice questions, or tests. For example, "Find me some hard questions on probability."~~
    *   ~~**`ForumAgent`**: To search the discussion forums for answers or related conversations.~~
    *   ~~**`MotivationAgent`**: To keep users motivated by providing encouragement, celebrating milestones, and reminding them of their goals.~~
    *   ~~**`StrategyAgent`**: To provide tips on test-taking strategies, time management, and question-level approaches based on user performance.~~
    *   ~~**`VocabularyAgent`**: To help users learn new words through a Spaced Repetition System (SRS) and daily quizzes.~~
    *   ~~**`NewsAgent`**: To fetch and summarize relevant news articles, which can be used for reading comprehension practice.~~
    *   ~~**`SupportAgent`**: To handle administrative queries, answer questions about the platform, and report bugs.~~
    *   ~~**`PlanningAgent`**: To help users create and manage a personalized study schedule.~~
    *   ~~**`ErrorAnalysisAgent`**: To analyze a user's mistakes and identify the root cause (e.g., conceptual gap, calculation error), then provide targeted exercises.~~
    *   ~~**`ComparisonAgent`**: To provide a granular comparison of a user's performance against their friends, the platform average, or top performers.~~
    *   ~~**`MindsetAgent`**: To help users with the psychological aspects of test prep, such as managing anxiety and building confidence.~~
    *   ~~**`GamificationAgent`**: To manage all gamification elements, such as daily challenges, points, and rewards.~~
    *   ~~**`AdmissionsAgent`**: To provide information and guidance on the admissions process for various universities, including deadlines and essay tips.~~

2.  **Proactive Assistance:** The supervisor can initiate conversations based on user activity:
    *   If a user is struggling with a topic, the supervisor could proactively offer help: "I see you're finding Algebra tricky. Would you like some practice questions?"
    -   If a user has been inactive, it could send a motivational message or a daily challenge.

3.  **Long-term Memory and Personalization:**
    *   The supervisor should remember past conversations and user goals to provide a truly personalized experience. It should be aware of the user's strengths, weaknesses, and targets.

### Impact

- **Conversational UI:** Transforms the user experience from a traditional point-and-click interface to a more natural, conversational one.
- **Personalized Learning at Scale:** The AI supervisor can act as a personal tutor for every user, providing tailored guidance and support.
- **Increased Engagement:** A proactive and intelligent assistant will keep users more engaged with the platform.
- **Centralized Access to Features:** Users can access most of the platform's features (analytics, content, forums) through a single conversational interface.

### Implementation Guidelines

#### Backend (Django)

1.  ~~**Integrate the Supervisor:**~~
    -   ~~The `supervisor_graph` is already defined. It needs to be exposed via a WebSocket or a more advanced streaming API endpoint (e.g., using Django Channels) to support real-time, stateful conversations.~~
    -   ~~The existing `ChatbotView` can be adapted or replaced to use the `supervisor_graph`.~~

2.  ~~**Asynchronous Integration (No `nest_asyncio`):**~~
    -   ~~**Crucially, do not use `nest_asyncio`.** This library patches the asyncio event loop and can cause unpredictable behavior in a production Django environment.~~
    -   ~~Instead, leverage Django Channels to create an `AsyncWebsocketConsumer`. Inside this consumer, you can safely call the asynchronous methods of your langgraph agents (e.g., `await supervisor_graph.ainvoke(...)` or `await supervisor_graph.astream(...)`).~~
    -   ~~This ensures that the langgraph agents run on the same event loop managed by Django Channels, leading to a stable and predictable integration.~~

3.  **Develop New Agents:**
    -   Create the new specialized agents (`AnalyticsAgent`, `GoalSettingAgent`, etc.) as separate `langgraph` graphs.
    -   Each agent will need tools to interact with the database and other parts of the application (e.g., a tool to fetch performance data, a tool to search the forum).

4.  **Expand Supervisor Logic:**
    -   Add the new agents to the `members` list in `supervisor.py`.
    -   Update the supervisor's `system_prompt` to make it aware of the new agents and their capabilities.
    -   The `router` function will need to be updated to handle routing to the new agents.

5.  **Implement Long-term Memory with pgvector:**
    -   Utilize the existing PostgreSQL database by enabling the `pgvector` extension. This avoids adding a separate vector database to the stack.
    -   In your database, run `CREATE EXTENSION IF NOT EXISTS vector;`.
    -   Use the `django-pgvector` library to simplify integration. Add a `VectorField` to a new `ConversationHistory` model.
    -   **Model:** `ConversationHistory(user, message_text, message_embedding=VectorField(dimensions=...))`
    -   **Workflow:**
        1.  When a conversation happens, generate an embedding for each message (or conversational turn) using a sentence-transformer model.
        2.  Store the message and its embedding in the `ConversationHistory` table.
        3.  For new user inputs, generate an embedding for the input and use `django-pgvector`'s similarity search lookups (e.g., `L2Distance`, `CosineDistance`) to retrieve the most relevant past conversation snippets from the database.
        4.  Inject this retrieved history into the agent's prompt to provide context.

#### Frontend (React)

1.  ~~**Revamp Chatbot UI:**~~
    -   ~~The current `chatbot.tsx` component needs to be updated to connect to the new streaming endpoint (e.g., using WebSockets).~~
    -   ~~The UI should be able to handle the multi-agent nature of the conversation, perhaps by indicating which agent is currently responding.~~
2.  **Rich Content Display:**
    -   The chatbot UI should be able to render not just text, but also rich content like charts (from the `AnalyticsAgent`), lists of questions (from the `ContentAgent`), and links to forum threads.

---

## 2. Architectural Foundation: Asynchronous Task Handling with Celery

### Description

Integrate Celery, a distributed task queue, into the Django backend to handle long-running and periodic tasks asynchronously. This is a foundational architectural improvement that will make the platform more scalable, reliable, and responsive by offloading time-consuming operations from the main request-response cycle.

### Impact

- **Improved Performance & Responsiveness:** The web application will respond to user requests much faster, as it won't be blocked by slow tasks.
- **Enhanced Reliability:** Tasks can be retried automatically if they fail, making the system more robust.
- **Scalability:** You can scale the number of Celery workers independently of the web server to handle increased load.
- **Enables New Features:** Supports a wide range of features that would otherwise be impractical, such as report generation, complex AI analysis, and scheduled notifications.

### Use Cases Across Features

- **AI Supervisor:** Offload non-streaming AI tasks, such as generating a detailed performance report from the `AnalyticsAgent` or a complex study plan from the `PlanningAgent`.
- **Leaderboards:** Recalculate leaderboard ranks in the background after a user completes a test.
- **Notifications:** Send email or push notifications to users (e.g., study reminders, new badge alerts).
- **Data Processing:** Asynchronously process uploaded user-generated content or perform heavy data analysis for the performance analytics dashboards.

### Implementation Guidelines

1.  **Setup Celery with Django:**
    -   Add Celery to your Python dependencies (`uv add celery redis`). Redis is a popular and recommended message broker.
    -   Add a Redis service to your `docker-compose.yml` file.
    -   Create a `celery.py` file in your Django project (`auth_project/celery.py`) to define the Celery application instance.
    -   Configure Celery in `auth_project/settings.py` to specify the message broker (Redis) and other settings.
2.  **Define Tasks:**
    -   In the relevant apps (e.g., `api`, `users`), create a `tasks.py` file.
    -   Define your background tasks as Python functions and decorate them with `@shared_task`.
    -   Example for leaderboards: `@shared_task def recalculate_leaderboard_ranks(test_id): ...`
3.  **Call Tasks:**
    -   In your views or models, instead of calling the function directly, call it with `.delay()` or `.apply_async()` to send it to the Celery queue.
    -   Example: `recalculate_leaderboard_ranks.delay(test.id)`
4.  **Run Celery Worker:**
    -   Add a new service to your `docker-compose.yml` for the Celery worker.
    -   The command for this service would be something like: `celery -A auth_project worker -l info`.

---

## 3. Feature: Leaderboards

### Description

A leaderboard system that ranks users based on their performance in mock tests. There can be different types of leaderboards:
- **Global Leaderboard:** Ranks all users on the platform.
- **Test-specific Leaderboard:** Ranks users for a particular mock test.
- **Friends-only Leaderboard:** (Future enhancement) Users can compare their scores with a select group of friends.

The leaderboards would display the user's rank, name, and score.

### Impact

- **Increased User Engagement:** Leaderboards foster a sense of competition, motivating users to take more tests and improve their scores.
- **Enhanced Motivation:** Seeing their rank can push users to study harder and perform better.
- **Community Building:** Creates a more interactive and competitive community around the platform.
- **Marketing Opportunity:** Top performers can be highlighted, which can be used for social media marketing.

### Implementation Guidelines

#### Backend (Django)

1.  **Create a new model `MockTestLeaderboard`:**
    -   Fields: `user` (ForeignKey to User), `mock_test` (ForeignKey to MockTest), `score` (IntegerField), `rank` (IntegerField), `timestamp` (DateTimeField).
2.  **Update `TestSession` logic:**
    -   When a user completes a mock test, a new entry should be created in the `MockTestLeaderboard` table.
    -   After saving a new entry, trigger a Celery task to recalculate the ranks: `recalculate_leaderboard_ranks.delay(mock_test.id)`.
3.  **Create new API endpoints:**
    -   `GET /api/leaderboards/global/`: Returns the global leaderboard (e.g., top 100 users based on an aggregate score or average score).
    -   `GET /api/leaderboards/mock-test/<test_id>/`: Returns the leaderboard for a specific mock test.
    -   The response should be paginated to handle a large number of users.
4.  **Serializer:**
    -   Create a `LeaderboardSerializer` to serialize the leaderboard data. It should include user's name, score, and rank. To avoid exposing user emails, you can add a `username` field to the `User` model or use the existing `name` field.

#### Frontend (React)

1.  **Create a new `Leaderboard` component:**
    -   This component will fetch and display the leaderboard data.
    -   It should have tabs or a dropdown to switch between different leaderboards (Global, Test-specific).
2.  **Integrate with React Router:**
    -   Add a new route `/leaderboards` that renders the `Leaderboard` component.
3.  **Display Leaderboards:**
    -   On the main dashboard, you could show a snippet of the global leaderboard to entice users.
    -   On the mock test result page, show the user's rank and a link to the full leaderboard for that test.
4.  **API Service:**
    -   Add new functions in your API service layer to fetch data from the new leaderboard endpoints. Use a data fetching library like TanStack Query to handle caching, and loading/error states.

---

## 4. Feature: Detailed Performance Analytics

### Description

Provide users with a detailed breakdown of their performance in tests. This goes beyond a simple score and provides actionable insights. The analytics dashboard could include:

- **Topic-wise Performance:** Show accuracy and time spent on different topics within a subject (e.g., Algebra, Geometry in Quant).
- **Time Management Analysis:** A chart showing how a user allocated their time across different sections and questions compared to the average or top performers.
- **Question-level Analysis:** For each question, show the time taken, whether it was answered correctly, incorrectly, or skipped.
- **Performance Over Time:** Graphs showing the user's score progression over a series of tests.

### Impact

- **Personalized Learning:** Helps users identify their specific strengths and weaknesses, allowing them to focus their study efforts more effectively.
- **Improved Strategy:** The time management analysis can help users refine their test-taking strategy.
- **Deeper Engagement:** Provides more value to the user than just a score, encouraging them to spend more time on the platform analyzing their results.
- **Data-driven Insights:** Empowers users to make informed decisions about their study plan.

### Implementation Guidelines

#### Backend (Django)

1.  **Enhance Data Collection:**
    -   The `TestSession` model (or a related model) needs to store more granular data for each question answered: `time_spent` (in seconds), `status` (correct, incorrect, skipped, marked_for_review).
    -   You might need a new model, e.g., `UserAnswer`, with a ForeignKey to `TestSession`, `Question`, and storing this granular data.
2.  **Create Analytics Endpoints:**
    -   `GET /api/analytics/test-session/<session_id>/`: Returns the detailed analytics for a specific test session.
    -   `GET /api/analytics/user-progress/<subject>/`: Returns the user's performance across different topics in a subject over time.
3.  **Data Processing:**
    -   The backend will need to process the raw `UserAnswer` data to generate the analytics (e.g., calculate average time per topic, accuracy per topic). This could be done on-the-fly for a single session, but for historical data, you might want to pre-calculate and cache the results, possibly using Celery tasks.
4.  **Models:**
    -   Ensure your `Question` model has a `topic` field to enable topic-wise analysis.

#### Frontend (React)

1.  **Create an `AnalyticsDashboard` component:**
    -   This component will be displayed after a user completes a test, or can be accessed from the user's profile/dashboard.
2.  **Data Visualization:**
    -   Use a charting library like [Recharts](https://recharts.org/) or [Chart.js](https://www.chartjs.org/) to create visualizations for:
        -   Topic-wise performance (e.g., bar chart).
        -   Time allocation (e.g., pie chart or stacked bar chart).
        -   Score progression (e.g., line chart).
3.  **Interactive Elements:**
    -   Allow users to filter the analytics by subject, test type, or date range.
    -   In the question-level analysis, make each question clickable to show the question, the user's answer, and the correct solution.

---

## 5. Feature: Discussion Forum

### Description

A dedicated space where users can ask questions, share strategies, and discuss test-related topics. The forum could be organized by subject or even specific tests.

Key features would include:
- **Creating new threads/topics.**
- **Replying to threads.**
- **Upvoting/downvoting posts and replies.**
- **Tagging questions from the test bank.**
- **Moderation tools for admins.**

### Impact

- **Community Building:** Fosters a strong sense of community and peer-to-peer learning.
- **Knowledge Sharing:** Creates a user-generated knowledge base of questions, solutions, and strategies.
- **Increased Engagement:** Encourages users to return to the platform not just for tests, but also for discussions.
- **Reduced Support Load:** Users can often resolve each other's doubts, reducing the burden on support staff.

### Implementation Guidelines

#### Backend (Django)

1.  **Create new models:**
    -   `ForumCategory`: To organize threads (e.g., by subject).
    -   `ForumThread`: Fields would include `title`, `content`, `user` (ForeignKey), `category` (ForeignKey), `created_at`.
    -   `ForumPost`: Fields would include `thread` (ForeignKey), `user` (ForeignKey), `content`, `created_at`, `parent_post` (for replies).
    -   `Vote`: A polymorphic model to handle upvotes/downvotes on threads and posts.
2.  **Create API endpoints:**
    -   `GET /api/forum/categories/`: List all forum categories.
    -   `GET /api/forum/threads/?category=<id>`: List threads in a category.
    -   `POST /api/forum/threads/`: Create a new thread.
    -   `GET /api/forum/threads/<thread_id>/`: View a thread and its posts.
    -   `POST /api/forum/threads/<thread_id>/posts/`: Create a new post/reply.
    -   `POST /api/forum/posts/<post_id>/vote/`: Upvote/downvote a post.
3.  **Authentication & Permissions:**
    -   Ensure only authenticated users can create threads and posts.
    -   Implement permissions for editing/deleting their own content.

#### Frontend (React)

1.  **Create Forum components:**
    -   `ForumHome`: Displays the list of categories.
    -   `ThreadList`: Displays a list of threads in a category.
    -   `ThreadView`: Displays a single thread with all its posts and replies.
    -   `CreateThreadForm`: A form to create a new thread.
    -   `Post`: A component to display a single post, with voting buttons.
2.  **Routing:**
    -   Add a new top-level route `/forum`.
    -   Create nested routes for categories and threads (e.g., `/forum/<category_slug>/`, `/forum/thread/<thread_id>`).
3.  **State Management:**
    -   Use TanStack Query to manage the state of threads and posts, ensuring data is fresh and automatically refetched.
4.  **Rich Text Editor:**
    -   For creating threads and posts, integrate a rich text editor (e.g., [Tiptap](https://tiptap.dev/) or [Quill](https://quilljs.com/)) to allow for formatting, code blocks, and images.

---

## 6. Feature: Badges and Achievements

### Description

A gamification feature where users can earn badges for reaching certain milestones. This provides a sense of accomplishment and encourages users to explore different aspects of the platform.

Examples of achievements:
- **"Test Taker":** Complete your first test.
- **"Serial Learner":** Complete 10 tests.
- **"High Scorer":** Score above 90th percentile in a mock test.
- **"Streak Master":** Maintain a 7-day study streak.
- **"Word Smith":** Save 50 words to your vocabulary list.
- **"Community Helper":** Get 10 upvotes on your forum posts.

### Impact

- **Increased Motivation:** Badges act as positive reinforcement, encouraging users to stay engaged with their studies.
- **Goal Setting:** Provides users with clear, achievable goals to work towards.
- **User Retention:** Gamification elements can make the learning process more enjoyable, leading to higher user retention.
- **Social Proof:** Users can display their badges on their profiles, showcasing their dedication and achievements.

### Implementation Guidelines

#### Backend (Django)

1.  **Create new models:**
    -   `Badge`: Stores information about each available badge (e.g., `name`, `description`, `icon_url`, `criteria`).
    -   `UserBadge`: A through model that links users to the badges they have earned (`user` ForeignKey, `badge` ForeignKey, `earned_at` DateTimeField).
2.  **Badge Awarding Logic:**
    -   This is the most critical part. You'll need to create a system that checks for badge criteria at various points in the application.
    -   For example, after a `TestSession` is completed, a function could be triggered to check if the user has earned any test-related badges.
    -   For streak-based badges, you can use the existing `StudyHeartbeatView` and `current_streak` in the `User` model.
    -   This logic can be implemented using Django Signals or by explicitly calling a `check_badges(user)` function after relevant actions.
3.  **Create API endpoints:**
    -   `GET /api/badges/`: List all available badges.
    -   `GET /api/users/<user_id>/badges/`: List the badges a specific user has earned.

#### Frontend (React)

1.  **Badge Components:**
    -   Create a `Badge` component that displays a single badge with its icon and description.
    -   Create a `BadgeList` component to display a collection of badges.
2.  **User Profile Integration:**
    -   Display the user's earned badges on their profile page.
3.  **Notification System:**
    -   When a user earns a new badge, show a notification (e.g., a toast message) to celebrate the achievement.
4.  **Badge Showcase:**
    -   Create a dedicated page where users can see all available badges and the criteria for earning them. This can motivate them to try and collect them all.

---

## 7. Feature: Mock Interview Simulator

### Description

An AI-powered mock interview simulator to help students prepare for the interview rounds of their target schools or jobs. The simulator could have different modes:
- **Technical Interview:** Focused on subject-specific knowledge.
- **Behavioral Interview:** Using the STAR method to answer questions.
- **CV-based Interview:** Questions based on the user's resume, which they can upload.

The user's responses would be recorded (audio), and the AI would provide real-time feedback on the clarity, content, and confidence of their answers. It could also provide a summary of strengths and areas for improvement at the end of the session.

### Impact

- **High-Value Proposition:** This is a unique feature that goes beyond typical test prep, addressing a critical pain point for students and setting the platform apart from competitors.
- **Improved User Outcomes:** Directly helps users prepare for a crucial step in their career or academic journey.
- **Premium Feature Opportunity:** This could be offered as a premium feature, creating a new revenue stream.

### Implementation Guidelines

#### Backend (Django)

1.  **AI Agent for Interviews:**
    -   Create a new `InterviewAgent` using a framework like LangChain or directly with a generative AI model API. This agent would be responsible for asking questions and evaluating answers.
    -   The agent would need a prompt that instructs it to act as an interviewer for a specific type of interview.
2.  **Speech-to-Text and Text-to-Speech:**
    -   Integrate a speech-to-text service (e.g., Google Speech-to-Text, OpenAI Whisper) to transcribe the user's audio responses.
    -   Integrate a text-to-speech service (e.g., Google Text-to-Speech) to have the AI interviewer ask questions with a natural voice.
3.  **API Endpoints:**
    -   `POST /api/interviews/start/`: To start a new interview session, specifying the type of interview.
    -   A WebSocket endpoint for real-time communication during the interview (sending audio from the client, receiving audio/text from the server).
    -   `GET /api/interviews/<session_id>/feedback/`: To get the final feedback report after the interview is complete.

#### Frontend (React)

1.  **Interview UI:**
    -   Create a new component for the interview interface.
    -   This component will need to handle microphone access and audio recording.
    -   It should display the AI interviewer (e.g., as an avatar) and the questions being asked.
2.  **Real-time Communication:**
    -   Use WebSockets to stream the user's audio to the backend and receive the AI's audio response in real-time.
3.  **Feedback Display:**
    -   Create a component to display the post-interview feedback report, highlighting key strengths and areas for improvement.

---

## 8. Feature: User-Generated Content (UGC)

### Description

Empower users to create and share their own quizzes, flashcards, and study notes. This turns passive learners into active contributors, building a vibrant, self-sustaining content ecosystem.

### Impact

- **Exponential Content Growth:** Massively scales the amount of available practice material without relying solely on internal content creation.
- **Deeper Community Engagement:** Encourages users to invest more in the platform by becoming creators.
- **Diverse and Relevant Content:** The content will be highly relevant and diverse, as it is created by the same user base that consumes it.

### Implementation Guidelines

#### Backend (Django)

1.  **UGC Models:**
    -   `UserQuiz`: To store user-created quizzes (title, description, creator, etc.).
    -   `UserQuestion`: For questions within a `UserQuiz`.
    -   `UserFlashcardDeck`: For decks of flashcards.
    -   `Rating` and `Review` models to allow users to rate and review UGC.
2.  **API Endpoints:**
    -   CRUD endpoints for quizzes, questions, and flashcards.
    -   Endpoints for browsing, searching, and filtering UGC.
3.  **Moderation System:**
    -   Implement a system for users to report inappropriate or low-quality content.
    -   Create a moderation dashboard for admins to review and manage reported content.

#### Frontend (React)

1.  **Creation Tools:**
    -   Build intuitive forms and interfaces for creating quizzes and flashcards.
2.  **Discovery and Browsing:**
    -   Create a dedicated section for browsing user-generated content.
    -   Implement search and filter functionality (e.g., by topic, rating, creator).
3.  **Display Components:**
    -   Components to take user-created quizzes and review flashcard decks.

---

## 9. Feature: Offline Mode / Progressive Web App (PWA)

### Description

Transform the web application into a Progressive Web App (PWA) to provide offline access and a more native-app-like experience. Users could download study materials, quizzes, and vocabulary lists to continue learning without an internet connection.

### Impact

- **Greatly Improved Accessibility:** Makes the platform available to users with unreliable or no internet access.
- **Enhanced User Convenience:** Users can study anytime, anywhere, such as during a commute.
- **Better Performance:** PWAs can cache resources intelligently, leading to faster load times and a smoother user experience.

### Implementation Guidelines

#### Frontend (React)

1.  **Service Worker:**
    -   Implement a service worker to handle caching of application assets (HTML, CSS, JS) and data (API responses for quizzes, study materials).
    -   Use a library like [Workbox](https://developer.chrome.com/docs/workbox) to simplify service worker management.
2.  **Web App Manifest:**
    -   Create a `manifest.json` file to define the PWA's properties (name, icons, start URL, display mode).
3.  **Offline Data Storage:**
    -   Use browser storage APIs like [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) to store downloaded content (e.g., JSON for quizzes).
    -   Provide a UI for users to manage their downloaded content.
4.  **Background Sync:**
    -   Use the [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Sync_API) to sync user progress (e.g., completed offline tests) back to the server once a connection is available.

#### Backend (Django)

-   The backend needs to be aware of the offline functionality, but most of the changes will be on the frontend. The existing API endpoints can be used to fetch the data that will be cached by the service worker.

---