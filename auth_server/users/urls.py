from django.urls import path
from .views import SignupView, UserDetailsView, BookmarkListView, BookmarkCreateView, BookmarkDeleteView, GoogleLogin

urlpatterns = [
    path('google/', GoogleLogin.as_view(), name='google_login'),
    path('signup/', SignupView.as_view(), name='signup'),
    path('user/', UserDetailsView.as_view(), name='user-details'),
    path('bookmarks/', BookmarkListView.as_view(), name='bookmark-list'),
    path('bookmarks/create/', BookmarkCreateView.as_view(), name='bookmark-create'),
    path('bookmarks/delete/<str:question_id>/', BookmarkDeleteView.as_view(), name='bookmark-delete'),
]
