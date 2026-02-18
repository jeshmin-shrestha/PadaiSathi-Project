"""
PadaiSathi AI — Flashcard & Quiz Generator
Place at: backend/app/ai/quiz_generator.py

Uses YOUR existing BART summarizer engine + local NLP.
Zero external API calls. Works fully offline.

Pipeline:
  1. Split the document text into topic chunks
  2. Run each chunk through BART to get a focused summary sentence
  3. Use keyword extraction to identify key terms per chunk
  4. Build cloze (fill-in-blank) questions from BART output
  5. Generate tricky distractors from OTHER chunks (same topic space)
"""

import re
import random
from typing import List, Tuple


# ─── Keyword extractor ────────────────────────────────────────────────────────

# Words that are never useful as quiz answers
STOPWORDS = {
    "the","a","an","is","are","was","were","be","been","being","have","has","had",
    "do","does","did","will","would","could","should","may","might","shall","can",
    "of","in","on","at","to","for","with","by","from","up","about","into","through",
    "that","this","these","those","it","its","they","them","their","he","she","we",
    "you","i","me","my","your","our","his","her","also","which","when","where","how",
    "what","who","as","or","and","but","if","then","than","so","not","no","nor",
    "each","all","both","such","more","most","other","same","only","just","very",
    "used","using","use","uses","used","make","makes","made","give","gives","given",
    "known","called","said","found","show","shows","shown","include","includes",
}

def extract_keywords(text: str, top_n: int = 8) -> List[str]:
    """
    Pull out the most meaningful nouns/terms from a piece of text.
    Prefers multi-word phrases, then single important words.
    """
    text_clean = re.sub(r'[^\w\s\-]', ' ', text)
    words = text_clean.split()

    # Score single words by length and non-stopword status
    scored = {}
    for w in words:
        w_low = w.lower().strip("-")
        if w_low not in STOPWORDS and len(w_low) > 3 and w_low.isalpha():
            # Capitalised words get a small bonus (likely proper nouns / terms)
            bonus = 1.3 if w[0].isupper() else 1.0
            scored[w_low] = scored.get(w_low, 0) + bonus

    # Also try to find two-word phrases
    phrases = []
    for i in range(len(words) - 1):
        w1, w2 = words[i].lower().strip("-"), words[i+1].lower().strip("-")
        if (w1 not in STOPWORDS and w2 not in STOPWORDS
                and len(w1) > 3 and len(w2) > 3
                and w1.isalpha() and w2.isalpha()):
            phrases.append(f"{w1} {w2}")

    # Pick top single-word keywords
    sorted_words = sorted(scored.items(), key=lambda x: -x[1])
    keywords = [w for w, _ in sorted_words[:top_n]]

    # Mix in the most repeated phrase if it appears 2+ times
    phrase_counts = {}
    for p in phrases:
        phrase_counts[p] = phrase_counts.get(p, 0) + 1
    top_phrases = [p for p, c in sorted(phrase_counts.items(), key=lambda x: -x[1]) if c >= 2]
    keywords = top_phrases[:2] + keywords
    return keywords[:top_n]


# ─── Text chunker ─────────────────────────────────────────────────────────────

def chunk_text(text: str, max_chars: int = 800) -> List[str]:
    """
    Split a long text into topic-sized chunks for BART.
    Tries to split on paragraph/sentence boundaries.
    """
    # Clean emoji and GenZ bullets first
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)
    text = re.sub(r'^[^\w]+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\s{2,}', ' ', text).strip()

    # Split on double newline first (paragraphs)
    paragraphs = [p.strip() for p in re.split(r'\n{2,}', text) if len(p.strip()) > 80]

    if not paragraphs:
        # Fall back to splitting on sentences
        paragraphs = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 60]

    # Merge very short paragraphs, split very long ones
    chunks = []
    current = ""
    for para in paragraphs:
        if len(current) + len(para) < max_chars:
            current += " " + para
        else:
            if current.strip():
                chunks.append(current.strip())
            current = para

    if current.strip():
        chunks.append(current.strip())

    return chunks[:10]  # Cap at 10 chunks to keep generation fast


