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
            # Find the release in JSON data
            data = load_pib_data()
            release = next((item for item in data if item['id'] == str(id)), None)
            if not release:
                raise ValueError("Release not found")
        except ValueError:
             return Response({"error": "Invalid ID or index"}, status=status.HTTP_400_BAD_REQUEST)
             
        mains_questions = release.get('mains_questions', [])
        if question_index < 0 or question_index >= len(mains_questions):
             return Response({"error": "Invalid question index"}, status=status.HTTP_400_BAD_REQUEST)
             
        question_data = mains_questions[question_index]
        q_text = question_data.get('question', '')
        model_answer = question_data.get('answer', '')
        
        # Create or Get EssayTopic
        # We use a deterministic title to find it again
        topic_title = f"PIB: {release.get('title', '')[:60]}... - Q{question_index + 1}"
        
        # Extract keywords for context if needed, or just use summary
        summary = release.get('summary', '')
        content = release.get('content', '')
        context_text = summary if summary else (content[:2000] + "...")
        
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
            
        force_new = request.data.get('force_new', False)
        
        # If force_new is False, check for existing draft
        existing_essay = None
        if not force_new:
            # We want to find the latest essay for this topic
            existing_essay = Essay.objects.filter(user=request.user, topic=topic).order_by('-created_at').first()
        
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

import json
import os

def load_pib_data():
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'pib_combined_data.json')
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                
            formatted_data = []
            for item in data:
                if not isinstance(item, dict):
                    continue
                # Transform to what frontend expects
                ai_content = item.get("ai_content", {})
                questions = ai_content.get("questions", []) if isinstance(ai_content, dict) else []
                quiz_data = []
                
                if isinstance(questions, list):
                    for q in questions:
                        if not isinstance(q, dict):
                            continue
                        
                        answer_options = q.get("answerOptions", [])
                        if not isinstance(answer_options, list):
                            continue
                            
                        options = []
                        correct = ""
                        explanation = ""
                        
                        for opt in answer_options:
                            if isinstance(opt, dict):
                                options.append(opt.get("text", ""))
                                if opt.get("isCorrect"):
                                    correct = opt.get("text", "")
                                    explanation = opt.get("rationale", "")
                            elif isinstance(opt, str):
                                options.append(opt)
                        
                        quiz_data.append({
                            "question": q.get("question", ""),
                            "options": options,
                            "correct_answer": correct,
                            "explanation": explanation
                        })
                
                content = item.get("content", "")
                
                # Check if there is an explicit summary field (not title)
                summary = ai_content.get("summary", "") if isinstance(ai_content, dict) else ""
                
                # If no explicit summary, generate a preview from content
                if not summary and content:
                    summary = content[:300] + "..." if len(content) > 300 else content

                formatted_data.append({
                    "id": item.get("prid"),
                    "title": item.get("title", ""),
                    "ministry": "Ministry of Information & Broadcasting", # Default or extract
                    "date": item.get("date"),
                    "original_url": item.get("url", ""),
                    "summary": summary,
                    "content": content,
                    "quiz_data": quiz_data,
                    "mains_questions": item.get("mains_questions", []),
                    "tags": item.get("tags", [])
                })
            
            # Sort by date descending
            formatted_data.sort(key=lambda x: x.get('date') or "", reverse=True)
            return formatted_data
        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            print(f"Error loading pib_combined_data.json: {e}")
            return [{"error": str(e), "traceback": tb}]
    return []

class PIBReleaseList(APIView):
    def get(self, request):
        data = load_pib_data()
        date_str = request.query_params.get('date')
        if date_str:
            data = [item for item in data if item['date'] == date_str]
        return Response(data)

class PIBDatesList(APIView):
    def get(self, request):
        data = load_pib_data()
        valid_dates = [item['date'] for item in data if item.get('date')]
        unique_dates = []
        for d in valid_dates:
            if d not in unique_dates:
                unique_dates.append(d)
        return Response(unique_dates)

class PIBReleaseDetail(APIView):
    def get(self, request, id):
        data = load_pib_data()
        for item in data:
            if item['id'] == str(id):
                return Response(item)
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

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
class PIBQuestionsListView(APIView):
    def get(self, request):
        """
        Returns a list of all PIB Mains questions with status for the current user.
        """
        from .models import Essay
        
        # Optimize fetch: Get all PIB releases with mains_questions
        data = load_pib_data()
        releases = [item for item in data if item.get('mains_questions')]
        
        user_essays = {}
        if request.user.is_authenticated:
            # Fetch essays that look like PIB essays and map by topic title for easy lookup
            user_essays = {e.topic.title: e for e in Essay.objects.filter(user=request.user, topic__title__startswith="PIB:")}

        results = []
        for release in releases:
            mains_questions = release.get('mains_questions', [])
            for index, q_data in enumerate(mains_questions):
                # Build topic title exactly as in PIBStartEssayView
                topic_title = f"PIB: {release.get('title', '')[:60]}... - Q{index + 1}"
                
                status = 'unattempted'
                essay_id = None
                
                if topic_title in user_essays:
                    status = user_essays[topic_title].status
                    essay_id = user_essays[topic_title].id
                
                results.append({
                    "id": f"{release.get('id')}-{index}", # Unique ID for UI
                    "release_id": release.get('id'),
                    "release_title": release.get('title', ''),
                    "release_date": release.get('date'),
                    "question_index": index,
                    "question_text": q_data.get('question', ''),
                    "status": status,
                    "essay_id": essay_id
                })
                
        return Response(results)

def get_bookmarks_path():
    return os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'pib_bookmarks.json')

def load_bookmarks():
    path = get_bookmarks_path()
    if os.path.exists(path):
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_bookmarks(data):
    path = get_bookmarks_path()
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)

class PIBBookmarksView(APIView):
    def get(self, request):
        if not request.user.is_authenticated:
            return Response([])
        data = load_bookmarks()
        user_id = str(request.user.id)
        return Response(data.get(user_id, []))

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({"error": "Unauthorized"}, status=401)
        
        prid = request.data.get("prid")
        if not prid:
            return Response({"error": "PRID required"}, status=400)
            
        data = load_bookmarks()
        user_id = str(request.user.id)
        
        if user_id not in data:
            data[user_id] = []
            
        if prid in data[user_id]:
            data[user_id].remove(prid)
            bookmarked = False
        else:
            data[user_id].append(prid)
            bookmarked = True
            
        save_bookmarks(data)
        return Response({"prid": prid, "bookmarked": bookmarked})

