from transformers import AutoTokenizer, AutoModelForCausalLM, TextIteratorStreamer
from huggingface_hub import login, snapshot_download
import torch
from threading import Thread
import os

# Login to Hugging Face
login(token="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")

# Set device to CPU
device = torch.device("cpu")
torch_dtype = torch.float32  # Use float32 for CPU

# Load model and tokenizer
model_name = "Qwen/Qwen3-0.6B"
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Download model files to cache
model_path = snapshot_download(repo_id=model_name, local_files_only=False)

# Configure device map for CPU offloading
device_map = "auto"
if not torch.cuda.is_available():
    device_map = {"": "cpu"}

# Load model with appropriate device mapping
model = AutoModelForCausalLM.from_pretrained(
    model_path,
    torch_dtype=torch_dtype,
    device_map=device_map,
    offload_folder="offload",
    offload_state_dict=True,
    low_cpu_mem_usage=True
)

def generate_streaming_response(prompt, max_new_tokens=500, temperature=0.7):

    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    

    streamer = TextIteratorStreamer(tokenizer, skip_prompt=True)
    

    generation_kwargs = dict(
        **inputs,
        streamer=streamer,
        max_new_tokens=max_new_tokens,
        temperature=temperature,
        do_sample=True,
        top_p=0.9,
    )
    
    thread = Thread(target=model.generate, kwargs=generation_kwargs)
    thread.start()
    
    # Stream the response
    for new_text in streamer:
        yield new_text

# Example usage
if __name__ == "__main__":
    disease = "Early blight (tomato)"
    weather = "28°C, humidity 84%, light rainfall"
    
    prompt = f"""
    You are a crop health assistant.
    Predicted disease: {disease}
    Weather: {weather}
    Give a description of the disease, explain likely causes, and recommend safe and effective treatment steps.
    """
    
    # Stream the response
    print("Assistant: ", end="", flush=True)
    for chunk in generate_streaming_response(prompt):
        print(chunk, end="", flush=True)
    print()