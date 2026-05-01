"""
Split Mental Math Made Easy PDF into its 22 chapters.
Usage: python split_mental_math.py

Requires: pip install pypdf
Input:    APPLIED MATHEMATICS_ MENTAL MATH MADE EASY (Fast, Quick, -- John Carlin -- 2013 -- Rivershore Books -- fc4d1bad8a39317f0838c0a991db0179 -- Anna’s Archive.pdf
Output:   22 PDF files in OUTPUT_DIR
"""

from pypdf import PdfReader, PdfWriter
import os

INPUT_FILE = "/home/dspratap/Downloads/PrepUp/APPLIED MATHEMATICS_ MENTAL MATH MADE EASY (Fast, Quick, -- John Carlin -- 2013 -- Rivershore Books -- fc4d1bad8a39317f0838c0a991db0179 -- Anna’s Archive.pdf"
OUTPUT_DIR = "/home/dspratap/Downloads/PrepUp/NCERT/Mental Math"

# (chapter_name, start_page, end_page) — pages are 1-indexed, inclusive
CHAPTERS = [
    ("01 - Favorite Detectives",                   6,    9),
    ("02 - The Times Tables",                     10,   22),
    ("03 - Algebra",                              23,   24),
    ("04 - Two Digit Multiplication",             25,   26),
    ("05 - Borrowing, Digit Sums, and Proportion", 27,   43),
    ("06 - Wait—There’s More!",                   44,   51),
    ("07 - Open Carry",                           52,   56),
    ("08 - Modified Carry",                       57,   61),
    ("09 - More On Cross Products",               62,   66),
    ("10 - Concealed Carry",                      67,   69),
    ("11 - Ratios",                               70,   73),
    ("12 - Trachtenberg Method",                  74,   76),
    ("13 - Duplex, Triplex, Cubing",              77,   85),
    ("14 - Binomial Expansions",                  86,  100),
    ("15 - Derivatives",                         101,  107),
    ("16 - Conversions",                         108,  117),
    ("17 - Fractions_Divisibility",              118,  122),
    ("18 - Answers",                             123,  134),
    ("19 - Glossary",                            135,  139),
    ("20 - About the Author",                    140,  141),
    ("21 - Suggested Reading",                   142,  142),
    ("22 - Rivershore Books",                    143,  143),
]


def split_pdf(input_path: str, chapters: list[tuple]) -> None:
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    reader = PdfReader(input_path)
    total = len(reader.pages)
    print(f"Loaded '{input_path}'  ({total} pages)\n")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for name, start, end in chapters:
        end = min(end, total)
        output_path = os.path.join(OUTPUT_DIR, f"{name}.pdf")

        writer = PdfWriter()
        for page_num in range(start - 1, end):      # convert to 0-indexed
            writer.add_page(reader.pages[page_num])

        with open(output_path, "wb") as f:
            writer.write(f)

        print(f"  ✓  {name}.pdf  (pages {start}–{end}, {end - start + 1} pages)")

    print(f"\nAll {len(chapters)} chapters saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    split_pdf(INPUT_FILE, CHAPTERS)
