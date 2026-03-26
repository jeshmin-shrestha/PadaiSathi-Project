"""
PadaiSathi — summarizer.py (v3 — Local Mistral + Gemini fallback)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Primary  : Local fine-tuned Mistral 7B (fast settings for CPU)
Fallback : Gemini API
"""
KAGGLE_API_URL = "https://centaurial-pseudoapologetically-dominique.ngrok-free.dev/summarize"
import re
import os
import time
import torch
import requests
from transformers import (
    T5ForConditionalGeneration,
    AutoModelForCausalLM,
    AutoTokenizer,
)

# ── Config ────────────────────────────────────────────────────────────────────
HF_TOKEN       = os.getenv("HF_TOKEN", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MISTRAL_REPO   = "jeshmin/padaisathi-mistral-7b"
FLAN_REPO      = "jeshmin/padaisathi-flan-t5"
BASE_MODEL     = "mistralai/Mistral-7B-Instruct-v0.2"

_device = "cuda" if torch.cuda.is_available() else "cpu"

# ── Load Flan-T5 (quiz + flashcards only) ─────────────────────────────────────
print("[Summarizer] Loading Flan-T5 for quiz/flashcards...")
_flan_tokenizer = AutoTokenizer.from_pretrained(FLAN_REPO, token=HF_TOKEN)
_flan_model     = T5ForConditionalGeneration.from_pretrained(
    FLAN_REPO, token=HF_TOKEN
).to(_device)
_flan_model.eval()
# Keep backward compat — quiz_generator.py uses _tokenizer and _model
_tokenizer = _flan_tokenizer
_model     = _flan_model
print(f"[Summarizer] Flan-T5 ready on {_device.upper()}")

# ── Local Mistral globals ──────────────────────────────────────────────────────
_mistral_model     = None
_mistral_tokenizer = None

def _mistral_kaggle_api(lecture_text: str) -> dict | None:
    if not KAGGLE_API_URL:
        return None
    try:
        # Smart text extraction based on length
        total_len = len(lecture_text)
        
        if total_len <= 3000:
            # Short PDF — send everything
            text_to_send = lecture_text
            print(f"[Summarizer] Short PDF — sending full text ({total_len} chars)")
            
        elif total_len <= 8000:
            # Medium PDF — first 1500 + last 1500
            text_to_send = (
                lecture_text[:1500] +
                "\n\n[...middle section...]\n\n" +
                lecture_text[-1500:]
            )
            print(f"[Summarizer] Medium PDF — sending first+last ({len(text_to_send)} chars)")
            
        else:
            # Long PDF — extract key sentences evenly from whole doc
            sentences = re.split(r'(?<=[.!?])\s+', lecture_text)
            total_sentences = len(sentences)
            # Pick ~40 sentences evenly spread across the whole doc
            step = max(1, total_sentences // 40)
            selected = sentences[::step][:40]
            text_to_send = " ".join(selected)
            print(f"[Summarizer] Long PDF — extracted {len(selected)} sentences ({len(text_to_send)} chars)")

        print("[Summarizer] Calling Kaggle GPU API...")
        response = requests.post(
            KAGGLE_API_URL,
            json={"text": text_to_send, "max_tokens": 800},
            timeout=180,
        )
        if response.status_code == 200:
            data = response.json()
            formal   = data.get("formal_summary", "")
            creative = data.get("genz_summary", "")
            video    = data.get("video_script", "")
            if formal or creative:
                print(f"[Summarizer] Kaggle ✅ formal={len(formal)} creative={len(creative)}")
                return {
                    "formal_summary": formal,
                    "genz_summary":   creative,
                    "video_script":   video,
                }
            print(f"[Summarizer] Kaggle empty: {str(data)[:200]}")
            return None
        print(f"[Summarizer] Kaggle error: {response.status_code}")
        return None
    except Exception as e:
        print(f"[Summarizer] Kaggle API exception: {e}")
        return None
    
def _load_mistral_local() -> bool:
    global _mistral_model, _mistral_tokenizer
    if _mistral_model is not None:
        return True
    try:
        from peft import PeftModel

        print("[Summarizer] Loading Mistral tokenizer...")
        _mistral_tokenizer = AutoTokenizer.from_pretrained(
            BASE_MODEL, token=HF_TOKEN
        )
        _mistral_tokenizer.pad_token = _mistral_tokenizer.eos_token

        print("[Summarizer] Loading base Mistral from cache (~30s)...")
        base = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL,
            token=HF_TOKEN,
            device_map="cpu",
            dtype=torch.float16,
            low_cpu_mem_usage=True,
        )

        print("[Summarizer] Applying your LoRA adapters...")
        _mistral_model = PeftModel.from_pretrained(
            base, MISTRAL_REPO, token=HF_TOKEN
        )
        _mistral_model.eval()
        print("[Summarizer] ✅ Your fine-tuned Mistral is ready!")
        return True

    except Exception as e:
        print(f"[Summarizer] Mistral load failed: {e}")
        return False


def _mistral_local(lecture_text: str) -> dict | None:
    print("[Summarizer] _mistral_local called!")
    if not _load_mistral_local():
        return None
    try:
        # Take first 4000 chars — covers most lecture slides
        # Your PDF extractor already gets the key content first
        text_input = lecture_text.strip()[:4000]

        prompt = (
            "[INST] You are PadaiSathi, a fun AI study assistant. "
            "Summarize this lecture with:\n"
            "1. A formal academic summary\n"
            "2. A fun creative breakdown with emojis and analogies\n"
            "3. A short video script\n\n"
            f"Lecture:\n{text_input} [/INST]"
        )

        print("[Summarizer] Tokenizing input...")
        inputs = _mistral_tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=1024,
        )

        print("[Summarizer] Generating (~5-8 mins on CPU)...")
        with torch.no_grad():
            outputs = _mistral_local_model.generate(
                **inputs,
                max_new_tokens=500,
                do_sample=False,
                repetition_penalty=1.1,
                pad_token_id=_mistral_local_tokenizer.eos_token_id,
            )

        raw = _mistral_local_tokenizer.decode(
            outputs[0][inputs["input_ids"].shape[1]:],
            skip_special_tokens=True,
        )
        print(f"[Summarizer] ✅ Local Mistral output: {len(raw)} chars")
        return _parse_output(raw)

    except Exception as e:
        print(f"[Summarizer] Local Mistral error: {e}")
        return None
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


