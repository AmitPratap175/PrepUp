"""
URL patterns for the 'api' app.

This module defines the routing for all API endpoints, mapping URL paths
to their corresponding view functions. It includes routes for accessing
courses, study materials, tests, and user-specific data.
"""
from django.urls import path
from . import views
from .views import ResetTestProgressView, UserQuizStateView

urlpatterns = [
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
    path('test-sessions/', views.test_sessions, name='test_sessions'),
    path('test-sessions/<str:session_id>/', views.test_session_detail, name='test_session_detail'),
    path('users/<str:user_id>/test-sessions/', views.user_test_sessions, name='user_test_sessions'),
    path('users/<str:user_id>/progress/', views.user_progress, name='user_progress'),
    path('users/<str:user_id>/progress/<str:course_id>/', views.user_progress_by_course, name='user_progress_by_course'),
    path('questions/add/', views.add_question_view, name='add_question'),
    path('chatbot/', views.ChatbotView.as_view(), name='chatbot'),
    path('reset-test-progress/', ResetTestProgressView.as_view(), name='reset-test-progress'),
    path('user-quiz-state/', UserQuizStateView.as_view(), name='user-quiz-state'),
]