from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.http import FileResponse
import tempfile
import os
import shutil
import re
import uuid
import requests
import subprocess
from api.storage import storage

class ChapterPDFExportView(APIView):
    """
    Generates and returns a PDF for a specific Chapterwise Quiz.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        chapter_id = request.data.get('chapter_id')
        if not chapter_id:
            return Response({'error': 'Chapter ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Frontend generates ID as: cw_{index}_{safeTitle}
        # We need to load quiz.json and match this ID logic
        import json
        from django.conf import settings
        from pathlib import Path

        file_path = Path(settings.BASE_DIR) / "data" / "quiz.json"
        
        selected_chapter = None
        selected_subject = None
        
        if file_path.exists():
            try:
                with open(file_path, 'r') as f:
                    chapters = json.load(f)
                    
                    for idx, chapter in enumerate(chapters):
                        title = chapter.get('title', f"Chapter {idx + 1}")
                        safe_title = re.sub(r'[^a-zA-Z0-9]', '', title)
                        # Match the ID generation logic from frontend
                        generated_id = f"cw_{idx}_{safe_title}"
                        
                        if generated_id == chapter_id:
                            selected_chapter = chapter
                            selected_subject = title
                            break
                            
                        # Fallback: Also check if strict index match works (if ID format changes)
                        # or if generated_id is just index based on legacy
                        if str(chapter_id) == str(idx):  # simple index match
                             selected_chapter = chapter
                             selected_subject = title
                             break
            except Exception as e:
                print(f"Error reading quiz.json: {e}")

        if not selected_chapter:
             # Try storage fallback just in case
             practice_tests = storage.get_practice_tests()
             for test in practice_tests:
                if str(test.get('id')) == str(chapter_id):
                    # We need to convert storage format to what we expect
                    selected_chapter = {'questions': test.get('questions', [])}
                    selected_subject = test.get('title')
                    break
        
        if not selected_chapter:
             return Response({'error': 'Chapter not found'}, status=status.HTTP_404_NOT_FOUND)

        questions = selected_chapter.get('questions', [])
        
        # Normalize questions if needed (ensure qid/id)
        for q in questions:
             if 'answerOptions' in q and 'options' not in q:
                 q['options'] = q['answerOptions']

        if not questions:
             return Response({'error': 'No questions found in this chapter'}, status=status.HTTP_404_NOT_FOUND)

        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                latex_content = self._generate_latex(selected_subject, questions, temp_dir)
                pdf_path = self._compile_latex(latex_content, temp_dir)
                
                # Copy PDF to a safe location before temp_dir is deleted
                fd, safe_pdf_path = tempfile.mkstemp(suffix='.pdf')
                with os.fdopen(fd, 'wb') as tmp:
                    with open(pdf_path, 'rb') as src:
                        shutil.copyfileobj(src, tmp)

            pdf_file = open(safe_pdf_path, 'rb')
            response = FileResponse(pdf_file, content_type='application/pdf')
            safe_filename = re.sub(r'[^a-zA-Z0-9_\-]', '_', selected_subject)
            response['Content-Disposition'] = f'attachment; filename="{safe_filename}.pdf"'
            return response
        except Exception as e:
            print(f"PDF Generation Error: {e}")
            return Response({'error': 'Failed to generate PDF. Please ensure backend has texlive installed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _download_image(self, image_url, temp_dir):
        try:
            ext = os.path.splitext(image_url)[1] or '.png'
            ext = ext.split('?')[0]
            if ext.lower() not in ['.png', '.jpg', '.jpeg', '.pdf']:
                ext = '.png'
            
            filename = f"img_{uuid.uuid4().hex}{ext}"
            filepath = os.path.join(temp_dir, filename)
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(image_url, headers=headers, timeout=10, verify=False)
            if response.status_code == 200:
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                return filename
            else:
                return None
        except Exception as e:
            print(f"Failed to process image {image_url}: {e}")
            return None

    def _process_text_with_images(self, text, temp_dir):
        if not text: return ""

        def replace_image(match):
            alt_text = match.group(1)
            image_url = match.group(2)
            
            filename = self._download_image(image_url, temp_dir)
            if filename:
                return f'\\begin{{figure}}[H] \\centering \\includegraphics[width=0.8\\linewidth]{{{filename}}} \\caption{{{self._markdown_to_latex(alt_text)}}} \\end{{figure}}'
            else:
                return ""

        pattern = r'!\[(.*?)\]\((.*?)\)'
        parts = re.split(pattern, text)
        result = []
        i = 0
        while i < len(parts):
            result.append(self._markdown_to_latex(parts[i]))
            if i + 2 < len(parts):
                alt = parts[i+1]
                url = parts[i+2]
                class Match:
                    def group(self, n):
                        return alt if n == 1 else url
                result.append(replace_image(Match()))
                i += 3
            else:
                i += 1
        return ''.join(result)

    def _markdown_to_latex(self, text):
        if not text: return ""
        parts = re.split(r'(\$[^$]+\$)', text)
        processed_parts = []
        for part in parts:
            if part.startswith('$') and part.endswith('$'):
                processed_parts.append(part)
            else:
                part = part.replace('\\', '\\textbackslash{}') \
                           .replace('{', '\\{').replace('}', '\\}') \
                           .replace('&', '\\&').replace('#', '\\#') \
                           .replace('^', '\\textasciicircum{}') \
                           .replace('_', '\\_').replace('~', '\\textasciitilde{}') \
                           .replace('%', '\\%')
                part = re.sub(r'\*\*(.*?)\*\*', r'\\textbf{\1}', part)
                part = re.sub(r'\*(.*?)\*', r'\\textit{\1}', part)
                part = part.replace('\n', ' \\\\ \n')
                processed_parts.append(part)
        return ''.join(processed_parts)

    def _generate_latex(self, subject, questions, temp_dir):
        # Escape special characters in subject for proper LaTeX display
        safe_subject = self._markdown_to_latex(subject)
        
        content = [
            r'\documentclass[12pt]{article}',
            r'\usepackage[utf8]{inputenc}',
            r'\usepackage{amsmath}',
            r'\usepackage{amssymb}',
            r'\usepackage{geometry}',
            r'\usepackage{enumitem}',
            r'\usepackage{fancyhdr}',
            r'\usepackage{graphicx}',
            r'\usepackage{float}',
            r'\usepackage{longtable}',
            r'\geometry{a4paper, margin=1in}',
            r'\setlength{\headheight}{15pt}',
            r'\pagestyle{fancy}',
            r'\fancyhf{}',
            f'\\rhead{{PrepUp - {safe_subject}}}',
            r'\lhead{Chapterwise Practice}',
            r'\rfoot{Page \thepage}',
            r'\begin{document}',
            r'\section*{Questions}',
            r'\begin{enumerate}'
        ]

        solutions_list = []

        for i, q in enumerate(questions):
            item_content = ""
            passage = q.get('passage_text')
            if passage:
                passage_text = self._process_text_with_images(passage, temp_dir)
                item_content += f'\\textbf{{Passage:}} {passage_text} \\\\ \\vspace{{0.2cm}}\n'
            
            q_text = self._process_text_with_images(q.get('question', '') or q.get('question_text', ''), temp_dir)
            item_content += f"{{\\bfseries {q_text}}}"
            
            image_url_raw = q.get('image_url')
            if image_url_raw:
                urls = [url.strip() for url in image_url_raw.split(',') if url.strip()]
                for url in urls:
                    filename = self._download_image(url, temp_dir)
                    if filename:
                        image_latex = f'\\begin{{figure}}[H] \\centering \\includegraphics[width=0.8\\linewidth]{{{filename}}} \\caption{{Question Image}} \\end{{figure}}'
                        item_content += f" \\\\ {image_latex}"

            content.append(f'  \\item {item_content}')
            content.append(r'  \begin{enumerate}[label=(\Alph*)]')
            
            options = q.get('options', [])
            # Normalize options if they are simple strings
            if options and isinstance(options[0], str):
                 options = [{"text": o} for o in options]

            for opt in options:
                opt_text_raw = ""
                if isinstance(opt, dict):
                    opt_text_raw = opt.get('option_text') or opt.get('text') or ""
                else:
                    opt_text_raw = str(opt)
                
                opt_text = self._process_text_with_images(opt_text_raw, temp_dir)
                content.append(f'    \\item {opt_text}')
            content.append(r'  \end{enumerate}')
            
            solution = q.get('solution_text') or q.get('explanation') or q.get('rationale')
            if solution:
                 sol_text = self._process_text_with_images(solution, temp_dir)
                 solutions_list.append(f'\\textbf{{Q.{i+1}:}} {sol_text} \\\\ \\vspace{{0.5cm}}')
            
            content.append(r'  \vspace{0.5cm}')

        content.append(r'\end{enumerate}')
        content.append(r'\newpage')
        content.append(r'\section*{Answer Key}')
        
        content.append(r'\begin{longtable}{|c|c|}')
        content.append(r'\hline')
        content.append(r'\textbf{Q.No} & \textbf{Answer} \\')
        content.append(r'\hline')
        content.append(r'\endhead')
        
        for i, q in enumerate(questions):
            answer = q.get('correctAnswer') or q.get('correct_option_data') or ''
            options = q.get('options', [])
            if options and isinstance(options[0], str):
                 options = [{"text": o} for o in options]

            answer_label = "?"
            found_by_flag = False
            for idx, opt in enumerate(options):
                if isinstance(opt, dict) and opt.get('isCorrect') is True:
                    answer_label = chr(65 + idx)
                    found_by_flag = True
                    break
            
            if not found_by_flag:
                if str(answer).isdigit():
                    idx = int(answer) - 1
                    if 0 <= idx < 26:
                        answer_label = chr(65 + idx)
                else:
                     for idx, opt in enumerate(options):
                        opt_val = opt.get('option_text') or opt.get('text') or ''
                        if str(opt_val).strip() == str(answer).strip():
                            answer_label = chr(65 + idx)
                            break
            # Fallback if label is still ? but we have an answer string, just print it cropped
            if answer_label == "?" and answer:
                answer_label = str(answer)[:10]

            content.append(f'{i + 1} & {answer_label} \\\\ \\hline')

        content.append(r'\end{longtable}')
        
        if solutions_list:
            content.append(r'\newpage')
            content.append(r'\section*{Solutions}')
            for sol in solutions_list:
                content.append(sol)

        content.append(r'\end{document}')
        return '\n'.join(content)

    def _compile_latex(self, latex_content, temp_dir):
        tex_file = os.path.join(temp_dir, 'document.tex')
        with open(tex_file, 'w') as f:
            f.write(latex_content)
        
        for _ in range(2):
            process = subprocess.run(
                ['pdflatex', '-interaction=nonstopmode', 'document.tex'],
                cwd=temp_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
        
        pdf_file = os.path.join(temp_dir, 'document.pdf')
        if not os.path.exists(pdf_file):
            raise Exception("PDF file was not generated")
        
        return pdf_file
