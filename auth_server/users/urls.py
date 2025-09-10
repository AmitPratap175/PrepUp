from django.urls import path
from .views import SignupView, LoginView, LogoutView, UserDetailsView, BookmarkListView, BookmarkCreateView, BookmarkDeleteView

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('user/', UserDetailsView.as_view(), name='user-details'),
    path('bookmarks/', BookmarkListView.as_view(), name='bookmark-list'),
    path('bookmarks/create/', BookmarkCreateView.as_view(), name='bookmark-create'),
    path('bookmarks/delete/<str:question_id>/', BookmarkDeleteView.as_view(), name='bookmark-delete'),
]
