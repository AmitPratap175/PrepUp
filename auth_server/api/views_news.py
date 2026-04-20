from rest_framework import generics, serializers
from .models import NewsArticle

class NewsArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsArticle
        fields = '__all__'

class NewsArticleList(generics.ListAPIView):
    queryset = NewsArticle.objects.all()
    serializer_class = NewsArticleSerializer
    filterset_fields = ['source']
    search_fields = ['title', 'content', 'summary']

class NewsArticleDetail(generics.RetrieveAPIView):
    queryset = NewsArticle.objects.all()
    serializer_class = NewsArticleSerializer
    lookup_field = 'id'

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .news_scraper import fetch_the_hindu_upsc_news

class ScrapeNewsView(APIView):
    """
    API endpoint to trigger the NewsAPI scraper.
    """
    def post(self, request):
        try:
            articles = fetch_the_hindu_upsc_news()
            serializer = NewsArticleSerializer(articles, many=True)
            return Response({"status": "success", "count": len(articles), "data": serializer.data})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from .pib_ai import generate_pib_content_ai

class AnalyzeNewsArticleView(APIView):
    """
    API endpoint to trigger Gemini AI analysis on a specific NewsArticle.
    """
    def post(self, request, id):
        try:
            article = NewsArticle.objects.get(id=id)
            if not article.summary:
                summary, quiz, mains_questions = generate_pib_content_ai(article.content)
                article.summary = summary
                article.quiz_data = quiz
                article.mains_questions = mains_questions
                article.save()
            serializer = NewsArticleSerializer(article)
            return Response(serializer.data)
        except NewsArticle.DoesNotExist:
            return Response({"error": "Article not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

