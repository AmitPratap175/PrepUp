from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Bookmark

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model.

    This serializer is used to convert User model instances to JSON and vice versa.
    It is used in the signup view to create new users.
    """
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'password', 'exam_type')

    def create(self, validated_data):
        """
        Create and return a new User instance, given the validated data.
        """
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password'],
            exam_type=validated_data['exam_type']
        )
        return user

class BookmarkSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.email')
    class Meta:
        model = Bookmark
        fields = ['id', 'user', 'subject', 'question_id']
