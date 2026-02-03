from rest_framework import generics, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import PIBRelease, Essay, EssayTopic
from .pib_scraper import fetch_pib_releases

class PIBStartEssayView(APIView):
    def post(self, request, id):
        """
        Creates or retrieves an Essay session for a specific PIB Mains Question.
        """
        question_index = request.data.get('question_index')
        if question_index is None:
             return Response({"error": "question_index is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            question_index = int(question_index)
            release = PIBRelease.objects.get(id=id)
        except (ValueError, PIBRelease.DoesNotExist):
             return Response({"error": "Invalid ID or index"}, status=status.HTTP_400_BAD_REQUEST)
             
        mains_questions = release.mains_questions or []
        if question_index < 0 or question_index >= len(mains_questions):
             return Response({"error": "Invalid question index"}, status=status.HTTP_400_BAD_REQUEST)
             
        question_data = mains_questions[question_index]
        q_text = question_data.get('question', '')
        model_answer = question_data.get('answer', '')
        
        # Create or Get EssayTopic
        # We use a deterministic title to find it again
        topic_title = f"PIB: {release.title[:60]}... - Q{question_index + 1}"
        
        # Extract keywords for context if needed, or just use summary
        context_text = release.summary if release.summary else (release.content[:2000] + "...")
        
        topic, _ = EssayTopic.objects.get_or_create(
            title=topic_title,
            defaults={
                'description': q_text,
                'domain': 'current_affairs',
                'difficulty': 'medium',
                'context': context_text,
                'key_points': [model_answer] if model_answer else ["Refer to the PIB Release for details."]
            }
        )
        
        # Create Draft Essay for User
        # If the user is anonymous (unlikely in this app flow but possible in dev), handle it?
        # Assuming authenticated user.
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        existing_essay = Essay.objects.filter(user=request.user, topic=topic).first()
        
        if existing_essay:
            essay = existing_essay
        else:
            essay = Essay.objects.create(
                user=request.user,
                topic=topic,
                title=f"Answer: {topic_title}",
                content="",
                status='draft'
            )
            
        return Response({"essay_id": essay.id})

class PIBReleaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = PIBRelease
        fields = '__all__'

class PIBReleaseList(generics.ListAPIView):
    queryset = PIBRelease.objects.all()
    serializer_class = PIBReleaseSerializer
    filterset_fields = ['ministry']
    search_fields = ['title', 'content', 'summary']

class PIBReleaseDetail(generics.RetrieveAPIView):
    queryset = PIBRelease.objects.all()
    serializer_class = PIBReleaseSerializer
    lookup_field = 'id'

class ScrapePIBView(APIView):
    def post(self, request):
        limit = int(request.query_params.get('limit', 10))
        try:
            releases = fetch_pib_releases(limit=limit)
            serializer = PIBReleaseSerializer(releases, many=True)
            return Response({"status": "success", "count": len(releases), "data": serializer.data})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
