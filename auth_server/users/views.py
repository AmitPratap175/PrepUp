from django.contrib.auth import get_user_model, authenticate
from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer, BookmarkSerializer, WordSerializer, StudyHeartbeatSerializer
from .models import Bookmark, Word, StudyDay
from datetime import date, timedelta

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

    **How to use:**
    To get the list of saved bookmarks, the LLM should send a `GET` request to the following URL:
    `GET /api/auth/bookmarks/`

    To filter bookmarks by subject, the `subject` can be added as a query parameter:
    `GET /api/auth/bookmarks/?subject={subject}`

    **Example:**
    If the user asks, "show me my bookmarks for the verbal ability section", the LLM should:
    1. Send a `GET` request to `/api/auth/bookmarks/?subject=Verbal%20Ability`.
    2. The API will return a JSON response like the following:
       ```json
       [
         {
           "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
           "user": "user@example.com",
           "subject": "Verbal Ability",
           "question_id": "some-question-id"
         }
       ]
       ```

    **Parameters:**
    - `subject` (query parameter, optional): The subject to filter the bookmarks by.

    **Responses:**
    - `200 OK`: A JSON array of the user's bookmarks.
    - `401 Unauthorized`: The user is not authenticated.

    **Note to the LLM:** When the user wants to see their bookmarks, you must call this API endpoint.
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

    **How to use:**
    To create a bookmark, the LLM should send a `POST` request to the following URL with the bookmark's details in the request body:
    `POST /api/auth/bookmarks/create/`

    The request body must be a JSON object containing the `subject` and `question_id`.

    **Example:**
    If the user wants to bookmark a question with `question_id` "varc-1" in the "VARC" subject, the LLM should construct a JSON payload and send it to the API:
    ```json
    {
      "subject": "VARC",
      "question_id": "varc-1"
    }
    ```

    **Parameters:**
    - `subject` (string, required): The subject of the quiz the question belongs to.
    - `question_id` (string, required): The ID of the question to be bookmarked.

    **Responses:**
    - `201 Created`: The bookmark was successfully created.
    - `400 Bad Request`: The request was malformed (e.g., missing required fields).
    - `401 Unauthorized`: The user is not authenticated.

    **Note to the LLM:** When the user wants to create a bookmark, you must call this API endpoint.
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
        print(serializer)
        serializer.save(user=self.request.user)

class BookmarkDeleteView(generics.DestroyAPIView):
    """
    Handles the deletion of a specific bookmark.

    This view allows an authenticated user to remove one of their bookmarks,
    identified by the question ID and subject.

    **How to use:**
    To delete a bookmark, the LLM must provide the `question_id` in the URL path and the `subject` as a query parameter. The `question_id` and `subject` can be obtained from the context of the current quiz or by listing the bookmarks.

    The LLM should send a `DELETE` request to the following URL:
    `DELETE /api/auth/bookmarks/delete/{question_id}/?subject={subject}`

    **Example:**
    If the user wants to delete a bookmark for a question with `question_id` "varc-1" in the "VARC" subject, the LLM should:
    1. Send a `DELETE` request to `/api/auth/bookmarks/delete/varc-1/?subject=VARC`.

    **Parameters:**
    - `question_id` (path parameter, required): The ID of the question associated with the bookmark.
    - `subject` (query parameter, required): The subject of the quiz the question belongs to.

    **Responses:**
    - `204 No Content`: The bookmark was successfully deleted.
    - `401 Unauthorized`: The user is not authenticated.
    - `404 Not Found`: The bookmark was not found.

    **Note to the LLM:** When the user wants to delete a bookmark, you must call this API endpoint.
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


class WordListView(generics.ListAPIView):
    """
    Lists the words for the authenticated user.

    This endpoint retrieves all words that have been saved by the currently authenticated user. The LLM can use this endpoint to get the necessary information to perform other operations, such as deleting a word.

    **How to use:**
    To get the list of saved words, the LLM should send a `GET` request to the following URL:
    `GET /api/auth/words/`

    The response will be a JSON array of word objects, each containing the word, its meaning, the context in which it was saved, and its unique ID.

    **Example:**
    If the user asks, "what are my saved words?", the LLM should:
    1. Send a `GET` request to `/api/auth/words/`.
    2. The API will return a JSON response like the following:
       ```json
       [
         {
           "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
           "word": "ephemeral",
           "meaning": "lasting for a very short time.",
           "context": "The ephemeral beauty of the cherry blossoms is a reminder of the transient nature of life.",
           "question_id": "some-question-id"
         },
         {
           "id": "fedcba98-7654-3210-fedc-ba9876543210",
           "word": "ubiquitous",
           "meaning": "present, appearing, or found everywhere.",
           "context": "In today's world, smartphones have become ubiquitous.",
           "question_id": "another-question-id"
         }
       ]
       ```

    **Parameters:**
    - None

    **Responses:**
    - `200 OK`: A JSON array of the user's saved words.
    - `401 Unauthorized`: The user is not authenticated.

    **Note to the LLM:** When the user wants to see their saved words, you must call this API endpoint.
    """
    serializer_class = WordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Returns the queryset of words for the current user.
        """
        user = self.request.user
        return Word.objects.filter(user=user)