# ─── BART-based sentence generator ───────────────────────────────────────────

def bart_focus_sentence(chunk: str) -> str:
    """
    Run a chunk through your existing BART model to get ONE crisp
    factual sentence summarising the key point of that chunk.
    Reuses the same model already loaded by summarizer.py.
    """
    try:
        # Import your existing summarizer — BART is already loaded/cached there
        from .summarizer import summarize

        result = summarize(chunk, max_length=60, min_length=20, genz_style=False)
        sentence = result["formal_summary"].strip()

        # Make sure it ends with a period
        if sentence and not sentence[-1] in ".!?":
            sentence += "."
        return sentence

    except Exception as e:
        print(f"[QuizGen] BART sentence error: {e}")
        # Fall back to first sentence of chunk
        sentences = re.split(r'(?<=[.!?])\s+', chunk)
        return sentences[0].strip() if sentences else chunk[:120].strip()


# ─── Distractor generator ─────────────────────────────────────────────────────

def generate_distractors(correct_answer: str,
                          all_keywords: List[str],
                          num: int = 3) -> List[str]:
    """
    Build tricky wrong-answer options (distractors) that are:
    - From the same topic space (other keywords from the document)
    - Similar in form to the correct answer
    - Not the same as the correct answer
    """
    correct_low = correct_answer.lower().strip()
    pool = [k for k in all_keywords if k.lower().strip() != correct_low]
    random.shuffle(pool)

    distractors = []

    # First pass: prefer keywords of similar length (looks more plausible)
    target_len = len(correct_answer)
    close = [k for k in pool if abs(len(k) - target_len) <= 4]
    distractors.extend(close[:num])

    # Second pass: fill remaining from anything in pool
    if len(distractors) < num:
        remaining = [k for k in pool if k not in distractors]
        distractors.extend(remaining[:num - len(distractors)])

    # Third pass: if still not enough, use generic but context-aware fillers
    generic_fillers = [
        "none of the above",
        "all of the above",
        "cannot be determined from the text",
        "both A and B",
    ]
    idx = 0
    while len(distractors) < num:
        distractors.append(generic_fillers[idx % len(generic_fillers)])
        idx += 1

    return [d.capitalize() for d in distractors[:num]]


# ─── Question builders ────────────────────────────────────────────────────────

def build_flashcard(bart_sentence: str, keyword: str) -> dict:
    """
    Turn a BART-generated sentence into a flashcard.
    The question asks ABOUT the keyword; the answer IS the BART sentence.
    """
    kw_cap = keyword.capitalize()

    templates = [
        f"What does the document say about '{kw_cap}'?",
        f"How is '{kw_cap}' described in this topic?",
        f"What is the significance of '{kw_cap}' according to the text?",
        f"Explain '{kw_cap}' based on the content.",
        f"What role does '{kw_cap}' play in this subject?",
    ]

    return {
        "question": random.choice(templates),
        "answer": bart_sentence
    }


def build_quiz_question(bart_sentence: str,
                         keyword: str,
                         all_keywords: List[str]) -> dict:
    """
    Build a cloze-style MCQ:
      - Remove the keyword from the BART sentence → becomes the question stem
      - The keyword is the correct answer
      - 3 other keywords from the same document = distractors
    """
    # Replace the keyword in the sentence with a blank
    pattern = re.compile(re.escape(keyword), re.IGNORECASE)
    stem = pattern.sub("__________", bart_sentence, count=1)

    # If keyword didn't appear in sentence, use a "which of these" format
    if "__________" not in stem:
        stem = f"According to the text, which of the following best relates to: '{bart_sentence[:80]}...'"

    distractors = generate_distractors(keyword, all_keywords, num=3)

    # Shuffle correct answer into a random position
    correct_pos = random.randint(0, 3)
    options = distractors[:3]
    options.insert(correct_pos, keyword.capitalize())

    return {
        "question": stem,
        "options": options,
        "correct": correct_pos
    }