# ── Flan-T5 generate (quiz/flashcards only) ───────────────────────────────────
def _generate(prompt: str) -> str:
    inputs = _flan_tokenizer(
        prompt, return_tensors="pt", max_length=256, truncation=True
    ).to(_device)
    with torch.no_grad():
        outputs = _flan_model.generate(
            **inputs,
            max_new_tokens=200,
            num_beams=4,
            early_stopping=True,
            repetition_penalty=2.5,
            no_repeat_ngram_size=3,
            length_penalty=1.5,
        )
    return _flan_tokenizer.decode(outputs[0], skip_special_tokens=True)


# ── Output parser ─────────────────────────────────────────────────────────────
def _parse_output(raw: str) -> dict:
    raw = raw.strip()

    formal_match = re.search(
        r"#\s*(?:📘|🎓|📚)?\s*(?:Formal Summary|Academic Overview|Formal|Academic)\s*(.*?)(?=#\s*(?:📘|🎨|🎓|📚|🎬)|PART\s*2|$)",
        raw, re.DOTALL | re.IGNORECASE
    )
    creative_match = re.search(
        r"#\s*(?:🎨|✨)?\s*(?:PadaiSathi Breakdown|PadaiSathi|Creative|Fun|Breakdown)[^\n]*\n(.*?)(?=#\s*(?:🎬|📘|🎨|Video Script)|Video Script:|$)",
        raw, re.DOTALL | re.IGNORECASE
    )
    video_match = re.search(
        r"#\s*(?:🎬)?\s*Video Script\s*(.*?)$",
        raw, re.DOTALL | re.IGNORECASE
    )

    if not formal_match:
        formal_match = re.search(
            r"PART\s*1[^:]*:\s*(.*?)(?=PART\s*2|$)",
            raw, re.DOTALL | re.IGNORECASE
        )
    if not creative_match:
        creative_match = re.search(
            r"PART\s*2[^:]*:\s*(.*?)$",
            raw, re.DOTALL | re.IGNORECASE
        )

    formal       = formal_match.group(1).strip()   if formal_match   else raw[:600]
    creative     = creative_match.group(1).strip() if creative_match else raw
    video_script = video_match.group(1).strip()    if video_match    else creative[:250]

    for p in ["[Auto-generated from creative summary above]",
              "[See formal summary above]",
              "[See creative summary above]"]:
        video_script = video_script.replace(p, "").strip()

    if not video_script:
        video_script = creative[:250]

    return {
        "formal_summary": formal,
        "genz_summary":   creative,
        "video_script":   video_script,
    }

