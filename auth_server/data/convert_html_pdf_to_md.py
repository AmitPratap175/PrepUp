import os
import sys
from bs4 import BeautifulSoup

def convert_html_to_md(html_file_path, output_md_path):
    """
    Parses an iQuanta HTML file (saved from browser) and extracts the PDF content to Markdown.
    """
    if not os.path.exists(html_file_path):
        print(f"Error: File not found at {html_file_path}")
        return

    print(f"Reading {html_file_path}...")
    with open(html_file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')
    
    markdown_content = "# GK Compendium - Indian Polity & Constitution\n\n"
    
    # Strategy 1: Look for .textLayer (common in PDF.js renderers)
    text_layers = soup.find_all(class_='textLayer')
    
    if text_layers:
        print(f"Found {len(text_layers)} text layers (pages).")
        for i, layer in enumerate(text_layers):
            markdown_content += f"\n## Page {i + 1}\n\n"
            
            # Extract spans and sort them by 'top' style to ensure reading order
            spans = layer.find_all('span')
            span_data = []
            
            for span in spans:
                style = span.get('style', '')
                top_value = 0.0
                # Parse style="top: 123.45px;"
                for part in style.split(';'):
                    if 'top' in part:
                        try:
                            top_value = float(part.split(':')[1].replace('px', '').strip())
                        except ValueError:
                            pass
                        break
                span_data.append({'text': span.get_text(strip=True), 'top': top_value})
            
            # Sort by vertical position
            span_data.sort(key=lambda x: x['top'])
            
            # Join text
            page_text = ' '.join([s['text'] for s in span_data])
            markdown_content += page_text + "\n\n---\n"
            
    else:
        print("No .textLayer found. Trying generic page detection...")
        # Strategy 2: Look for generic page containers
        # This is a heuristic; might need adjustment based on actual DOM
        pages = soup.find_all(lambda tag: tag.name == 'div' and ('page' in tag.get('class', []) or 'Page' in tag.get('class', [])))
        
        if pages:
             for i, page in enumerate(pages):
                text = page.get_text(strip=True)
                if len(text) > 50: # Filter out small nav elements
                    markdown_content += f"\n## Page {i + 1}\n\n"
                    markdown_content += text + "\n\n---\n"
        else:
            print("No specific pages found. Dumping body text.")
            markdown_content += soup.body.get_text(separator='\n\n', strip=True)

    print(f"Writing output to {output_md_path}...")
    with open(output_md_path, 'w', encoding='utf-8') as f:
        f.write(markdown_content)
    
    print("Done!")

if __name__ == "__main__":
    # Default paths - User can change these or pass as args
    # Assuming the user will save the file as 'iquanta_page.html' in the same dir
    
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    else:
        # Fallback to looking for a likely file in the current directory
        input_file = "iquanta_page.html" 
        
    output_file = "GK_Compendium_Indian_Polity.md"
    
    convert_html_to_md(input_file, output_file)
