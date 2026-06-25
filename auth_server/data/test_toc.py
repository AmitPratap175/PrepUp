import pdfplumber

pdf_path = "/media/dspratap/Maxtor/UPSC/Books/NCERT MCQs India & World Geography Class 6-12 (Old + New) -- Vivek Sharma, Rajpriya -- 2022 -- Arihant Publications India limited -- isbn13 9789326191098 -- 094ff85ebad530d3f0aa9f035a7cfeb3 -- Anna’s Archive.pdf"
with pdfplumber.open(pdf_path) as pdf:
    for i in range(2, 7):
        print(f"=== PAGE {i} ===")
        print(pdf.pages[i].extract_text()[:500])
