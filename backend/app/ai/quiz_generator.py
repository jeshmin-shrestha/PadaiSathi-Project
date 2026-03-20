"""
PadaiSathi AI — Flashcard & Quiz Generator
backend/app/ai/quiz_generator.py

Uses the fine-tuned Flan-T5 model (via summarizer._generate) for
all flashcard and MCQ generation instead of the old rule-based pipeline.
"""

import re
import random
from typing import List

# Import the model's generate function and chunker from summarizer
# _generate() runs your Flan-T5 with whatever prefix you pass
from .summarizer import _generate, _chunk_text


# ─── Parse flashcard output ───────────────────────────────────────────────────

def _parse_flashcard(raw: str, fallback_chunk: str) -> dict:
    """
    Try to extract Q/A from model output.
    Expected formats the model may produce:
      "Q: ... A: ..."
      "Question: ... Answer: ..."
      or just a sentence we use as the answer with a generated question
    """
    raw = raw.strip()

    # Try "Q: ... A: ..." pattern
    m = re.search(r'[Qq](?:uestion)?[:\-]\s*(.+?)\s*[Aa](?:nswer)?[:\-]\s*(.+)', raw, re.DOTALL)
    if m:
        return {
            "question": m.group(1).strip(),
            "answer":   m.group(2).strip()
        }

    # Try splitting on newline if two lines
    lines = [l.strip() for l in raw.split('\n') if l.strip()]
    if len(lines) >= 2:
        return {
            "question": lines[0],
            "answer":   lines[1]
        }

    # Fallback — use raw as answer, generate a generic question from it
    answer = raw if raw else fallback_chunk[:150]
    # Pull the first noun-like word as a topic
    words = [w for w in answer.split() if len(w) > 4 and w.isalpha()]
    topic = words[0].capitalize() if words else "this concept"
    return {
        "question": f"What does the text say about '{topic}'?",
        "answer":   answer
    }


# ─── Parse MCQ output ─────────────────────────────────────────────────────────

def _parse_mcq(raw: str, fallback_chunk: str, all_keywords: List[str]) -> dict:
    """
    Try to extract MCQ from model output.
    Expected formats:
      "Question: ... A) ... B) ... C) ... D) ... Answer: A"
      or any variation with options and an answer marker
    """
    raw = raw.strip()

    # Extract question stem
    q_match = re.search(r'(?:[Qq]uestion[:\-]?\s*)?(.+?)(?:[Aa]\)|\(a\)|1\.)', raw, re.DOTALL)
    question = q_match.group(1).strip() if q_match else raw[:100]

    # Extract options A/B/C/D
    options = re.findall(r'[A-Da-d][\)\.]\s*(.+?)(?=[A-Da-d][\)\.]|[Aa]nswer|$)', raw, re.DOTALL)
    options = [o.strip() for o in options if o.strip()]

    # Extract correct answer letter
    ans_match = re.search(r'[Aa]nswer[:\-]?\s*([A-Da-d])', raw)
    correct_letter = ans_match.group(1).upper() if ans_match else 'A'
    correct_idx = ord(correct_letter) - ord('A')

    # If we got 4 clean options, use them
    if len(options) >= 4:
        correct_idx = min(correct_idx, len(options) - 1)
        return {
            "question": question,
            "options":  options[:4],
            "correct":  correct_idx
        }

    # Fallback — build from keywords
    return _keyword_mcq_fallback(fallback_chunk, all_keywords)


def _keyword_mcq_fallback(chunk: str, all_keywords: List[str]) -> dict:
    """Last-resort MCQ built from keyword extraction when model output can't be parsed."""
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', chunk) if len(s.strip()) > 40]
    sentence  = sentences[0] if sentences else chunk[:150]

    keywords = _extract_keywords(chunk, top_n=8)
    if not keywords:
        keywords = all_keywords[:8]

    keyword = keywords[0] if keywords else "this concept"
    pattern = re.compile(re.escape(keyword), re.IGNORECASE)
    stem    = pattern.sub("__________", sentence, count=1)
    if "__________" not in stem:
        stem = f"Which term best fits: '{sentence[:80]}...'"

    distractors = _generate_distractors(keyword, all_keywords, num=3)
    correct_pos = random.randint(0, 3)
    options = distractors[:3]
    options.insert(correct_pos, keyword.capitalize())

    return {
        "question": stem,
        "options":  options,
        "correct":  correct_pos
    }


# ─── Helpers (kept lean — only used for fallback) ────────────────────────────

STOPWORDS = {
    "the","a","an","is","are","was","were","be","been","being","have","has","had",
    "do","does","did","will","would","could","should","may","might","shall","can",
    "of","in","on","at","to","for","with","by","from","up","about","into","through",
    "that","this","these","those","it","its","they","them","their","he","she","we",
    "you","i","me","my","your","our","his","her","also","which","when","where","how",
    "what","who","as","or","and","but","if","then","than","so","not","no","nor",
    "each","all","both","such","more","most","other","same","only","just","very",
}

