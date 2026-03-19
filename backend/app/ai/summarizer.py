"""
PadaiSathi — summarizer.py
Dual-model architecture:
  - BART-large-CNN  → formal summaries (pretrained, news summarization)
  - Flan-T5 (yours) → GenZ summaries + quiz + flashcards

No ngrok. No Colab. Models cache locally after first download.
"""

import re
import random
import torch
import os
from transformers import T5ForConditionalGeneration, AutoTokenizer, BartForConditionalGeneration, BartTokenizer

os.environ["HF_TOKEN"] = os.getenv("HF_TOKEN", "")

# ── Model config ──────────────────────────────────────────────────────────────
FLAN_REPO    = "jeshmin/padaisathi-flan-t5"
BART_MODEL   = "facebook/bart-large-cnn"
MAX_INPUT_LEN  = 256
MAX_NEW_TOKENS = 200

_device = "cuda" if torch.cuda.is_available() else "cpu"

# ── Load Flan-T5 (your fine-tuned model) ─────────────────────────────────────
print(f"[Summarizer] Loading your Flan-T5 from {FLAN_REPO}...")
_tokenizer = AutoTokenizer.from_pretrained(FLAN_REPO)
_model     = T5ForConditionalGeneration.from_pretrained(FLAN_REPO).to(_device)
_model.eval()
print(f"[Summarizer] Flan-T5 ready on {_device.upper()}")

# ── Load BART-large-CNN (formal summarization) ────────────────────────────────
print(f"[Summarizer] Loading BART-large-CNN for formal summaries...")
from transformers import BartForConditionalGeneration, BartTokenizer

_bart_tokenizer = BartTokenizer.from_pretrained(BART_MODEL)
_bart_model     = BartForConditionalGeneration.from_pretrained(BART_MODEL).to(_device)
_bart_model.eval()
print("[Summarizer] BART ready!")


# ── Light casual injector for GenZ summary ────────────────────────────────────
LIGHT_REPLACEMENTS = [
    (r"\bfurthermore\b",   "on top of that"),
    (r"\bin conclusion\b", "to wrap it up"),
    (r"\bnevertheless\b",  "still though"),
    (r"\bconsequently\b",  "so"),
    (r"\bmoreover\b",      "also"),
    (r"\bthus\b",          "so"),
    (r"\bhence\b",         "which means"),
    (r"\butilizes?\b",     "uses"),
    (r"\bdemonstrates?\b", "shows"),
    (r"\bsubstantial\b",   "significant"),
    (r"\bcomprehensive\b", "thorough"),
    (r"\bin summary\b",    "basically"),
]

CASUAL_OPENERS = [
    "Here's the breakdown: ",
    "Let's get into it — ",
    "Here's what you need to know: ",
    "Quick rundown: ",
]

def inject_genz_style(text: str) -> str:
    """Light touch — swaps stuffy words, adds ONE casual opener."""
    for pattern, replacement in LIGHT_REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
    if sentences:
        opener = random.choice(CASUAL_OPENERS)
        sentences[0] = opener + sentences[0][0].lower() + sentences[0][1:]
    return " ".join(sentences)


# ── Text chunker ──────────────────────────────────────────────────────────────
def _chunk_text(text: str, chunk_size: int = 800) -> list:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, current = [], ""
    for sentence in sentences:
        if len(current) + len(sentence) < chunk_size:
            current += " " + sentence
        else:
            if current.strip():
                chunks.append(current.strip())
            current = sentence
    if current.strip():
        chunks.append(current.strip())
    return chunks[:8]


# ── Flan-T5 generate (your model) ────────────────────────────────────────────
def _generate(prompt: str) -> str:
    """Run your fine-tuned Flan-T5 model."""
    inputs = _tokenizer(
        prompt,
        return_tensors="pt",
        max_length=MAX_INPUT_LEN,
        truncation=True,
    ).to(_device)

    with torch.no_grad():
        outputs = _model.generate(
            **inputs,
            max_new_tokens=MAX_NEW_TOKENS,
            num_beams=4,
            early_stopping=True,
            repetition_penalty=2.5,
            no_repeat_ngram_size=3,
            length_penalty=1.5,
        )

    return _tokenizer.decode(outputs[0], skip_special_tokens=True)


# ── BART formal summary ───────────────────────────────────────────────────────
def _bart_formal_summary(text: str) -> str:
    """Use BART-large-CNN for clean, formal summarization."""
    chunks = _chunk_text(text, chunk_size=900)
    summaries = []
    for chunk in chunks[:6]:
        try:
            inputs = _bart_tokenizer(
                chunk,
                return_tensors="pt",
                truncation=True,
            ).to(_device)

            with torch.no_grad():
                output = _bart_model.generate(
                    **inputs,
                    max_new_tokens=120,
                    min_length=30,
                    num_beams=4,
                    early_stopping=True,
                )

            summaries.append(
                _bart_tokenizer.decode(output[0], skip_special_tokens=True)
            )
        except Exception as e:
            print(f"[BART] Chunk error: {e}")
            continue
    return " ".join(summaries)


# ── Main public API ───────────────────────────────────────────────────────────
def summarize(text: str, genz_style: bool = True, max_length: int = 60, min_length: int = 20) -> dict:
    """
    Dual-model summarization:
      formal_summary → BART-large-CNN (clean, academic-style)
      genz_summary   → your Flan-T5  (fun, casual, engaging)
    """
    text = text[:12000]

    # ── Formal: BART ──────────────────────────────────────────────────────────
    print("[Summarizer] Generating formal summary with BART...")
    formal = _bart_formal_summary(text)

    # ── GenZ: your Flan-T5 ────────────────────────────────────────────────────
    print("[Summarizer] Generating GenZ summary with your Flan-T5...")
    chunks = _chunk_text(text, chunk_size=800)
    genz_parts = []
    for chunk in chunks[:5]:  # 5 chunks max for speed
        raw = _generate(f"[SUMMARIZE] {chunk}")
        if raw.strip():
            genz_parts.append(raw.strip())

    genz_raw = " ".join(genz_parts)
    genz = inject_genz_style(genz_raw) if genz_style else genz_raw

    return {
        "formal_summary": formal,
        "genz_summary":   genz,
        "word_count":     len(text.split()),
    }


# ── Quiz/Flashcard generation — your Flan-T5 ─────────────────────────────────
def generate_quiz_mcq(text: str) -> str:
    return _generate(f"[QUIZ_MCQ] {text}")

def generate_quiz_tf(text: str) -> str:
    return _generate(f"[QUIZ_TF] {text}")

def generate_quiz_fib(text: str) -> str:
    return _generate(f"[QUIZ_FIB] {text}")

def generate_flashcard(text: str) -> str:
    return _generate(f"[FLASHCARD] {text}")


# ── Self-test ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    sample = """The mitochondria are double-membrane-bound organelles found in eukaryotic cells.
    They generate most of the cell's supply of ATP, used as a source of chemical energy.
    Mitochondria contain their own circular DNA, supporting the endosymbiotic theory."""

    result = summarize(sample)
    print("FORMAL:", result["formal_summary"])
    print()
    print("GENZ:  ", result["genz_summary"])