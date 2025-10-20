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
