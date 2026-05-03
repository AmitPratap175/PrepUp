from django.db import models
from users.models import User
import uuid

class TestSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    test_id = models.CharField(max_length=255)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    score = models.IntegerField(null=True, blank=True)
    total_questions = models.IntegerField()
    correct_answers = models.IntegerField(default=0)
    answers = models.JSONField()
    status = models.CharField(max_length=20, default='in-progress')
    subject = models.CharField(max_length=255, null=True, blank=True)
    max_score = models.IntegerField(null=True, blank=True)
    current_question_index = models.IntegerField(default=0)

    def __str__(self):
        return f"Test Session {self.id} for {self.user.email}"

class UserQuizState(models.Model):
    """
    Stores the last attempted question for a user in a specific quiz.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    test_id = models.CharField(max_length=255)
    last_question_index = models.IntegerField(default=0)

    class Meta:
        unique_together = ('user', 'test_id')

    def __str__(self):
        return f'{self.user.email} - {self.test_id} - Last Question: {self.last_question_index}'

class UserQuizGoal(models.Model):
    """
    Stores the daily question goal for a user for a specific subject.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.CharField(max_length=255)
    goal = models.IntegerField(default=0)

    class Meta:
        unique_together = ('user', 'subject')

    def __str__(self):
        return f'{self.user.email} - {self.subject} - Goal: {self.goal}'


class UserQuizProgress(models.Model):
    """
    Stores the number of questions a user has attempted for a specific subject on a given day.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.CharField(max_length=255)
    date = models.DateField()
    questions_attempted = models.IntegerField(default=0)

    class Meta:
        unique_together = ('user', 'subject', 'date')

    def __str__(self):
        return f'{self.user.email} - {self.subject} - {self.date} - Attempted: {self.questions_attempted}'


class MockTestLeaderboard(models.Model):
    """
    Stores leaderboard entries for mock tests.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    test_id = models.CharField(max_length=255)
    score = models.IntegerField()
    rank = models.IntegerField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-score', 'timestamp']
        indexes = [
            models.Index(fields=['test_id', '-score']),
            models.Index(fields=['user', 'test_id']),
        ]
    
    def __str__(self):
        return f'{self.user.email} - Test {self.test_id} - Rank {self.rank}'


class UserAnswer(models.Model):
    """
    Stores detailed information about each question answered in a test session.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(TestSession, on_delete=models.CASCADE, related_name='user_answers')
    question_id = models.CharField(max_length=255)
    question_text = models.TextField(null=True, blank=True)
    topic = models.CharField(max_length=255, null=True, blank=True)
    user_answer = models.CharField(max_length=255, null=True, blank=True)
    correct_answer = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)
    time_spent = models.IntegerField(help_text="Time spent in seconds")
    status = models.CharField(
        max_length=20,
        choices=[
            ('correct', 'Correct'),
            ('incorrect', 'Incorrect'),
            ('skipped', 'Skipped'),
            ('marked', 'Marked for Review'),
        ],
        default='skipped'
    )
    
    class Meta:
        ordering = ['session', 'id']
        indexes = [
            models.Index(fields=['session', 'topic']),
            models.Index(fields=['session', 'status']),
        ]
    
    def __str__(self):
        return f'Answer for Q{self.question_id} in Session {self.session.id}'


class Badge(models.Model):
    """
    Defines available badges that users can earn.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    icon_url = models.URLField(null=True, blank=True)
    icon_emoji = models.CharField(max_length=10, default='🏆')
    criteria = models.JSONField(help_text="JSON defining the criteria for earning this badge")
    category = models.CharField(
        max_length=50,
        choices=[
            ('test', 'Test Achievement'),
            ('streak', 'Streak Achievement'),
            ('community', 'Community Achievement'),
            ('learning', 'Learning Achievement'),
        ],
        default='test'
    )
    points = models.IntegerField(default=10, help_text="Points awarded for earning this badge")
    
    def __str__(self):
        return f'{self.icon_emoji} {self.name}'


class UserBadge(models.Model):
    """
    Tracks badges earned by users.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'badge')
        ordering = ['-earned_at']
    
    def __str__(self):
        return f'{self.user.email} earned {self.badge.name}'


class EssayTopic(models.Model):
    """
    Essay topics for XAT preparation.
    """
    DOMAIN_CHOICES = [
        ('science', 'Science & Technology'),
        ('politics', 'Politics & Governance'),
        ('philosophy', 'Philosophy & Ethics'),
        ('business', 'Business & Economics'),
        ('social', 'Social Issues'),
        ('environment', 'Environment & Sustainability'),
        ('arts', 'Arts & Culture'),
        ('current_affairs', 'Current Affairs'),
    ]
    
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    description = models.TextField()
    domain = models.CharField(max_length=50, choices=DOMAIN_CHOICES)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='medium')
    context = models.TextField(help_text="Background information and context")
    key_points = models.JSONField(help_text="Key points to address in the essay")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['domain', '-created_at']),
            models.Index(fields=['difficulty']),
        ]
    
    def __str__(self):
        return f'{self.title} ({self.domain})'


class XATEssayQuestion(models.Model):
    """
    Static XAT essay questions from past years or practice sets.
    """
    qid = models.CharField(max_length=50, unique=True)
    passage_text = models.TextField(null=True, blank=True)
    question_text = models.TextField()
    solution_text = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return f"XAT Essay {self.qid}"


class Essay(models.Model):
    """
    User-written essays for XAT preparation.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='essays', null=True, blank=True)
    topic = models.ForeignKey(EssayTopic, on_delete=models.SET_NULL, null=True, blank=True)
    xat_question = models.ForeignKey(XATEssayQuestion, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=500)
    content = models.TextField(help_text="HTML content from Froala editor")
    word_count = models.IntegerField(default=0)
    time_spent = models.IntegerField(default=0, help_text="Time spent in seconds")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', '-updated_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f'{self.title} by {self.user.email}'


