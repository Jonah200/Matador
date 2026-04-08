import torch
import json
from huggingface_hub import hf_hub_download
import re
# import emoji 
from transformers import BertForSequenceClassification, BertTokenizer

def preprocess_text(text):
    """Preprocess the input text to match training conditions."""
    text = re.sub(r'u/\w+', '[USER]', text)
    text = re.sub(r'r/\w+', '[SUBREDDIT]', text)
    text = re.sub(r'http[s]?://\S+', '[URL]', text)
    # text = emoji.demojize(text, delimiters=(" ", " "))
    text = text.lower()
    return text

def load_model_and_resources():
    """Load the model, tokenizer, emotion labels, and thresholds from Hugging Face."""
    repo_id = "logasanjeev/emotions-analyzer-bert"
    
    try:
        model = BertForSequenceClassification.from_pretrained(repo_id)
        tokenizer = BertTokenizer.from_pretrained(repo_id)
    except Exception as e:
        raise RuntimeError(f"Error loading model/tokenizer: {str(e)}")

    try:
        thresholds_file = "optimized_thresholds.json" # hf_hub_download(repo_id=repo_id, filename="optimized_thresholds.json")
        with open(thresholds_file, "r") as f:
            thresholds_data = json.load(f)
        if not (isinstance(thresholds_data, dict) and "emotion_labels" in thresholds_data and "thresholds" in thresholds_data):
            raise ValueError("Unexpected format in optimized_thresholds.json. Expected a dictionary with keys 'emotion_labels' and 'thresholds'.")
        emotion_labels = thresholds_data["emotion_labels"]
        thresholds = thresholds_data["thresholds"]
    except Exception as e:
        raise RuntimeError(f"Error loading thresholds: {str(e)}")

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)
    model.eval()

    return model, tokenizer, emotion_labels, thresholds, device

MODEL, TOKENIZER, EMOTION_LABELS, THRESHOLDS, DEVICE = None, None, None, None, None

def predict_emotions(text):
    """Predict emotions for the given text using the GoEmotions BERT model.
    
    Args:
        text (str): The input text to analyze.
    
    Returns:
        tuple: (predictions, processed_text)
            - predictions (str): Formatted string of predicted emotions and their confidence scores.
            - processed_text (str): The preprocessed input text.
    """
    global MODEL, TOKENIZER, EMOTION_LABELS, THRESHOLDS, DEVICE
    
    if MODEL is None:
        MODEL, TOKENIZER, EMOTION_LABELS, THRESHOLDS, DEVICE = load_model_and_resources()

    processed_text = preprocess_text(text)
    
    encodings = TOKENIZER(
        processed_text,
        padding='max_length',
        truncation=True,
        max_length=128,
        return_tensors='pt'
    )
    
    input_ids = encodings['input_ids'].to(DEVICE)
    attention_mask = encodings['attention_mask'].to(DEVICE)
    
    with torch.no_grad():
        outputs = MODEL(input_ids, attention_mask=attention_mask)
        logits = torch.sigmoid(outputs.logits).cpu().numpy()[0]
    
    predictions = []
    for i, (logit, thresh) in enumerate(zip(logits, THRESHOLDS)):
        if logit >= thresh:
            predictions.append((EMOTION_LABELS[i], round(logit, 4)))
    
    predictions.sort(key=lambda x: x[1], reverse=True)
    
    # result = "\n".join([f"{emotion}: {confidence:.4f}" for emotion, confidence in predictions]) or "No emotions predicted."
    result = {emotion: round(float(confidence), 4) for emotion, confidence in predictions} or "No emotions predicted"
    return result, processed_text

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Predict emotions using the GoEmotions BERT model.")
    parser.add_argument("text", type=str, help="The input text to analyze for emotions.")
    args = parser.parse_args()
    
    result, processed = predict_emotions(args.text)
    print(f"Input: {args.text}")
    print(f"Processed: {processed}")
    print("Predicted Emotions:")
    print(result)