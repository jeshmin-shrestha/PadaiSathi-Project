# backend/text_extractor.py
import PyPDF2
from typing import Optional

def extract_text_from_pdf(filepath: str) -> Optional[str]:
    """Extract text from PDF file"""
    try:
        text = ""
        with open(filepath, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text() + "\n"
        return text.strip() if text else None
    except Exception as e:
        print(f"Error extracting text: {e}")
        return None