class EssayReview(models.Model):
    """
    LLM-generated reviews for essays.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    essay = models.OneToOneField(Essay, on_delete=models.CASCADE, related_name='review')
    overall_score = models.IntegerField(help_text="Overall score 0-100")
    structure_score = models.IntegerField(help_text="Structure score 0-100")
    coherence_score = models.IntegerField(help_text="Coherence score 0-100")
    arguments_score = models.IntegerField(help_text="Arguments score 0-100")
    language_score = models.IntegerField(help_text="Language score 0-100")
    detailed_feedback = models.JSONField(help_text="Detailed feedback by section")
    improvement_suggestions = models.JSONField(help_text="List of improvement suggestions")
    reviewed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-reviewed_at']
    
    def __str__(self):
        return f'Review for {self.essay.title} - Score: {self.overall_score}'


class UserDailySettings(models.Model):
    """
    Stores user preferences for daily targets.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='daily_settings')
    varc_questions = models.IntegerField(default=5)
    dilr_questions = models.IntegerField(default=5)
    qa_questions = models.IntegerField(default=5)
    varc_offset = models.IntegerField(default=0)
    dilr_offset = models.IntegerField(default=0)
    qa_offset = models.IntegerField(default=0)
    time_per_question = models.IntegerField(default=120, help_text="Time in seconds per question")

    def __str__(self):
        return f"Daily Settings for {self.user.email}"


class DailyTarget(models.Model):
    """
    Stores the generated daily questions for a user.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_targets')
    date = models.DateField()
    subject = models.CharField(max_length=50)
    questions = models.JSONField(help_text="List of question objects for this target")
    is_completed = models.BooleanField(default=False)
    score = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'date', 'subject')
        ordering = ['-date']

    def __str__(self):
        return f"{self.subject} Target for {self.user.email} on {self.date}"


class RevisionSchedule(models.Model):
    """
    Tracks questions scheduled for revision based on spaced repetition.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='revision_schedules')
    question_id = models.CharField(max_length=255)
    question_data = models.JSONField()
    subject = models.CharField(max_length=50)
    next_review_date = models.DateField()
    review_interval = models.IntegerField(default=2, help_text="Days until next review (2, 4, 6)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['next_review_date']

    def __str__(self):
        return f"Revision for {self.user.email} - {self.subject} (Due: {self.next_review_date})"


class UserChapterProgress(models.Model):
    """
    Tracks which chapterwise quizzes a user has marked as completed.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chapter_progress')
    chapter_id = models.CharField(max_length=255, help_text="Unique ID for the chapter/quiz")
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'chapter_id')
        ordering = ['-completed_at']

    def __str__(self):
        return f"{self.user.email} - {self.chapter_id} - {'Completed' if self.is_completed else 'Incomplete'}"


class PIBRelease(models.Model):
    """
    Stores PIB releases scraped from pib.gov.in.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prid = models.CharField(max_length=50, unique=True, help_text="Release ID from PIB (PRID query param)")
    title = models.CharField(max_length=500)
    ministry = models.CharField(max_length=255, null=True, blank=True)
    date = models.DateTimeField(null=True, blank=True)
    content = models.TextField()
    summary = models.TextField(null=True, blank=True)
    quiz_data = models.JSONField(null=True, blank=True, help_text="Generated quiz questions")
    mains_questions = models.JSONField(null=True, blank=True, help_text="Generated Mains Q&A")
    original_url = models.URLField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.title} ({self.prid})"


class NewsArticle(models.Model):
    """
    Stores news articles scraped from sources like The Hindu via NewsAPI.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    article_id = models.CharField(max_length=255, unique=True, help_text="Unique identifier (URL or hash)")
    title = models.CharField(max_length=500)
    source = models.CharField(max_length=255)
    author = models.CharField(max_length=255, null=True, blank=True)
    date = models.DateTimeField(null=True, blank=True)
    content = models.TextField(help_text="Full or partial content of the article")
    summary = models.TextField(null=True, blank=True)
    quiz_data = models.JSONField(null=True, blank=True, help_text="Generated quiz questions")
    mains_questions = models.JSONField(null=True, blank=True, help_text="Generated Mains Q&A")
    original_url = models.URLField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.title} ({self.source})"


class UPSCMasteryState(models.Model):
    """
    Stores the complete state for the UPSC 2027 Mastery application (tasks, history, settings).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='upsc_mastery_state')
    state_data = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"UPSC Mastery State for {self.user.email}"

