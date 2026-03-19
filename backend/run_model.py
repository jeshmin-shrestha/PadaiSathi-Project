from transformers import pipeline
import torch

# Load your model from the local folder
model_path = "./app/ai/model"  # adjust if needed
print("Loading model...")

# Use pipeline – it automatically handles tokenizer/model
pipe = pipeline(
    "text2text-generation",
    model=model_path,
    tokenizer=model_path,
    device=0 if torch.cuda.is_available() else -1
)

print("Model loaded. Testing...")

# Test it
test_text = "[SUMMARIZE] The mitochondria are double-membrane-bound organelles found in the cytoplasm of eukaryotic cells. They generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy. Mitochondria contain their own circular DNA and ribosomes, supporting the endosymbiotic theory of their bacterial origin."

result = pipe(test_text, max_length=200, num_beams=4, repetition_penalty=2.5, temperature=0.7)
print("Generated:", result[0]['generated_text'])