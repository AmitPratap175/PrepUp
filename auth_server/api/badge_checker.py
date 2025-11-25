from api.models import Badge, UserBadge, TestSession, MockTestLeaderboard
from users.models import User, StudyDay
from django.db.models import Count, Q
from datetime import timedelta
from django.utils import timezone


def check_badges(user):
    """
    Check and award badges to a user based on their activity.
    
    Args:
        user: User instance to check badges for
        
    Returns:
        List of newly awarded badges
    """
    newly_awarded = []
    
    # Get all badges
    all_badges = Badge.objects.all()
    
    # Get badges user already has
    user_badge_ids = UserBadge.objects.filter(user=user).values_list('badge_id', flat=True)
    
    for badge in all_badges:
        # Skip if user already has this badge
        if badge.id in user_badge_ids:
            continue
            
        # Check if user meets criteria
        if check_badge_criteria(user, badge):
            # Award the badge
            UserBadge.objects.create(user=user, badge=badge)
            newly_awarded.append(badge)
    
    return newly_awarded


def check_badge_criteria(user, badge):
    """
    Check if a user meets the criteria for a specific badge.
    
    Args:
        user: User instance
        badge: Badge instance
        
    Returns:
        Boolean indicating if criteria is met
    """
    criteria = badge.criteria
    badge_type = criteria.get('type')
    
    if badge_type == 'test_count':
        # Badge for completing N tests
        required_count = criteria.get('count', 0)
        user_test_count = TestSession.objects.filter(
            user=user,
            status='completed'
        ).count()
        return user_test_count >= required_count
    
    elif badge_type == 'high_score':
        # Badge for scoring above a threshold
        required_score = criteria.get('score', 0)
        has_high_score = TestSession.objects.filter(
            user=user,
            score__gte=required_score
        ).exists()
        return has_high_score
    
    elif badge_type == 'streak':
        # Badge for maintaining a streak
        required_streak = criteria.get('days', 0)
        return user.current_streak >= required_streak
    
    elif badge_type == 'perfect_score':
        # Badge for getting 100% on a test
        has_perfect = TestSession.objects.filter(
            user=user,
            score=models.F('max_score')
        ).exists()
        return has_perfect
    
    elif badge_type == 'early_bird':
        # Badge for studying early in the morning
        morning_sessions = StudyDay.objects.filter(
            user=user,
            date__gte=timezone.now() - timedelta(days=30)
        ).count()
        required_days = criteria.get('days', 7)
        return morning_sessions >= required_days
    
    elif badge_type == 'leaderboard_top':
        # Badge for reaching top N on leaderboard
        required_rank = criteria.get('rank', 10)
        top_rank = MockTestLeaderboard.objects.filter(
            user=user,
            rank__lte=required_rank
        ).exists()
        return top_rank
    
    return False


def create_default_badges():
    """
    Create default badges for the platform.
    Should be run once during initial setup.
    """
    default_badges = [
        {
            'name': 'First Steps',
            'description': 'Complete your first test',
            'icon_emoji': '🎯',
            'category': 'test',
            'criteria': {'type': 'test_count', 'count': 1},
            'points': 10
        },
        {
            'name': 'Test Taker',
            'description': 'Complete 10 tests',
            'icon_emoji': '📝',
            'category': 'test',
            'criteria': {'type': 'test_count', 'count': 10},
            'points': 50
        },
        {
            'name': 'Serial Learner',
            'description': 'Complete 50 tests',
            'icon_emoji': '🎓',
            'category': 'test',
            'criteria': {'type': 'test_count', 'count': 50},
            'points': 200
        },
        {
            'name': 'High Scorer',
            'description': 'Score above 90% in any test',
            'icon_emoji': '⭐',
            'category': 'test',
            'criteria': {'type': 'high_score', 'score': 90},
            'points': 100
        },
        {
            'name': 'Perfect Score',
            'description': 'Get 100% on a test',
            'icon_emoji': '💯',
            'category': 'test',
            'criteria': {'type': 'perfect_score'},
            'points': 150
        },
        {
            'name': 'Week Warrior',
            'description': 'Maintain a 7-day study streak',
            'icon_emoji': '🔥',
            'category': 'streak',
            'criteria': {'type': 'streak', 'days': 7},
            'points': 75
        },
        {
            'name': 'Streak Master',
            'description': 'Maintain a 30-day study streak',
            'icon_emoji': '⚡',
            'category': 'streak',
            'criteria': {'type': 'streak', 'days': 30},
            'points': 300
        },
        {
            'name': 'Early Bird',
            'description': 'Study early morning for 7 days',
            'icon_emoji': '🌅',
            'category': 'learning',
            'criteria': {'type': 'early_bird', 'days': 7},
            'points': 50
        },
        {
            'name': 'Top 10',
            'description': 'Reach top 10 on any leaderboard',
            'icon_emoji': '🏆',
            'category': 'test',
            'criteria': {'type': 'leaderboard_top', 'rank': 10},
            'points': 200
        },
        {
            'name': 'Champion',
            'description': 'Reach #1 on any leaderboard',
            'icon_emoji': '👑',
            'category': 'test',
            'criteria': {'type': 'leaderboard_top', 'rank': 1},
            'points': 500
        },
    ]
    
    created_badges = []
    for badge_data in default_badges:
        badge, created = Badge.objects.get_or_create(
            name=badge_data['name'],
            defaults=badge_data
        )
        if created:
            created_badges.append(badge)
    
    return created_badges
