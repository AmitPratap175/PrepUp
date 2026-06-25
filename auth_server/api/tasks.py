from celery import shared_task
from django.db.models import F
from users.models import User


@shared_task
def recalculate_leaderboard_ranks(test_id=None):
    """
    Recalculate leaderboard ranks for a specific test or globally.
    
    Args:
        test_id: Optional test ID. If None, recalculates global leaderboard.
    """
    if test_id:
        # Test-specific leaderboard recalculation
        # This will be implemented when MockTestLeaderboard model is created
        pass
    else:
        # Global leaderboard - update user ranks based on total_score
        users = User.objects.order_by('-total_score', '-current_streak')
        for rank, user in enumerate(users, start=1):
            # Store rank in user model or separate ranking table
            # For now, we'll just log it
            print(f"User {user.email} rank: {rank}")
    
    return f"Leaderboard recalculated for test_id={test_id}"


@shared_task
def process_test_analytics(session_id):
    """
    Process detailed analytics for a completed test session.
    
    Args:
        session_id: TestSession ID
    """
    from api.models import TestSession
    
    try:
        session = TestSession.objects.get(id=session_id)
        # Calculate topic-wise performance
        # This will be enhanced when UserAnswer model is created
        print(f"Processing analytics for session {session_id}")
        return f"Analytics processed for session {session_id}"
    except TestSession.DoesNotExist:
        return f"Session {session_id} not found"


@shared_task
def check_and_award_badges(user_id):
    """
    Check if a user has earned any new badges and award them.
    
    Args:
        user_id: User ID to check
    """
    # This will be implemented when Badge models are created
    print(f"Checking badges for user {user_id}")
    return f"Badges checked for user {user_id}"


@shared_task
def send_daily_reminder(user_id):
    """
    Send a daily study reminder to a user.
    
    Args:
        user_id: User ID
    """
    # This will be implemented with email/notification system
    print(f"Sending daily reminder to user {user_id}")
    return f"Reminder sent to user {user_id}"


@shared_task
def cleanup_old_sessions():
    """
    Clean up old test sessions (older than 90 days).
    """
    from datetime import timedelta
    from django.utils import timezone
    from api.models import TestSession
    
    cutoff_date = timezone.now() - timedelta(days=90)
    deleted_count, _ = TestSession.objects.filter(created_at__lt=cutoff_date).delete()
    
    return f"Cleaned up {deleted_count} old sessions"


@shared_task
async def review_essay(essay_id):
    """
    Review an essay using LLM and create EssayReview.
    
    Args:
        essay_id: Essay ID (string UUID)
    """
    from api.models import Essay, EssayReview
    from api.services.essay_reviewer import EssayReviewer
    from django.utils import timezone
    
    try:
        essay = Essay.objects.get(id=essay_id)
        
        # Check if already reviewed
        if hasattr(essay, 'review'):
            return f"Essay {essay_id} already reviewed"
        
        # Review the essay
        reviewer = EssayReviewer()
        review_data = await reviewer.analyze_essay(essay.title, essay.content)
        
        # Create review
        EssayReview.objects.create(
            essay=essay,
            overall_score=review_data.get('overall_score', 0),
            structure_score=review_data.get('structure_score', 0),
            coherence_score=review_data.get('coherence_score', 0),
            arguments_score=review_data.get('arguments_score', 0),
            language_score=review_data.get('language_score', 0),
            detailed_feedback=review_data.get('detailed_feedback', {}),
            improvement_suggestions=review_data.get('improvement_suggestions', [])
        )
        
        # Update essay status
        essay.status = 'reviewed'
        essay.save()
        
        return f"Essay {essay_id} reviewed successfully"
        
    except Essay.DoesNotExist:
        return f"Essay {essay_id} not found"
    except Exception as e:
        print(f"Error reviewing essay {essay_id}: {e}")
        return f"Error reviewing essay: {str(e)}"


@shared_task
async def generate_flashcard_task(revision_id, question_data, user_answer):
    """
    Generate an AI flashcard for a missed question and attach it to the RevisionSchedule.
    """
    from api.models import RevisionSchedule
    from api.services.srs_service import generate_upsc_flashcard
    
    try:
        revision = await RevisionSchedule.objects.aget(id=revision_id)
        
        # Generate flashcard using the AI service
        flashcard_data = await generate_upsc_flashcard(question_data, user_answer)
        
        if flashcard_data:
            revision.ai_flashcard_content = flashcard_data
            await revision.asave()
            return f"Flashcard generated for revision {revision_id}"
        else:
            return f"Failed to generate flashcard for revision {revision_id}"
            
    except RevisionSchedule.DoesNotExist:
        return f"Revision {revision_id} not found"
    except Exception as e:
        print(f"Error generating flashcard {revision_id}: {e}")
        return f"Error: {str(e)}"


@shared_task
def process_math_evaluation_task(session_id):
    """
    Background task to evaluate an uploaded math PDF using Gemini.
    """
    from api.models import OptionalEvaluationSession, OptionalEvaluationQuestion
    from api.services.math_evaluator import evaluate_math_pdf
    from django.utils import timezone
    import os

    try:
        session = OptionalEvaluationSession.objects.get(id=session_id)
        session.status = 'processing'
        session.save()

        if not session.uploaded_file:
            session.status = 'failed'
            session.overall_feedback = "No file was found for processing."
            session.save()
            return "Failed: No file"

        file_path = session.uploaded_file.path
        if not os.path.exists(file_path):
            session.status = 'failed'
            session.overall_feedback = "File does not exist on disk."
            session.save()
            return "Failed: File missing"

        # Call Gemini Service
        result = evaluate_math_pdf(file_path)

        if not result:
            session.status = 'failed'
            session.overall_feedback = "Gemini evaluation failed to return a valid response."
            session.save()
            return "Failed: Gemini error"

        # Save results
        session.total_score = result.get('total_score', 0)
        session.max_score = result.get('max_score', 0)
        session.overall_feedback = result.get('overall_feedback', '')
        session.gemini_insights = result.get('gemini_insights', {})
        
        # Save individual questions
        questions_data = result.get('questions', [])
        for q_data in questions_data:
            OptionalEvaluationQuestion.objects.create(
                session=session,
                question_number=q_data.get('question_number', 'N/A'),
                extracted_question_text=q_data.get('extracted_question_text', ''),
                topic=q_data.get('topic', ''),
                marks_obtained=q_data.get('marks_obtained', 0),
                max_marks=q_data.get('max_marks', 0),
                feedback=q_data.get('feedback', '')
            )

        session.status = 'completed'
        session.completed_at = timezone.now()
        session.save()

        return f"Evaluation completed for session {session_id}"

    except OptionalEvaluationSession.DoesNotExist:
        return f"Session {session_id} not found"
    except Exception as e:
        print(f"Error processing math evaluation {session_id}: {e}")
        try:
            session.status = 'failed'
            session.overall_feedback = f"Internal processing error: {str(e)}"
            session.save()
        except:
            pass
        return f"Error: {str(e)}"
