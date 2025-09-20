import os
import json
import glob
import urllib.request
from urllib.parse import urlparse
import mimetypes
import ssl

def download_images():
    # The script is inside the 'scraper' project directory.
    project_root = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(project_root, 'frontend', 'src', 'data')
    output_dir = os.path.join(project_root, 'images')

    print(f"Data directory: {data_dir}")
    print(f"Output directory: {output_dir}")

    os.makedirs(output_dir, exist_ok=True)

    json_files = glob.glob(os.path.join(data_dir, '*.json'))

    if not json_files:
        print(f"No JSON files found in {data_dir}")
        return

    # To handle SSL certificate issues if any
    ssl_context = ssl._create_unverified_context()

    for json_file in json_files:
        subject_name = os.path.splitext(os.path.basename(json_file))[0]
        subject_dir = os.path.join(output_dir, subject_name)
        os.makedirs(subject_dir, exist_ok=True)
        print(f"--- Processing {subject_name} ---")

        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                content = json.load(f)
        except json.JSONDecodeError:
            print(f"  -> Skipping invalid JSON file: {json_file}")
            continue

        if 'questions' not in content or not isinstance(content.get('questions'), list):
            continue

        for question in content.get('questions', []):
            image_url = question.get('image_url')

            if not image_url:
                continue

            urls = []
            if isinstance(image_url, str):
                urls = [u.strip() for u in image_url.split(',') if u.strip()]
            elif isinstance(image_url, list):
                urls = image_url

            for url in urls:
                if not isinstance(url, str) or not url.startswith('http'):
                    continue

                try:
                    # Extract filename from URL
                    path = urlparse(url).path
                    filename = os.path.basename(path)
                    
                    if not filename:
                        filename = question.get('qid', 'unnamed_image')

                    # Ensure filename has a valid extension
                    _, ext = os.path.splitext(filename)
                    if not ext:
                        try:
                            with urllib.request.urlopen(url, context=ssl_context, timeout=10) as response:
                                content_type = response.info().get_content_type()
                                if content_type:
                                    guessed_ext = mimetypes.guess_extension(content_type)
                                    if guessed_ext:
                                        filename += guessed_ext
                                    else:
                                        filename += ".jpg" # Fallback
                                else:
                                    filename += ".jpg" # Fallback
                        except Exception:
                             filename += ".jpg" # Fallback on error
                    
                    filepath = os.path.join(subject_dir, filename)
                    
                    # Download the image
                    with urllib.request.urlopen(url, context=ssl_context, timeout=10) as response, open(filepath, 'wb') as out_file:
                        data = response.read() # a `bytes` object
                        out_file.write(data)

                    print(f"  -> Downloaded {filename}")

                except urllib.error.URLError as e:
                    print(f"  -> Failed to download {url}: {e.reason}")
                except Exception as e:
                    print(f"  -> An unexpected error occurred for {url}: {e}")

if __name__ == '__main__':
    download_images()
    print("\nImage download process finished.")
