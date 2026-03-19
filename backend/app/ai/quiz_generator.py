"""
PadaiSathi AI — Flashcard & Quiz Generator
backend/app/ai/quiz_generator.py
"""

import re
import random
from typing import List

# ─── Stopwords ────────────────────────────────────────────────────────────────

STOPWORDS = {
    "the","a","an","is","are","was","were","be","been","being","have","has","had",
    "do","does","did","will","would","could","should","may","might","shall","can",
    "of","in","on","at","to","for","with","by","from","up","about","into","through",
    "that","this","these","those","it","its","they","them","their","he","she","we",
    "you","i","me","my","your","our","his","her","also","which","when","where","how",
    "what","who","as","or","and","but","if","then","than","so","not","no","nor",
    "each","all","both","such","more","most","other","same","only","just","very",
    "used","using","use","uses","make","makes","made","give","gives","given",
    "known","called","said","found","show","shows","shown","include","includes",
    # GenZ words — never become quiz keywords
    "bestie","okay","lore","like","rent","free","vibes","wild","unhinged","lowkey",
    "periodt","bussin","sigma","based","slay","giving","living","sending","learning",
    "gotta","gonna","literally","actually","basically","really","pretty","quite",
}


# ─── Keyword extractor ────────────────────────────────────────────────────────

def extract_keywords(text: str, top_n: int = 8) -> List[str]:
    text_clean = re.sub(r'[^\w\s\-]', ' ', text)
    words = text_clean.split()

    scored = {}
    for w in words:
        w_low = w.lower().strip("-")
        if w_low not in STOPWORDS and len(w_low) > 3 and w_low.isalpha():
            bonus = 1.3 if w[0].isupper() else 1.0
            scored[w_low] = scored.get(w_low, 0) + bonus

    phrases = []
    for i in range(len(words) - 1):
        w1, w2 = words[i].lower().strip("-"), words[i+1].lower().strip("-")
        if (w1 not in STOPWORDS and w2 not in STOPWORDS
                and len(w1) > 3 and len(w2) > 3
                and w1.isalpha() and w2.isalpha()):
            phrases.append(f"{w1} {w2}")

    sorted_words = sorted(scored.items(), key=lambda x: -x[1])
    keywords = [w for w, _ in sorted_words[:top_n]]

    phrase_counts = {}
    for p in phrases:
        phrase_counts[p] = phrase_counts.get(p, 0) + 1
    top_phrases = [p for p, c in sorted(phrase_counts.items(), key=lambda x: -x[1]) if c >= 2]
    keywords = top_phrases[:2] + keywords
    return keywords[:top_n]


# ─── Text chunker ─────────────────────────────────────────────────────────────

def chunk_text(text: str, max_chars: int = 800) -> List[str]:
    # Remove non-ASCII and normalize whitespace
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)
    text = re.sub(r'\s{2,}', ' ', text).strip()

    # Try paragraph split first
    paragraphs = [p.strip() for p in re.split(r'\n{2,}', text) if len(p.strip()) > 80]

    if not paragraphs:
        # Fall back to sentence split
        paragraphs = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 60]

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

    return chunks[:10]


# ─── Model-based sentence generator ──────────────────────────────────────────

def bart_focus_sentence(chunk: str) -> str:
    """Pick the most informative sentence directly from the chunk. No model call."""
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', chunk) if len(s.strip()) > 40]
    if not sentences:
        return chunk[:150].strip() + "."
    
    # Score by information density — longer words = more specific/informative
    scored = []
    for sent in sentences:
        words = sent.lower().split()
        score = sum(len(w) for w in words if len(w) > 4) / max(len(words), 1)
        scored.append((score, sent))
    
    best = max(scored, key=lambda x: x[0])[1]
    if best[-1] not in '.!?':
        best += '.'
    return best

# ─── Distractor generator ─────────────────────────────────────────────────────

def generate_distractors(correct_answer: str, all_keywords: List[str], num: int = 3) -> List[str]:
    correct_low = correct_answer.lower().strip()
    pool = [k for k in all_keywords if k.lower().strip() != correct_low]
    random.shuffle(pool)

    distractors = []
    target_len = len(correct_answer)
    close = [k for k in pool if abs(len(k) - target_len) <= 4]
    distractors.extend(close[:num])

    if len(distractors) < num:
        remaining = [k for k in pool if k not in distractors]
        distractors.extend(remaining[:num - len(distractors)])

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

