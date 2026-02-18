"""
PadaiSathi AI — Summarizer
Place this at:  backend/app/ai/summarizer.py

Uses facebook/bart-large-cnn as the base model.
First run downloads ~1.6GB from HuggingFace (runs once, then cached).
"""

import re
import random
import os

# Global model cache — loaded once on first call
_tokenizer = None
_model     = None

CHECKPOINT_DIR = os.path.join(os.path.dirname(__file__), "checkpoints", "bart-genz")
BASE_MODEL     = "facebook/bart-large-cnn"

# ─── GenZ post-processor ─────────────────────────────────────────────────────

GENZ_REPLACEMENTS = [
    (r"\bimportant\b",        "lowkey crucial"),
    (r"\bsignificant\b",      "kinda a big deal"),
    (r"\bdemonstrates?\b",    "literally shows"),
    (r"\butilizes?\b",        "uses"),
    (r"\bobtained?\b",        "got"),
    (r"\bconsequently\b",     "so basically"),
    (r"\bfurthermore\b",      "also bestie"),
    (r"\bin conclusion\b",    "at the end of the day"),
    (r"\bnevertheless\b",     "still tho"),
    (r"\bmoreover\b",         "on top of that"),
    (r"\bthus\b",             "so yeah"),
    (r"\bhence\b",            "which means"),
    (r"\bsubstantial\b",      "pretty huge"),
    (r"\bcomprehensive\b",    "super detailed"),
    (r"\beffectively\b",      "actually works"),
    (r"\bstudents?\b",        "students (that's you bestie)"),
]

GENZ_OPENERS  = [
    "okay so no cap — ",
    "bestie, here's the tea: ",
    "not gonna lie, ",
    "lowkey, ",
    "it's giving academia: ",
]

GENZ_CLOSERS  = [
    "\n\n✨ fr tho, you should def review this before the exam.",
    "\n\n💅 no cap this is the most important stuff — go off bestie.",
    "\n\n🔥 periodt. now go slay that assignment.",
    "\n\n🎯 that's a wrap! you literally understood the whole thing.",
]

EMOJI_BULLETS = ["🔑", "📌", "💡", "⚡", "🧠", "🎯", "✅"]


def inject_genz_style(text: str) -> str:
    """Convert a formal summary into GenZ-flavoured text."""
    for pattern, replacement in GENZ_REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
    bulleted  = []
    for i, sentence in enumerate(sentences):
        emoji = EMOJI_BULLETS[i % len(EMOJI_BULLETS)]
        bulleted.append(f"{emoji} {sentence}")

    if bulleted:
        opener    = random.choice(GENZ_OPENERS)
        first_raw = re.sub(r'^[^\w]+', '', bulleted[0]).strip()
        bulleted[0] = f"{EMOJI_BULLETS[0]} {opener}{first_raw[0].lower()}{first_raw[1:]}"

    body = "\n".join(bulleted)
    body += random.choice(GENZ_CLOSERS)
    return body


# ─── Model loading ────────────────────────────────────────────────────────────

def _load_model():
    global _tokenizer, _model
    from transformers import BartTokenizer, BartForConditionalGeneration
    import torch

    model_path = CHECKPOINT_DIR if os.path.isdir(CHECKPOINT_DIR) else BASE_MODEL
    print(f"[Summarizer] Loading model from: {model_path}")

    _tokenizer = BartTokenizer.from_pretrained(model_path)
    _model     = BartForConditionalGeneration.from_pretrained(model_path)
    _model.eval()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    _model.to(device)
    print(f"[Summarizer] Model loaded on {device} ✅")
    return device


# ─── Main inference function ──────────────────────────────────────────────────

def summarize(text: str, max_length: int = 200, min_length: int = 60, genz_style: bool = True) -> dict:
    """
    Summarize text with BART. Returns dict with:
        formal_summary  — plain academic summary
        genz_summary    — slang-infused version
        word_count      — input length for logging
    """
    global _tokenizer, _model
    import torch

    if _tokenizer is None or _model is None:
        _load_model()

    device = next(_model.parameters()).device

    inputs = _tokenizer(
        text, return_tensors="pt", max_length=1024, truncation=True
    ).to(device)

    with torch.no_grad():
        ids = _model.generate(
            inputs["input_ids"],
            attention_mask=inputs["attention_mask"],
            max_length=max_length,
            min_length=min_length,
            length_penalty=2.0,
            num_beams=4,
            early_stopping=True,
            no_repeat_ngram_size=3,
        )

    formal = _tokenizer.decode(ids[0], skip_special_tokens=True)
    genz   = inject_genz_style(formal) if genz_style else formal

    return {
        "formal_summary": formal,
        "genz_summary":   genz,
        "word_count":     len(text.split()),
    }


