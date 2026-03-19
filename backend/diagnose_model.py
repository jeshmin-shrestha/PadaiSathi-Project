from transformers import T5TokenizerFast, T5ForConditionalGeneration
import torch
import os

model_path = os.path.join("app", "ai", "model")
print(f"Loading from: {model_path}")

tokenizer = T5TokenizerFast.from_pretrained(model_path)
model = T5ForConditionalGeneration.from_pretrained(model_path)
print(f"Tokenizer vocab size: {tokenizer.vocab_size}")
print(f"Model vocab size: {model.config.vocab_size}")

device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
prompt = "[SUMMARIZE] The mitochondria are organelles."
inputs = tokenizer(prompt, return_tensors="pt", max_length=256, truncation=True).to(device)
outputs = model.generate(**inputs, max_new_tokens=20)
print("Generated tokens:", outputs[0].tolist())
print("Decoded:", tokenizer.decode(outputs[0], skip_special_tokens=True))