# ─── Main pipeline ─────────────────────────────────────────────────────────────

def generate_flashcards_and_quiz(summary_text: str,
                                  n_flashcards: int = 5,
                                  n_quiz: int = 5) -> dict:
    """
    Full pipeline:
      raw summary text → BART sentences → keywords → flashcards + quiz MCQs

    Everything runs locally using your existing BART model.
    No external API calls.
    """
    print("[QuizGen] Starting local pipeline...")

    # 1. Split into topic chunks
    chunks = chunk_text(summary_text)
    print(f"[QuizGen] Got {len(chunks)} chunks from text")

    if not chunks:
        return _emergency_fallback(summary_text)

    # 2. Extract all keywords from the full text (global pool for distractors)
    all_keywords = extract_keywords(summary_text, top_n=30)
    print(f"[QuizGen] Global keywords: {all_keywords[:10]}")

    # 3. For each chunk: run BART + extract local keywords
    chunk_results = []
    for i, chunk in enumerate(chunks):
        print(f"[QuizGen] Processing chunk {i+1}/{len(chunks)}...")
        bart_sentence = bart_focus_sentence(chunk)
        local_keywords = extract_keywords(chunk, top_n=5)
        chunk_results.append({
            "sentence": bart_sentence,
            "keywords": local_keywords,
            "chunk": chunk
        })

    # 4. Build flashcards — one per chunk, using top local keyword
    flashcards = []
    for cr in chunk_results[:n_flashcards]:
        kw = cr["keywords"][0] if cr["keywords"] else "this concept"
        card = build_flashcard(cr["sentence"], kw)
        flashcards.append(card)

    # 5. Build quiz questions — use different keywords per chunk
    quiz = []
    used_keywords = set()

    for cr in chunk_results:
        if len(quiz) >= n_quiz:
            break
        for kw in cr["keywords"]:
            if kw not in used_keywords and len(kw) > 3:
                q = build_quiz_question(cr["sentence"], kw, all_keywords)
                quiz.append(q)
                used_keywords.add(kw)
                break

    # Fill up if we didn't get enough
    if len(flashcards) < n_flashcards or len(quiz) < n_quiz:
        print(f"[QuizGen] Only got {len(flashcards)} cards, {len(quiz)} questions — padding...")
        for cr in chunk_results:
            if len(flashcards) < n_flashcards:
                kw = cr["keywords"][1] if len(cr["keywords"]) > 1 else cr["keywords"][0] if cr["keywords"] else "topic"
                flashcards.append(build_flashcard(cr["sentence"], kw))
            if len(quiz) < n_quiz:
                for kw in cr["keywords"][1:]:
                    if kw not in used_keywords:
                        q = build_quiz_question(cr["sentence"], kw, all_keywords)
                        quiz.append(q)
                        used_keywords.add(kw)
                        break

    print(f"[QuizGen] ✅ Done: {len(flashcards)} flashcards, {len(quiz)} quiz questions")

    return {
        "flashcards": flashcards[:n_flashcards],
        "quiz": quiz[:n_quiz]
    }


# ─── Emergency fallback ───────────────────────────────────────────────────────

def _emergency_fallback(text: str) -> dict:
    """Last resort if text is too short/broken to process."""
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 30][:3]
    keywords = extract_keywords(text, top_n=12)

    flashcards = [
        {"question": f"What does the text say about '{kw}'?", "answer": sentences[i % len(sentences)] if sentences else text[:200]}
        for i, kw in enumerate(keywords[:5])
    ]

    quiz = []
    for i, kw in enumerate(keywords[:5]):
        distractors = generate_distractors(kw, keywords, num=3)
        pos = random.randint(0, 3)
        opts = distractors
        opts.insert(pos, kw.capitalize())
        quiz.append({
            "question": f"Which term from the document refers to: '{sentences[i % len(sentences)][:60]}...'?" if sentences else f"Which is a key concept from this document?",
            "options": opts,
            "correct": pos
        })

    return {"flashcards": flashcards, "quiz": quiz}