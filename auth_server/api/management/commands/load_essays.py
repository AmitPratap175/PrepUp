from django.core.management.base import BaseCommand
from api.models import XATEssayQuestion
import json
import os
from django.conf import settings

class Command(BaseCommand):
    help = 'Loads XAT essays from JSON file'

    def handle(self, *args, **options):
        file_path = os.path.join(settings.BASE_DIR, 'data', 'xat', 'essay.json')
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
            return

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
                
        self.stdout.write(self.style.SUCCESS(f"Successfully loaded essays. Created: {created_count}, Updated: {updated_count}"))