# ─── Fine-tuning function (run once to specialise the model) ─────────────────

FINETUNE_PAIRS = [
    (
        "Photosynthesis is the process by which plants use sunlight, water and "
        "carbon dioxide to produce oxygen and energy in the form of glucose.",
        "okay so no cap — 🌿 plants literally eat sunlight lol. "
        "They take CO2 + water, add sun vibes and make glucose. Oxygen is just the byproduct bestie ✨",
    ),
    (
        "The French Revolution was a period of radical political and social "
        "transformation in France that began with the Estates General of 1789 "
        "and ended in November 1799 with Napoleon's coup d'état.",
        "lowkey France said 'we're done' with the monarchy bestie 😤. "
        "1789 to 1799, pure chaos — they toppled the king then Napoleon said 'my turn'. iconic.",
    ),
    (
        "Machine learning is a subset of artificial intelligence that provides "
        "systems the ability to automatically learn and improve from experience "
        "without being explicitly programmed.",
        "bestie here's the tea: 🧠 ML = AI that teaches itself. "
        "Feed it data, it figures things out. lowkey slay ngl.",
    ),
    (
        "The water cycle describes how water evaporates, rises into the atmosphere, "
        "cools and condenses into rain or snow in clouds, and falls as precipitation.",
        "water going on a world tour fr 💧 — evaporates up, chills in clouds, rains back down. rinse and repeat.",
    ),
    (
        "Supply and demand is an economic model of price determination. The unit price "
        "will vary until the quantity demanded equals quantity supplied.",
        "prices move until buyers and sellers agree 📌. Too much supply = price drops. "
        "Too much demand = price goes brrr. that's economics fr.",
    ),
]


def fine_tune(epochs: int = 3, lr: float = 3e-5):
    """
    Fine-tune BART on GenZ-style pairs.
    Saves checkpoint to backend/app/ai/checkpoints/bart-genz/
    Run this ONCE:  python -c "from app.ai.summarizer import fine_tune; fine_tune()"
    """
    from transformers import BartTokenizer, BartForConditionalGeneration
    from torch.optim import AdamW
    import torch
    import random as rnd

    print("[FineTune] Starting fine-tuning…")
    tokenizer = BartTokenizer.from_pretrained(BASE_MODEL)
    model     = BartForConditionalGeneration.from_pretrained(BASE_MODEL)
    device    = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device).train()

    optimizer = AdamW(model.parameters(), lr=lr)

    for epoch in range(epochs):
        total_loss = 0.0
        rnd.shuffle(FINETUNE_PAIRS)
        for src, tgt in FINETUNE_PAIRS:
            enc = tokenizer(src, return_tensors="pt", max_length=512, truncation=True, padding=True).to(device)
            with tokenizer.as_target_tokenizer():
                dec = tokenizer(tgt, return_tensors="pt", max_length=150, truncation=True, padding=True).to(device)

            labels = dec["input_ids"].clone()
            labels[labels == tokenizer.pad_token_id] = -100

            loss = model(**enc, labels=labels).loss
            loss.backward()
            optimizer.step()
            optimizer.zero_grad()
            total_loss += loss.item()

        print(f"  Epoch {epoch+1}/{epochs}  loss={total_loss/len(FINETUNE_PAIRS):.4f}")

    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    model.save_pretrained(CHECKPOINT_DIR)
    tokenizer.save_pretrained(CHECKPOINT_DIR)
    print(f"[FineTune] ✅ Checkpoint saved to {CHECKPOINT_DIR}")


# ─── Self-test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    sample = (
        "Mitosis is a type of cell division producing two identical daughter cells. "
        "It consists of four phases: prophase, metaphase, anaphase and telophase, "
        "followed by cytokinesis which divides the cytoplasm. It is used for growth and repair."
    )
    result = summarize(sample)
    print("FORMAL:", result["formal_summary"])
    print("\nGENZ:", result["genz_summary"])