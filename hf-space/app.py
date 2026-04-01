"""
PadaiSathi — HuggingFace Spaces API
====================================
Drop-in replacement for the Kaggle + ngrok setup.
Exposes /summarize with the EXACT same request/response format
so the backend (summarizer.py) needs zero changes.

Free ZeroGPU on HuggingFace Spaces handles the GPU automatically.
"""

import re
import os
import random
import torch
import spaces
import gradio as gr
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

# ── Config ─────────────────────────────────────────────────────────────────────
HF_TOKEN   = os.getenv("HF_TOKEN", "")
BASE_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"
LORA_REPO  = "jeshmin/padaisathi-mistral-7b"

# ── Load model at startup on CPU ───────────────────────────────────────────────
# (ZeroGPU gives GPU only during @spaces.GPU function calls)
print("⏳ Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, token=HF_TOKEN)
tokenizer.pad_token = tokenizer.eos_token

print("⏳ Loading base Mistral on CPU...")
base = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    token=HF_TOKEN,
    torch_dtype=torch.float16,
    device_map="cpu",
    low_cpu_mem_usage=True,
)

print("⏳ Applying your LoRA adapters...")
model = PeftModel.from_pretrained(base, LORA_REPO, token=HF_TOKEN)
model.eval()
print("✅ Model ready!")

# ── Same prompt as Kaggle notebook ─────────────────────────────────────────────
def build_prompt(lecture_text: str) -> str:
    return (
        "[INST] You are PadaiSathi, a fun and smart AI study assistant. "
        "Summarize the following lecture notes in EXACTLY this format with these EXACT headers:\n\n"
        "PART 1 — FORMAL SUMMARY\n"
        "[Write a formal academic summary with key definitions and concepts]\n\n"
        "PART 2 — PADAISATHI BREAKDOWN\n"
        "[Write a fun creative breakdown with:\n"
        "   - A fun game/party analogy to introduce the topic\n"
        "   - Step-by-step numbered levels with emojis\n"
        "   - Real world examples like Netflix, Spotify, movies, games\n"
        "   - Easy way to remember section\n"
        "   - Final Big Idea]\n\n"
        "Video Script:\n"
        "[Write ONLY 5-6 casual spoken sentences — no bullet points, no headers, just natural speech.\n"
        "   MUST open with one of: \"Hey besties!\", \"Okay real talk...\", \"Here's the tea!\", "
        "\"Sup scholars!\", \"Alright listen up!\", \"No cap this topic is wild —\"\n"
        "   MUST end with one of: \"Now go ace that exam!\", \"That's the tea fam!\", "
        "\"You got this bestie!\", \"Go slay that paper!\", \"Stay curious, stay winning!\"]\n\n"
        f"Lecture Notes:\n{lecture_text.strip()[:4000]} [/INST]"
    )

# ── GPU inference — exact same params as Kaggle notebook ──────────────────────
@spaces.GPU
def generate_summary(lecture_text: str, max_tokens: int = 800) -> str:
    torch.cuda.empty_cache()
    model.to("cuda")

    prompt = build_prompt(lecture_text)
    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=2048,
    ).to("cuda")

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            temperature=0.7,
            top_p=0.9,
            do_sample=True,
            repetition_penalty=1.1,
            pad_token_id=tokenizer.eos_token_id,
        )

    raw = tokenizer.decode(
        outputs[0][inputs["input_ids"].shape[1]:],
        skip_special_tokens=True,
    )
    model.to("cpu")
    torch.cuda.empty_cache()
    return raw

# ── Parser — exact same as Kaggle notebook ─────────────────────────────────────
OPENERS = [
    "Hey besties!", "Okay real talk...", "Here's the tea!",
    "Sup scholars!", "Alright listen up!", "No cap this topic is wild —",
]
CLOSERS = [
    "Now go ace that exam!", "That's the tea fam!", "You got this bestie!",
    "Go slay that paper!", "Stay curious, stay winning!",
]

def _ensure_opener_closer(script: str) -> str:
    script = script.strip()
    if not script:
        return script
    has_opener = any(script.startswith(o) or o.lower() in script[:60].lower() for o in OPENERS)
    if not has_opener:
        script = random.choice(OPENERS) + " " + script
    has_closer = any(script.endswith(c) or c.lower() in script[-80:].lower() for c in CLOSERS)
    if not has_closer:
        if script and script[-1] not in ".!?":
            last = max(script.rfind("."), script.rfind("!"), script.rfind("?"))
            if last > len(script) // 2:
                script = script[:last + 1]
        script = script + " " + random.choice(CLOSERS)
    return script


