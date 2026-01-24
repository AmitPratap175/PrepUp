from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import UserChapterProgress

class ChapterProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get all completed chapter IDs for the current user.
        """
        completed_chapters = UserChapterProgress.objects.filter(
            user=request.user, 
            is_completed=True
        ).values_list('chapter_id', flat=True)
        return Response(list(completed_chapters))

    def post(self, request):
        """
        Toggle or set completion status for a chapter.
        """
        chapter_id = request.data.get('chapter_id')
        is_completed = request.data.get('is_completed')

        if not chapter_id:
            return Response({"error": "chapter_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        if is_completed is None:
             return Response({"error": "is_completed boolean is required"}, status=status.HTTP_400_BAD_REQUEST)

        progress, created = UserChapterProgress.objects.update_or_create(
            user=request.user,
            chapter_id=chapter_id,
            defaults={'is_completed': is_completed}
        )

        return Response({
            "chapter_id": progress.chapter_id,
            "is_completed": progress.is_completed
        }, status=status.HTTP_200_OK)
