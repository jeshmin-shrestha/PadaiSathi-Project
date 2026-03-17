import os
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()

client = InferenceClient(
    model="mistralai/Mistral-7B-Instruct-v0.3",
    token=os.getenv("HF_TOKEN")
)

def query_mistral(prompt: str) -> str:
    response = client.text_generation(
        prompt=prompt,
        max_new_tokens=800,
        temperature=0.7
    )
    return response