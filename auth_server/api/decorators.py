from functools import wraps
from django.http import JsonResponse
from users.models import User
import jwt
from django.conf import settings

def token_required(f):
    """
    Decorator to ensure that a user is authenticated with a valid JWT token.

    This decorator checks for a JWT token in the 'Authorization' header,
    decodes it, and attaches the corresponding user object to the request.
    If the token is missing, expired, or invalid, it returns a 401
    Unauthorized response.

    Args:
        f: The view function to be decorated.

    Returns:
        The decorated function.
    """
    @wraps(f)
    def decorated_function(request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return JsonResponse({'error': 'Authorization header missing'}, status=401)

        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user = User.objects.get(id=payload['user_id'])
            request.user = user
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token has expired'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'error': 'Invalid token'}, status=401)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=401)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=401)

        return f(request, *args, **kwargs)
    return decorated_function
