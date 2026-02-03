"""
URL patterns for the 'api' app.

This module defines the routing for all API endpoints, mapping URL paths
to their corresponding view functions. It includes routes for accessing
courses, study materials, tests, and user-specific data.
"""
from django.urls import path
from . import views
from .views import ResetTestProgressView, UserQuizProgressView, UserQuizStateView
from .quiz_generator_view import QuizGeneratorView
from .chapterwise_view import ChapterwiseQuizView
from .chapter_progress_view import ChapterProgressView
from .chapter_progress_view import ChapterProgressView
from .pdf_export_view import ChapterPDFExportView
from . import views_pib

urlpatterns = [
    path('subjects/', views.subjects, name='subjects'),
    path('courses/', views.courses, name='courses'),
    path('courses/<str:course_id>/', views.course_detail, name='course_detail'),
    path('study-materials/', views.study_materials, name='study_materials'),
    path('study-materials/<str:material_id>/', views.study_material_detail, name='study_material_detail'),
    path('practice-tests/', views.practice_tests, name='practice_tests'),
    path('practice-tests/<str:test_id>/', views.practice_test_detail, name='practice_test_detail'),
    path('mock-tests/', views.mock_tests, name='mock_tests'),
    path('mock-tests/<str:test_id>/', views.mock_test_detail, name='mock_test_detail'),
    path('sectional-tests/', views.sectional_tests, name='sectional_tests'),
    path('sectional-tests/<str:test_id>/', views.sectional_test_detail, name='sectional_test_detail'),
    path('sectional-tests/<str:test_id>/<str:section>/', views.sectional_test_section, name='sectional_test_section'),
    path('users/<str:user_id>/test-sessions/', views.user_test_sessions, name='user_test_sessions'),
    path('users/<str:user_id>/progress/', views.user_progress, name='user_progress'),
    path('users/<str:user_id>/progress/<str:course_id>/', views.user_progress_by_course, name='user_progress_by_course'),
    path('questions/add/', views.add_question_view, name='add_question'),
    path('chatbot/', views.ChatbotView.as_view(), name='chatbot'),
    path('reset-test-progress/', ResetTestProgressView.as_view(), name='reset-test-progress'),
    path('user-quiz-progress/', UserQuizProgressView.as_view(), name='user-quiz-progress'),
    path('user-quiz-state/', UserQuizStateView.as_view(), name='user-quiz-state'),
    path('user-quiz-goals/', views.UserQuizGoalView.as_view(), name='user-quiz-goals'),
    path('test-sessions/', views.TestSessionView.as_view(), name='test-sessions'),
    path('test-sessions/<uuid:session_id>/', views.TestSessionDetailView.as_view(), name='test-session-detail'),
    path('generate-questions/', views.GenerateQuestionsView.as_view(), name='generate-questions'),
    path('chatbot/tools/', views.ChatbotToolsView.as_view(), name='chatbot-tools'),
    path('chatbot/execute-tool/', views.ChatbotToolExecutionView.as_view(), name='chatbot-execute-tool'),
    path('leaderboard/', views.LeaderboardView.as_view(), name='leaderboard'),
    path('analytics/', views.PerformanceAnalyticsView.as_view(), name='analytics'),
    path('leaderboards/mock-test/<str:test_id>/', views.MockTestLeaderboardView.as_view(), name='mock-test-leaderboard'),
    path('badges/', views.BadgeListView.as_view(), name='badges'),
    path('user/badges/', views.UserBadgesView.as_view(), name='user-badges'),
    path('test-sessions/<uuid:session_id>/analytics/', views.TestSessionAnalyticsView.as_view(), name='test-session-analytics'),
    # Essay System
    path('essays/topics/generate/', views.EssayTopicGenerateView.as_view(), name='essay-topics-generate'),
    path('essays/topics/', views.EssayTopicListView.as_view(), name='essay-topics-list'),
    path('essays/xat-questions/', views.XATEssayQuestionListView.as_view(), name='essay-xat-questions-list'),
    path('essays/', views.EssayListCreateView.as_view(), name='essays-list-create'),
    path('essays/<uuid:essay_id>/', views.EssayDetailView.as_view(), name='essay-detail'),
    path('essays/<uuid:essay_id>/submit/', views.EssaySubmitView.as_view(), name='essay-submit'),
    path('essays/<uuid:essay_id>/review/', views.EssayReviewView.as_view(), name='essay-review'),
    # Daily Targets & Revision
    path('daily-targets/settings/', views.UserDailySettingsView.as_view(), name='daily-targets-settings'),
    path('daily-targets/', views.DailyTargetView.as_view(), name='daily-targets'),
    path('daily-targets/start/', views.DailyTargetStartView.as_view(), name='daily-targets-start'),
    path('daily-targets/submit/', views.DailyTargetSubmitView.as_view(), name='daily-targets-submit'),
    path('daily-targets/reset/<str:subject>/', views.DailyTargetResetView.as_view(), name='daily-targets-reset'),
    path('daily-targets/session-result/<uuid:session_id>/', views.DailyTargetSessionResultView.as_view(), name='daily-targets-session-result'),
    path('daily-targets/regenerate/', views.DailyTargetRegenerateView.as_view(), name='daily-targets-regenerate'),
    path('revision/', views.RevisionView.as_view(), name='revision'),
    path('revision/schedule/', views.ScheduleRevisionView.as_view(), name='schedule_revision'),

    path('generate-quiz/', QuizGeneratorView.as_view(), name='generate-quiz'),
    path('chapterwise-quiz/', ChapterwiseQuizView.as_view(), name='chapterwise-quiz'),
    path('chapterwise-quiz/export-pdf/', ChapterPDFExportView.as_view(), name='chapter-export-pdf'),
    path('chapter-progress/', ChapterProgressView.as_view(), name='chapter-progress'),
    path('pib/releases/', views_pib.PIBReleaseList.as_view(), name='pib-releases-list'),
    path('pib/releases/<uuid:id>/', views_pib.PIBReleaseDetail.as_view(), name='pib-releases-detail'),
    path('pib/start-essay/<uuid:id>/', views_pib.PIBStartEssayView.as_view(), name='pib-start-essay'),
    path('pib/scrape/', views_pib.ScrapePIBView.as_view(), name='pib-scrape'),
]