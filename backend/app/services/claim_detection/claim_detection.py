from transformers import XLMRobertaTokenizer, XLMRobertaForSequenceClassification
import torch
from app.DTO.Article import Article

def detect_claims(article: Article):

    text = "".join(para["text"] for para in article.paragraphs)
    sentence_array = text.split('.')
    
    tokenizer = XLMRobertaTokenizer.from_pretrained("FacebookAI/xlm-roberta-base")
    model = XLMRobertaForSequenceClassification.from_pretrained("SophieTr/xlm-roberta-base-claim-detection-clef21-24")

    inputs = tokenizer(
        sentence_array, 
        return_tensors="pt", 
        padding=True, 
        truncation=True
    )

    with torch.no_grad():
        logits = model(**inputs).logits
        
    predictions = [logits[i].argmax().item() for i,t in enumerate(logits)]
    label_map = {0:'not claim', 1:'claim'}
    output = {sentence: label_map[prediction] for sentence, prediction in zip(sentence_array, predictions)}
    
    return output