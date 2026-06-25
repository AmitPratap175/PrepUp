import pdfplumber
import re

pdf_path = "/media/dspratap/Maxtor/UPSC/Books/NCERT MCQs India & World Geography Class 6-12 (Old + New) -- Vivek Sharma, Rajpriya -- 2022 -- Arihant Publications India limited -- isbn13 9789326191098 -- 094ff85ebad530d3f0aa9f035a7cfeb3 -- Anna’s Archive.pdf"

chapters = {}
with pdfplumber.open(pdf_path) as pdf:
    toc_text = ""
    for i in range(2, 7):
        toc_text += pdf.pages[i].extract_text() + "\n"

    for match in re.finditer(r'Chapter (\d+)\.\s+(.*?)\s+(\d+)\-', toc_text):
        ch_num = match.group(1).zfill(2)
        ch_name = match.group(2).strip()
        book_page = int(match.group(3))
        pdf_index = book_page + 6
        chapters[pdf_index] = (ch_num, ch_name)

print("CHAPTER_MAP = {")
for idx in sorted(chapters.keys()):
    print(f"    {idx}: ('{chapters[idx][0]}', '{chapters[idx][1]}'),")
print("}")
