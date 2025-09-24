from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Bookmark

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model, used for registration.

    This serializer handles the conversion of User model instances to JSON
    and validates incoming data for creating new users. The password is
    write-only to ensure it is not exposed in API responses.
    """
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'password', 'exam_type')

    def create(self, validated_data):
        """
        Creates a new user instance using the validated data.

        This method calls the custom user manager's `create_user` method
        to ensure the password is properly hashed and saved.

        Args:
            validated_data (dict): The validated data for creating the user.

        Returns:
            The newly created User instance.
        """
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password'],
            exam_type=validated_data['exam_type']
        )
        return user

class BookmarkSerializer(serializers.ModelSerializer):
    """
    Serializer for the Bookmark model.

    This serializer handles the conversion of Bookmark instances to JSON.
    The 'user' field is read-only and displays the user's email for
    context.
    """
    user = serializers.ReadOnlyField(source='user.email')
    class Meta:
        model = Bookmark
        fields = ['id', 'user', 'subject', 'question_id']
