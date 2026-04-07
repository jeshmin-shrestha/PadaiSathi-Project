"""
PadaiSathi — summarizer.py (v3 — AI Summarization Engine)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Primary  : PadaiSathi fine-tuned model (GPU accelerated)
"""
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
KAGGLE_API_URL = os.getenv("KAGGLE_API_URL", "")

# PadaiSathi AI Engine keys — automatically rotates if one hits rate limit
_PADAISATHI_AI_KEYS = [
    os.getenv("PADAISATHI_AI_ENGINE_1", ""),
    os.getenv("PADAISATHI_AI_ENGINE_2", ""),
    os.getenv("PADAISATHI_AI_ENGINE_3", ""),
    os.getenv("PADAISATHI_AI_ENGINE_4", ""),
    os.getenv("PADAISATHI_AI_ENGINE_5", ""),
]
_PADAISATHI_AI_KEYS = [k for k in _PADAISATHI_AI_KEYS if k]  # remove empty ones
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

        print("[Summarizer] Calling Primary AI Engine...")
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
                print(f"[Summarizer] Primary AI Engine ✅ formal={len(formal)} creative={len(creative)}")
                return {
                    "formal_summary": formal,
                    "genz_summary":   creative,
                    "video_script":   video,
                }
            print(f"[Summarizer] Primary AI Engine empty response: {str(data)[:200]}")
            return None
        print(f"[Summarizer] Primary AI Engine error: {response.status_code}")
        return None
    except Exception as e:
        print(f"[Summarizer] Primary AI Engine exception: {e}")
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
        r"#\s*(?:🎨|✨)?\s*(?:PadaiSathi Breakdown|PadaiSathi|Creative|Fun|Breakdown)[^\n]*\n(.*?)(?=#\s*(?:🎬|📘|🎨|Video Script)|Video Script[:\s]|$)",
        raw, re.DOTALL | re.IGNORECASE
    )
    video_match = re.search(
        r"(?:#\s*(?:🎬)?\s*)?Video Script[:\s]\s*(.*?)$",
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

# ── PadaiSathi AI Engine fallback ─────────────────────────────────────────────
def _cloud_ai_summarize(text: str) -> dict | None:
    if not _PADAISATHI_AI_KEYS:
        print("[Summarizer] No PadaiSathi AI Engine keys found — skipping")
        return None
    from groq import Groq
    for i, key in enumerate(_PADAISATHI_AI_KEYS):
        try:
            print(f"[Summarizer] Trying PadaiSathi AI Engine {i+1}/{len(_PADAISATHI_AI_KEYS)}...")
            client = Groq(api_key=key)
            prompt = f"""You are PadaiSathi, a fun and smart AI study assistant.
Summarize the following lecture notes in EXACTLY this format with these EXACT headers:

PART 1 — FORMAL SUMMARY
[Write a comprehensive bullet-point summary covering the ENTIRE lecture from start to finish.
   - Use "• " before each bullet point
   - Cover every major topic, concept, definition, and process mentioned in the lecture in order
   - Be thorough — do not skip sections
   - Use formal academic language
   - Do NOT add any facts or examples not present in the lecture notes]

PART 2 — PADAISATHI BREAKDOWN
[Write a fun creative breakdown with:
   - A relatable analogy based on the actual lecture topic (do NOT force unrelated brands like Netflix or Spotify — only use them if they genuinely relate to the topic)
   - Step-by-step numbered levels with emojis based on the lecture content
   - Easy way to remember section based on actual concepts from the lecture
   - Final Big Idea summarizing the lecture]

Video Script:
[Write ONLY 5-6 casual spoken sentences — no bullet points, no headers, just natural speech.but summarize the text in the best way possible
   Base it strictly on what is in the lecture notes — do NOT invent facts or examples not in the text.
   MUST open with one of: "Hey besties!", "Okay real talk...", "Here's the tea!", "Sup scholars!", "Alright listen up!", "No cap this topic is wild —"
   MUST end with one of: "Now go ace that exam!", "That's the tea fam!", "You got this bestie!", "Go slay that paper!", "Stay curious, stay winning!"]

Lecture Notes:
{text[:6000]}"""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000,
                temperature=0.7,
            )
            raw = response.choices[0].message.content
            print(f"[Summarizer] PadaiSathi AI Engine response: {len(raw)} chars")

            formal_m   = re.search(r"PART\s*1[^:\n]*[:\-—][^\n]*\n(.*?)(?=PART\s*2|$)", raw, re.DOTALL | re.IGNORECASE)
            creative_m = re.search(r"PART\s*2[^:\n]*[:\-—][^\n]*\n(.*?)(?=Video Script:|$)", raw, re.DOTALL | re.IGNORECASE)
            video_m    = re.search(r"Video Script:\s*(.*?)$", raw, re.DOTALL | re.IGNORECASE)

            formal   = formal_m.group(1).strip()   if formal_m   else raw[:600]
            creative = creative_m.group(1).strip() if creative_m else raw
            video    = video_m.group(1).strip()    if video_m    else creative[:250]

            return {"formal_summary": formal, "genz_summary": creative, "video_script": video}

        except Exception as e:
            print(f"[Summarizer] PadaiSathi AI Engine {i+1} failed: {e}")
            continue

    print("[Summarizer] PadaiSathi AI Engine unavailable")
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

    # 1. Primary AI Engine (fine-tuned PadaiSathi model — FAST!)
    result = _mistral_kaggle_api(text)

    # 2. PadaiSathi AI Engine fallback
    if not result:
        print("[Summarizer] Primary AI failed — trying PadaiSathi AI Engine...")
        result = _cloud_ai_summarize(text)

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