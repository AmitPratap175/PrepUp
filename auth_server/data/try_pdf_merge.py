import os
from PyPDF2 import PdfMerger
from PIL import Image
import img2pdf
import tempfile

def merge_files_to_pdf(file_list, output_pdf):
    merger = PdfMerger()
    temp_files = []

    try:
        for file in file_list:
            ext = os.path.splitext(file)[1].lower()

            # Case 1: PDF
            if ext == ".pdf":
                merger.append(file)

            # Case 2: Image
            elif ext in [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"]:
                temp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
                temp_files.append(temp_pdf.name)

                with open(temp_pdf.name, "wb") as f:
                    f.write(img2pdf.convert(file))

                merger.append(temp_pdf.name)

            else:
                print(f"Skipping unsupported file: {file}")

        merger.write(output_pdf)

    finally:
        merger.close()
        for f in temp_files:
            os.remove(f)

    print(f"✅ Merged PDF saved as: {output_pdf}")

if __name__ == "__main__":
    files_in_order = [
        # "/home/dspratap/Downloads/PrepUp/auth_server/data/bank passbook_.pdf",
        # "/home/dspratap/Downloads/PrepUp/auth_server/data/aadhar ananya.pdf",
        # "/home/dspratap/Downloads/PrepUp/auth_server/data/WhatsApp Image 2025-12-22 at 9.22.59 PM.jpeg"
        "/home/dspratap/Downloads/PrepUp/Adobe Scan Dec 22, 2025.pdf",
        "/home/dspratap/Downloads/PrepUp/Adobe Scan Mar 13, 2025.pdf",
        "/home/dspratap/Downloads/PrepUp/my adhar .pdf"
    ]

    merge_files_to_pdf(files_in_order, "final_krishna.pdf")