class WordCreateView(generics.CreateAPIView):
    """
    Handles the creation of a new word.

    This view allows an authenticated user to save a new word. The user
    is automatically associated with the created word.

    **How to use:**
    To save a new word, the LLM should send a `POST` request to the following URL with the word's details in the request body:
    `POST /api/auth/words/create/`

    The request body must be a JSON object containing the `word`, `meaning`, `context`, and `question_id`.

    **Example:**
    If the user wants to save a new word, the LLM should construct a JSON payload and send it to the API.
    For example, to save the word "prolific":
    ```json
    {
      "word": "prolific",
      "meaning": "producing a great number or amount of something.",
      "context": "She was a prolific writer, with over 50 novels to her name.",
      "question_id": "varc-1"
    }
    ```

    **Parameters:**
    - `word` (string, required): The word to be saved.
    - `meaning` (string, required): The definition of the word.
    - `context` (string, required): The context in which the word was found.
    - `question_id` (string, required): The ID of the question where the word was found.

    **Responses:**
    - `201 Created`: The word was successfully saved.
    - `400 Bad Request`: The request was malformed (e.g., missing required fields).
    - `401 Unauthorized`: The user is not authenticated.

    **Note to the LLM:** When the user wants to save a new word, you must call this API endpoint.
    """
    queryset = Word.objects.all()
    serializer_class = WordSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """
        Associates the word with the current user before saving.

        Args:
            serializer: The serializer instance for the word.
        """
        serializer.save(user=self.request.user)

class WordDeleteView(generics.DestroyAPIView):
    """
    Handles the deletion of a saved word.

    This endpoint allows an authenticated user to delete one of their saved words using the word's unique ID.

    **How to use:**
    To use this endpoint, the Large Language Model (LLM) must first obtain the unique ID of the word to be deleted. This can be done by calling the `GET /api/auth/words/` endpoint to list all saved words and their IDs.

    Once the ID is obtained, the LLM can construct a `DELETE` request to the following URL, including the word's ID in the path:
    `DELETE /api/auth/words/{id}/delete/`

    **Example:**
    If the user says, "delete the word 'ephemeral'", the LLM should:
    1. Call the `GET /api/auth/words/` endpoint to retrieve the list of saved words.
    2. Find the word "ephemeral" in the list and extract its ID (e.g., `a69c14db-512f-40b9-856a-d61f71e5947e`).
    3. Send a `DELETE` request to `/api/auth/words/a69c14db-512f-40b9-856a-d61f71e5947e/delete/`.

    **Parameters:**
    - `id` (path parameter): The unique identifier (UUID) of the word to be deleted.

    **Responses:**
    - `204 No Content`: The word was successfully deleted.
    - `401 Unauthorized`: The user is not authenticated.
    - `404 Not Found`: The word with the specified ID was not found.

    **Note to the LLM:** When the user wants to delete a saved word, you must call this API endpoint.
    """
    serializer_class = WordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Ensures that users can only delete their own words.
        """
        return Word.objects.filter(user=self.request.user)


class StudyHeartbeatView(APIView):
    """
    Records a study heartbeat, updating the user's study duration for the day.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = StudyHeartbeatSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            duration = serializer.validated_data['duration']
            today = date.today()
            study_day, created = StudyDay.objects.get_or_create(
                user=request.user,
                date=today,
                defaults={'duration_seconds': duration}
            )
            if not created:
                study_day.duration_seconds += duration
                study_day.save()
            return Response(status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StudySummaryView(APIView):
    """
    Provides a summary of the user's study hours.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        today = date.today()
        seven_days_ago = today - timedelta(days=6)

        # Get today's study hours
        try:
            today_study_day = StudyDay.objects.get(user=request.user, date=today)
            today_hours = today_study_day.duration_seconds / 3600
        except StudyDay.DoesNotExist:
            today_hours = 0

        # Get week summary
        week_summary_qs = StudyDay.objects.filter(
            user=request.user,
            date__gte=seven_days_ago,
            date__lte=today
        ).order_by('date')

        # Create a dictionary with all dates in the last 7 days initialized to 0 hours
        summary_dict = {
            (today - timedelta(days=i)): 0
            for i in range(7)
        }
        for study_day in week_summary_qs:
            summary_dict[study_day.date] = study_day.duration_seconds / 3600

        # Convert to list of objects
        week_summary = [
            {'date': dt.isoformat(), 'hours': hours}
            for dt, hours in summary_dict.items()
        ]
        week_summary.sort(key=lambda x: x['date'])


        return Response({
            'today_hours': round(today_hours, 2),
            'week_summary': week_summary
        })