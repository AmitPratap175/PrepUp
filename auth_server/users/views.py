from django.contrib.auth import get_user_model, authenticate
from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer, BookmarkSerializer
from .models import Bookmark

User = get_user_model()

class SignupView(generics.CreateAPIView):
    """
    API view for user signup.

    This view allows new users to register by providing their name, email, password,
    and exam type. Upon successful registration, a new user account is created.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer

class LoginView(APIView):
    """
    API view for user login.

    This view authenticates a user with their email and password. If the
    credentials are valid, it returns an authentication token that can be used
    for subsequent authenticated requests.
    """
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')

        user = authenticate(request, email=email, password=password)

        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({'token': token.key})
        else:
            return Response(
                {'error': 'Invalid Credentials'},
                status=status.HTTP_400_BAD_REQUEST
            )

class LogoutView(APIView):
    """
    API view for user logout.

    This view logs out a user by deleting their authentication token. The user
    must be authenticated to access this view.
    """
    def post(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            request.user.auth_token.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response(
                {'error': 'You are not logged in.'},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserDetailsView(APIView):
    """
    API view for getting user details.

    This view returns the details of the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class BookmarkListView(generics.ListAPIView):
    """
    API view for listing user bookmarks.
    """
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        subject = self.request.query_params.get('subject')
        if subject:
            return Bookmark.objects.filter(user=user, subject=subject)
        return Bookmark.objects.filter(user=user)

class BookmarkCreateView(generics.CreateAPIView):
    """
    API view for creating a new bookmark.
    """
    queryset = Bookmark.objects.all()
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BookmarkDeleteView(generics.DestroyAPIView):
    """
    API view for deleting a bookmark.
    """
    queryset = Bookmark.objects.all()
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        queryset = self.get_queryset()
        obj = generics.get_object_or_404(
            queryset,
            question_id=self.kwargs["question_id"],
            subject=self.request.query_params.get('subject'),
            user=self.request.user
        )
        return obj
