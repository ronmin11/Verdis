import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import re

def load_chat_model(model_name="meta-llama/Llama-3.2-1B-Instruct"):

    global model, tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16,
        device_map="auto"
    )


def generate_response(prompt, max_new_tokens=800, temperature=0.8):
    if not model or not tokenizer:
        return (
            "I'm an agricultural assistant. I can help with plant disease questions. "
            "What would you like to know about crop health?"
        )

    conversation = (
        "<|begin_of_text|>"
        "<|start_header_id|>system<|end_header_id|>\n"
        "You are a helpful agricultural assistant. Provide clear, practical advice "
        "about plant diseases and crop health.<|eot_id|>\n"
        "<|start_header_id|>user<|end_header_id|>\n"
        f"{prompt.strip()}<|eot_id|>\n"
        "<|start_header_id|>assistant<|end_header_id|>\n"
    )

    inputs = tokenizer.encode(conversation, return_tensors="pt").to(
        next(model.parameters()).device
    )

    with torch.no_grad():
        outputs = model.generate(
            inputs,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            do_sample=True,
            top_p=0.9,
            top_k=50,
            repetition_penalty=1.1,
            no_repeat_ngram_size=3,
            pad_token_id=tokenizer.eos_token_id,
            eos_token_id=tokenizer.eos_token_id,
            early_stopping=True,
        )

    decoded = tokenizer.decode(outputs[0], skip_special_tokens=False)

    if "<|start_header_id|>assistant<|end_header_id|>" in decoded:
        response = decoded.split("<|start_header_id|>assistant<|end_header_id|>")[-1]
    else:
        response = decoded

    if "<|eot_id|>" in response:
        response = response.split("<|eot_id|>")[0]

    return re.sub(r"<\|.*?\|>", "", response).strip()


# Example use
if __name__ == "__main__":
    load_chat_model()
    question = "How can I prevent fungal diseases in tomato plants?"
    print(generate_response(question))