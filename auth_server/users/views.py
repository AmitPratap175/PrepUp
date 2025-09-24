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
    Handles the registration of new users.

    This view uses a `CreateAPIView` to simplify the creation of new User
    instances. It expects the user's name, email, password, and exam type
    in the request data.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer

class LoginView(APIView):
    """
    Authenticates users and provides an auth token.

    This view handles POST requests with 'email' and 'password'. On successful
    authentication, it returns a new or existing auth token for the user.
    """
    def post(self, request, *args, **kwargs):
        """
        Handles the login request.

        Args:
            request: The HttpRequest object, containing login credentials.

        Returns:
            A Response object with the auth token on success, or an error
            message on failure.
        """
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
    Logs out an authenticated user by deleting their auth token.

    This view requires the user to be authenticated. It invalidates the
    user's session by removing their token from the database.
    """
    def post(self, request, *args, **kwargs):
        """
        Handles the logout request.

        Args:
            request: The HttpRequest object.

        Returns:
            A Response with a 204 No Content status on successful logout,
            or an error if the user is not authenticated.
        """
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
    Retrieves the details for the currently authenticated user.

    This view is protected and requires a valid auth token. It returns
    the serialized data of the user making the request.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Handles the GET request to fetch user details.

        Args:
            request: The HttpRequest object.

        Returns:
            A Response containing the serialized user data.
        """
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class BookmarkListView(generics.ListAPIView):
    """
    Lists the bookmarks for the authenticated user.

    This view can optionally filter bookmarks by subject using a query
    parameter.
    """
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Returns the queryset of bookmarks for the current user.

        If a 'subject' query parameter is provided, the bookmarks are
        filtered by that subject.

        Returns:
            A queryset of Bookmark objects.
        """
        user = self.request.user
        subject = self.request.query_params.get('subject')
        if subject:
            return Bookmark.objects.filter(user=user, subject=subject)
        return Bookmark.objects.filter(user=user)

class BookmarkCreateView(generics.CreateAPIView):
    """
    Handles the creation of a new bookmark.

    This view allows an authenticated user to bookmark a question. The user
    is automatically associated with the created bookmark.
    """
    queryset = Bookmark.objects.all()
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """
        Associates the bookmark with the current user before saving.

        Args:
            serializer: The serializer instance for the bookmark.
        """
        serializer.save(user=self.request.user)

class BookmarkDeleteView(generics.DestroyAPIView):
    """
    Handles the deletion of a specific bookmark.

    This view allows an authenticated user to remove one of their bookmarks,
    identified by the question ID and subject.
    """
    queryset = Bookmark.objects.all()
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """
        Retrieves the bookmark object to be deleted.

        The bookmark is identified by the `question_id` from the URL and
        the `subject` from the query parameters, ensuring it belongs to the
        current user.

        Returns:
            The Bookmark object to be deleted.
        """
        queryset = self.get_queryset()
        obj = generics.get_object_or_404(
            queryset,
            question_id=self.kwargs["question_id"],
            subject=self.request.query_params.get('subject'),
            user=self.request.user
        )
        return obj