def build_flashcard(sentence: str, keyword: str) -> dict:
    kw_cap = keyword.capitalize()
    templates = [
        f"What is '{kw_cap}'?",
        f"Define '{kw_cap}' based on the text.",
        f"What does the text say about '{kw_cap}'?",
        f"Explain '{kw_cap}' in this context.",
        f"What role does '{kw_cap}' play here?",
    ]
    # Keep answer to max 2 sentences — no walls of text
    parts = re.split(r'(?<=[.!?])\s+', sentence)
    short_answer = ' '.join(parts[:2])
    return {
        "question": random.choice(templates),
        "answer": short_answer
    }

def build_quiz_question(sentence: str, keyword: str, all_keywords: List[str]) -> dict:
    pattern = re.compile(re.escape(keyword), re.IGNORECASE)
    stem = pattern.sub("__________", sentence, count=1)

    if "__________" not in stem:
        stem = f"According to the text, which of the following best relates to: '{sentence[:80]}...'"

    distractors = generate_distractors(keyword, all_keywords, num=3)

    correct_pos = random.randint(0, 3)
    options = distractors[:3]
    options.insert(correct_pos, keyword.capitalize())

    return {
        "question": stem,
        "options": options,
        "correct": correct_pos
    }


# ─── Main pipeline ────────────────────────────────────────────────────────────

def generate_flashcards_and_quiz(text: str, n_flashcards: int = 8, n_quiz: int = 8) -> dict:
    """
    Full pipeline: raw PDF text → chunks → model sentences → keywords → flashcards + quiz
    Always pass the original extracted PDF text, not the summary.
    """
    print("[QuizGen] Starting local pipeline...")

    # 1. Split into chunks
    chunks = chunk_text(text,max_chars=400)
    print(f"[QuizGen] Got {len(chunks)} chunks from text")

    if not chunks:
        return _emergency_fallback(text)

    # 2. Global keyword pool for distractors
    all_keywords = extract_keywords(text, top_n=30)
    print(f"[QuizGen] Global keywords: {all_keywords[:10]}")

    # 3. Process each chunk
    chunk_results = []
    for i, chunk in enumerate(chunks):
        print(f"[QuizGen] Processing chunk {i+1}/{len(chunks)}...")
        sentence = bart_focus_sentence(chunk)
        local_keywords = extract_keywords(chunk, top_n=5)
        chunk_results.append({
            "sentence": sentence,
            "keywords": local_keywords,
        })

    # 4. Build flashcards — one per chunk
    flashcards = []
    for cr in chunk_results:
        if len(flashcards) >= n_flashcards:
            break
        kw = cr["keywords"][0] if cr["keywords"] else "this concept"
        flashcards.append(build_flashcard(cr["sentence"], kw))

    # 5. Build quiz questions
    quiz = []
    used_keywords = set()

    for cr in chunk_results:
        if len(quiz) >= n_quiz:
            break
        for kw in cr["keywords"]:
            if kw not in used_keywords and len(kw) > 3:
                quiz.append(build_quiz_question(cr["sentence"], kw, all_keywords))
                used_keywords.add(kw)
                break

    # 6. Pad if needed using secondary keywords
    for cr in chunk_results:
        if len(flashcards) >= n_flashcards and len(quiz) >= n_quiz:
            break
        kws = cr["keywords"]
        if len(flashcards) < n_flashcards and len(kws) > 1:
            flashcards.append(build_flashcard(cr["sentence"], kws[1]))
        if len(quiz) < n_quiz:
            for kw in kws[1:]:
                if kw not in used_keywords:
                    quiz.append(build_quiz_question(cr["sentence"], kw, all_keywords))
                    used_keywords.add(kw)
                    break

    print(f"[QuizGen] Done: {len(flashcards)} flashcards, {len(quiz)} quiz questions")

    return {
        "flashcards": flashcards[:n_flashcards],
        "quiz": quiz[:n_quiz]
    }


# ─── Emergency fallback ───────────────────────────────────────────────────────

def _emergency_fallback(text: str) -> dict:
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 30][:3]
    keywords = extract_keywords(text, top_n=12)

    flashcards = [
        {
            "question": f"What does the text say about '{kw}'?",
            "answer": sentences[i % len(sentences)] if sentences else text[:200]
        }
        for i, kw in enumerate(keywords[:5])
    ]

    quiz = []
    for i, kw in enumerate(keywords[:5]):
        distractors = generate_distractors(kw, keywords, num=3)
        pos = random.randint(0, 3)
        opts = distractors[:]
        opts.insert(pos, kw.capitalize())
        quiz.append({
            "question": f"Which term refers to: '{sentences[i % len(sentences)][:60]}...'?" if sentences else "Which is a key concept?",
            "options": opts,
            "correct": pos
        })

    return {"flashcards": flashcards, "quiz": quiz}