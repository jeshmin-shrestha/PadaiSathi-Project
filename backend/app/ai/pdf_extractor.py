"""
PadaiSathi AI — PDF Text Extractor
Place at:  backend/app/ai/pdf_extractor.py

Tries PyMuPDF first (better quality), falls back to your existing
PyPDF2-based extractor if PyMuPDF isn't installed.
"""

import os
import re


def extract_text_from_pdf(filepath: str) -> str:
    """
    Extract and clean text from a PDF.
    Returns cleaned string ready for BART summarization.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"PDF not found: {filepath}")

    raw = _try_pymupdf(filepath) or _try_pypdf2(filepath)

    if not raw or not raw.strip():
        raise ValueError(
            "Could not extract text from this PDF. "
            "It may be a scanned image — OCR not supported yet."
        )

    return _clean(raw)


def _try_pymupdf(filepath: str) -> str:
    """Best quality extractor. pip install pymupdf"""
    try:
        import fitz
        parts = []
        with fitz.open(filepath) as doc:
            for page in doc:
                parts.append(page.get_text("text"))
        text = "\n".join(parts)
        if text.strip():
            print(f"[PDFExtractor] PyMuPDF: {len(text)} chars")
            return text
    except ImportError:
        pass
    except Exception as e:
        print(f"[PDFExtractor] PyMuPDF error: {e}")
    return ""


def _try_pypdf2(filepath: str) -> str:
    """Fallback — uses your existing PyPDF2 install."""
    try:
        import PyPDF2
        text = ""
        with open(filepath, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += (page.extract_text() or "") + "\n"
        if text.strip():
            print(f"[PDFExtractor] PyPDF2: {len(text)} chars")
            return text
    except ImportError:
        pass
    except Exception as e:
        print(f"[PDFExtractor] PyPDF2 error: {e}")
    return ""


def _clean(text: str) -> str:
    """Remove noise from extracted PDF text."""
    # Normalise unicode punctuation
    for old, new in [('\u2013', '-'), ('\u2014', '-'), ('\u2018', "'"),
                     ('\u2019', "'"), ('\u201c', '"'), ('\u201d', '"')]:
        text = text.replace(old, new)

    # Remove lines that are just page numbers
    lines = [ln for ln in text.splitlines() if not re.match(r'^\s*\d+\s*$', ln)]
    text = '\n'.join(lines)

    # Collapse excessive blank lines and spaces
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)

    return text.strip()