def _extract_keywords(text: str, top_n: int = 8) -> List[str]:
    text_clean = re.sub(r'[^\w\s]', ' ', text)
    words = text_clean.split()
    scored = {}
    for w in words:
        w_low = w.lower()
        if w_low not in STOPWORDS and len(w_low) > 3 and w_low.isalpha():
            bonus = 1.3 if w[0].isupper() else 1.0
            scored[w_low] = scored.get(w_low, 0) + bonus
    return [w for w, _ in sorted(scored.items(), key=lambda x: -x[1])[:top_n]]

def _generate_distractors(correct: str, pool: List[str], num: int = 3) -> List[str]:
    pool = [k for k in pool if k.lower() != correct.lower()]
    random.shuffle(pool)
    distractors = pool[:num]
    fillers = ["None of the above", "All of the above", "Cannot be determined"]
    while len(distractors) < num:
        distractors.append(fillers[len(distractors) % len(fillers)])
    return [d.capitalize() for d in distractors[:num]]


# ─── Main pipeline ────────────────────────────────────────────────────────────

def generate_flashcards_and_quiz(text: str, n_flashcards: int = 8, n_quiz: int = 8) -> dict:
    """
    Uses your fine-tuned Flan-T5 to generate flashcards and MCQs.
    Falls back to keyword extraction only if the model output can't be parsed.
    """
    print("[QuizGen] Starting Flan-T5 pipeline...")

    # Chunk the text — smaller chunks = more focused model output
    chunks = _chunk_text(text, chunk_size=400)
    if not chunks:
        chunks = [text[:400]]
    print(f"[QuizGen] {len(chunks)} chunks")

    # Global keyword pool for fallback distractors
    all_keywords = _extract_keywords(text, top_n=30)

    flashcards = []
    quiz       = []

    for i, chunk in enumerate(chunks):
        if len(flashcards) >= n_flashcards and len(quiz) >= n_quiz:
            break

        print(f"[QuizGen] Chunk {i+1}/{len(chunks)}...")

        # ── Flashcard ──────────────────────────────────────────────────────
        if len(flashcards) < n_flashcards:
            try:
                raw_fc = _generate(f"[FLASHCARD] {chunk}")
                print(f"[QuizGen] Flashcard raw: {raw_fc[:80]}")
                fc = _parse_flashcard(raw_fc, chunk)
                flashcards.append(fc)
            except Exception as e:
                print(f"[QuizGen] Flashcard error on chunk {i}: {e}")
                # Fallback: simple sentence-based card
                sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', chunk) if len(s.strip()) > 40]
                if sentences:
                    kws = _extract_keywords(chunk, top_n=3)
                    topic = kws[0].capitalize() if kws else "this"
                    flashcards.append({
                        "question": f"What does the text say about '{topic}'?",
                        "answer":   sentences[0]
                    })

        # ── MCQ ────────────────────────────────────────────────────────────
        if len(quiz) < n_quiz:
            try:
                raw_mcq = _generate(f"[QUIZ_MCQ] {chunk}")
                print(f"[QuizGen] MCQ raw: {raw_mcq[:80]}")
                q = _parse_mcq(raw_mcq, chunk, all_keywords)
                quiz.append(q)
            except Exception as e:
                print(f"[QuizGen] MCQ error on chunk {i}: {e}")
                quiz.append(_keyword_mcq_fallback(chunk, all_keywords))

    # Pad to requested count by recycling chunks if needed
    chunk_cycle = chunks * 4
    extra_idx   = 0
    while len(flashcards) < n_flashcards and extra_idx < len(chunk_cycle):
        chunk = chunk_cycle[extra_idx]
        extra_idx += 1
        try:
            raw_fc = _generate(f"[FLASHCARD] {chunk}")
            flashcards.append(_parse_flashcard(raw_fc, chunk))
        except Exception:
            pass

    while len(quiz) < n_quiz and extra_idx < len(chunk_cycle):
        chunk = chunk_cycle[extra_idx]
        extra_idx += 1
        try:
            raw_mcq = _generate(f"[QUIZ_MCQ] {chunk}")
            quiz.append(_parse_mcq(raw_mcq, chunk, all_keywords))
        except Exception:
            quiz.append(_keyword_mcq_fallback(chunk, all_keywords))

    print(f"[QuizGen] Done: {len(flashcards)} flashcards, {len(quiz)} quiz Qs")
    return {
        "flashcards": flashcards[:n_flashcards],
        "quiz":       quiz[:n_quiz],
    }