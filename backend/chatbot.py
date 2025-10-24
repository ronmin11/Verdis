from transformers import AutoTokenizer, AutoModelForCausalLM, TextIteratorStreamer
from huggingface_hub import login
import torch
from threading import Thread

# Login to Hugging Face
login(token="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")

# Load model and tokenizer
model_name = "meta-llama/Meta-Llama-3.1-8B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,
    device_map="auto"
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