import json
import os
import sys
import django

# Add the project root to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'auth_server.settings')
django.setup()

from api.models import XATEssayQuestion

def load_essays():
    file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'xat', 'essay.json')
    
    with open(file_path, 'r') as f:
        data = json.load(f)
        
    questions = data.get('questions', [])
    
    created_count = 0
    updated_count = 0
    
    for q in questions:
        qid = q.get('qid')
        passage_text = q.get('passage_text')
        question_text = q.get('question_text')
        solution_text = q.get('solution_text')
        
        obj, created = XATEssayQuestion.objects.update_or_create(
            qid=qid,
            defaults={
                'passage_text': passage_text,
                'question_text': question_text,
                'solution_text': solution_text
            }
        )
        
        if created:
            created_count += 1
        else:
            updated_count += 1
            
    print(f"Successfully loaded essays. Created: {created_count}, Updated: {updated_count}")

if __name__ == '__main__':
    load_essays()
