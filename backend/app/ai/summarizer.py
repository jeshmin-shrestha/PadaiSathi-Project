import re
import random
import os
import requests

COLAB_URL = "https://centaurial-pseudoapologetically-dominique.ngrok-free.dev"

GENZ_REPLACEMENTS = [
    (r"\bimportant\b",     "lowkey crucial"),
    (r"\bsignificant\b",   "kinda a big deal"),
    (r"\bdemonstrates?\b", "literally shows"),
    (r"\butilizes?\b",     "uses"),
    (r"\bobtained?\b",     "got"),
    (r"\bconsequently\b",  "so basically"),
    (r"\bfurthermore\b",   "also bestie"),
    (r"\bin conclusion\b", "at the end of the day"),
    (r"\bnevertheless\b",  "still tho"),
    (r"\bmoreover\b",      "on top of that"),
    (r"\bthus\b",          "so yeah"),
    (r"\bhence\b",         "which means"),
    (r"\bsubstantial\b",   "pretty huge"),
    (r"\bcomprehensive\b", "super detailed"),
    (r"\beffectively\b",   "actually works"),
    (r"\bstudents?\b",     "students (that's you bestie)"),
]

GENZ_OPENERS = [
    "okay so no cap — ",
    "bestie, here's the tea: ",
    "not gonna lie, ",
    "lowkey, ",
    "it's giving academia: ",
]

GENZ_CLOSERS = [
    "\n\nfr tho, you should def review this before the exam.",
    "\n\nno cap this is the most important stuff.",
    "\n\nperiodt. now go slay that assignment.",
    "\n\nthat's a wrap, you got the whole thing.",
]


def inject_genz_style(text: str) -> str:
    for pattern, replacement in GENZ_REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]

    if sentences:
        opener = random.choice(GENZ_OPENERS)
        sentences[0] = opener + sentences[0][0].lower() + sentences[0][1:]

    body = " ".join(sentences)
    body += random.choice(GENZ_CLOSERS)
    return body


def summarize(text: str, genz_style: bool = True) -> dict:
    text = text[:3000]

    response = requests.post(
        f"{COLAB_URL}/summarize",
        json={"text": text},
        timeout=120
    )

    if response.status_code != 200:
        raise RuntimeError(f"Colab API error: {response.text}")

    formal = response.json()["summary"]
    genz = inject_genz_style(formal) if genz_style else formal

    return {
        "formal_summary": formal,
        "genz_summary":   genz,
        "word_count":     len(text.split()),
    }