# ── Gemini fallback ───────────────────────────────────────────────────────────
def _gemini_summarize(text: str) -> dict | None:
    if not GEMINI_API_KEY:
        print("[Summarizer] No GEMINI_API_KEY — skipping Gemini")
        return None
    try:
        print("[Summarizer] Trying Gemini API...")
        from google import genai

        client = genai.Client(api_key=GEMINI_API_KEY)
        prompt = f"""You are PadaiSathi, a fun AI study assistant.
Summarize this lecture in exactly 3 sections:

# 📘 Formal Summary
[Academic formal summary]

# 🎨 PadaiSathi Breakdown
[Fun creative breakdown with emojis, game analogies, step-by-step]

# 🎬 Video Script
[Short punchy 5-8 sentence video script]

Lecture:
{text[:6000]}"""

        # retry up to 3 times for rate limit
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt,
                )
                raw = response.text
                print(f"[Summarizer] Gemini response: {len(raw)} chars")
                return _parse_output(raw)
            except Exception as e:
                if "429" in str(e) and attempt < 2:
                    print(f"[Summarizer] Gemini rate limit — waiting 5s ({attempt+1}/3)")
                    time.sleep(5)
                else:
                    raise e

    except Exception as e:
        print(f"[Summarizer] Gemini error: {e}")
        return None


# ── Simple fallback ───────────────────────────────────────────────────────────
def _simple_fallback(text: str) -> str:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return " ".join(sentences[:8])


# ── Main public API ───────────────────────────────────────────────────────────
def summarize(text: str, genz_style: bool = True,
              max_length: int = 60, min_length: int = 20) -> dict:
    text = text[:15000]
    print(f"[Summarizer] Input: {len(text)} chars")

    # 1. Kaggle GPU API (your fine-tuned Mistral — FAST!)
    result = _mistral_kaggle_api(text)

    # 2. Gemini fallback
    if not result:
        print("[Summarizer] Kaggle API failed — trying Gemini...")
        result = _gemini_summarize(text)

    # 3. Last resort
    if not result:
        formal = _simple_fallback(text)
        result = {
            "formal_summary": formal,
            "genz_summary":   formal,
            "video_script":   formal[:250],
        }

    result["word_count"] = len(text.split())
    print(f"[Summarizer] Done ✅ formal={len(result['formal_summary'])} chars")
    return result


# ── Quiz/Flashcard — Flan-T5 (unchanged) ──────────────────────────────────────
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
    sample = """The mitochondria are double-membrane-bound organelles found
    in eukaryotic cells. They generate most of the cell's supply of ATP,
    used as a source of chemical energy. Mitochondria contain their own
    circular DNA, supporting the endosymbiotic theory."""

    result = summarize(sample)
    print("\n📘 FORMAL:")
    print(result["formal_summary"])
    print("\n🎨 CREATIVE:")
    print(result["genz_summary"])
    print("\n🎬 VIDEO SCRIPT:")
    print(result["video_script"])