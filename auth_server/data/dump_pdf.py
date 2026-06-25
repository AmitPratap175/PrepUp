import pdfplumber
import sys

def dump_text(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages[:3]):
            print(f"--- PAGE {i+1} ---")
            print(page.extract_text())
            print("\n")

if __name__ == "__main__":
    dump_text(sys.argv[1])