def parse_output(raw: str) -> dict:
    raw = raw.strip()

    video_match = re.search(r"Video Script:\s*(.*?)$", raw, re.DOTALL | re.IGNORECASE)
    if not video_match:
        video_match = re.search(r"#\s*🎬[^\n]*\n(.*?)$", raw, re.DOTALL | re.IGNORECASE)
    video_script_raw = video_match.group(1).strip() if video_match else ""

    raw_no_video = re.sub(r"Video Script:.*$", "", raw, flags=re.DOTALL | re.IGNORECASE).strip()
    raw_no_video = re.sub(r"#\s*🎬.*$", "", raw_no_video, flags=re.DOTALL | re.IGNORECASE).strip()

    formal_match = re.search(
        r"PART\s*1[^:\n]*[:\-—]\s*(.*?)(?=PART\s*2|$)", raw_no_video, re.DOTALL | re.IGNORECASE
    )
    if not formal_match:
        formal_match = re.search(
            r"#\s*(?:📘|🎓)?\s*(?:Formal|Academic)[^\n]*\n(.*?)(?=#\s*🎨|PART\s*2|$)",
            raw_no_video, re.DOTALL | re.IGNORECASE,
        )

    creative_match = re.search(
        r"PART\s*2[^:\n]*[:\-—]\s*(.*?)$", raw_no_video, re.DOTALL | re.IGNORECASE
    )
    if not creative_match:
        creative_match = re.search(r"#\s*🎨[^\n]*\n(.*?)$", raw_no_video, re.DOTALL | re.IGNORECASE)

    formal   = formal_match.group(1).strip()   if formal_match   else raw_no_video[:600]
    creative = creative_match.group(1).strip() if creative_match else raw_no_video

    creative = re.sub(r"^PADAI?\s*SATHI\s*BREAKDOWN[^\n]*\n?", "", creative, flags=re.IGNORECASE).strip()
    creative = re.sub(r"^CREATIVE\s*UNDERSTANDING[^\n]*\n?",   "", creative, flags=re.IGNORECASE).strip()
    creative = re.sub(r"^[A-Z\s]{10,}\n", "", creative).strip()

    parts = re.split(r"(?i)easy way to remember", creative)
    if len(parts) > 2:
        creative = parts[0] + "**Easy way to remember**" + parts[1]

    formal   = re.sub(r"\s*•\s*", "\n- ", formal).strip()
    creative = re.sub(r"\s*•\s*", "\n- ", creative).strip()
    creative = re.sub(r"\s*[\U0001F300-\U0001F9FF]\s*$", "", creative).strip()

    video_script = re.sub(r"^\s*[\-\*•]\s*", "", video_script_raw, flags=re.MULTILINE)
    video_script = re.sub(r"\s+", " ", video_script).strip()

    if len(video_script) < 40:
        sentences = re.split(r"(?<=[.!?])\s+", creative)
        clean = [s for s in sentences if len(s) > 20 and not s.startswith("#") and not s.startswith("-")]
        video_script = " ".join(clean[:4])

    video_script = _ensure_opener_closer(video_script)

    return {
        "formal_summary": formal,
        "genz_summary":   creative,
        "video_script":   video_script,
    }

# ── FastAPI app — same /summarize endpoint as Kaggle ──────────────────────────
fastapi_app = FastAPI(title="PadaiSathi Mistral API")

@fastapi_app.get("/")
def root():
    return {"status": "PadaiSathi Mistral API running on HuggingFace ZeroGPU 🚀"}

@fastapi_app.get("/health")
def health():
    return {
        "status": "healthy",
        "model":  "jeshmin/padaisathi-mistral-7b",
        "device": "ZeroGPU (HuggingFace Spaces)",
    }

@fastapi_app.post("/summarize")
async def summarize(request: Request):
    try:
        body       = await request.json()
        text       = body.get("text", "")
        max_tokens = body.get("max_tokens", 800)

        print(f"[API] Summarizing {len(text)} chars...")
        raw    = generate_summary(text, max_tokens)
        result = parse_output(raw)
        result["word_count"] = len(text.split())
        result["raw_output"] = raw

        print(f"[API] Done! formal={len(result['formal_summary'])} "
              f"creative={len(result['genz_summary'])} "
              f"video={len(result['video_script'])} chars")
        return JSONResponse({"success": True, **result})

    except Exception as e:
        print(f"[API] Error: {e}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

# ── Gradio UI (required for ZeroGPU spaces) ───────────────────────────────────
def gradio_summarize(text: str) -> dict:
    raw    = generate_summary(text, 800)
    result = parse_output(raw)
    result["word_count"] = len(text.split())
    return result

demo = gr.Interface(
    fn=gradio_summarize,
    inputs=gr.Textbox(lines=10, placeholder="Paste your lecture notes here..."),
    outputs=gr.JSON(),
    title="PadaiSathi Mistral API",
    description="Fine-tuned Mistral 7B for lecture summarization",
)

# Mount FastAPI so /summarize works, Gradio UI at /
app = gr.mount_gradio_app(fastapi_app, demo, path="/")
