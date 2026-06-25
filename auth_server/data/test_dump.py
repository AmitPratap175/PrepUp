import pdfplumber
from pathlib import Path
from extract_ncert_history import extract_columns, strip_noise

pdf_path = "/media/dspratap/Maxtor/UPSC/Books/NCERT MCQs Indian History Class 6-12 (Old+New) for UPSC , -- Amibh Ranjan, Janmejay Sahani -- S_l, 2022 -- Arihant Publications India limited -- isbn13 9789326191081 -- 2b65631e72595ca40e1deb3bf57df27c -- Anna’s Archive.pdf"
with pdfplumber.open(pdf_path) as pdf:
    # Let's dump page 7 (index 6, the first page of questions)
    page = pdf.pages[6]
    left, right = extract_columns(page)
    print("=== LEFT ===")
    print(strip_noise(left))
    print("=== RIGHT ===")
    print(strip_noise(right))
