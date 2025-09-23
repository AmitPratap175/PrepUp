# Ed-Tech Platform

This is a full-stack educational platform with a Django backend and a React frontend.

## Features

- User authentication (login, signup)
- Practice tests
- Mock tests
- Sectional tests
- Study materials
- And more!

## Settings

The application now includes a comprehensive settings page that allows users to customize their experience. To access the settings page, log in and click the settings icon in the header.

### Available Settings

- **Display Settings**: Customize the application's appearance, including theme, text size, font family, and color scheme.
- **Quiz Preferences**: Adjust quiz-related settings, such as auto-advancing questions, showing the timer, and enabling timer warnings.
- **Accessibility**: Improve usability with high-contrast mode, reduced animations, and other accessibility features.
- **Notifications**: Manage email notifications for progress reminders and achievements.

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
