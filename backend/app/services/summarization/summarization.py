from transformers import AutoTokenizer, BartForConditionalGeneration
from app.DTO.Article import Article
import torch



def summarize(article: Article):
    tokenizer = AutoTokenizer.from_pretrained('jbull42/bart-xsum-summarization')
    model = BartForConditionalGeneration.from_pretrained("jbull42/bart-xsum-summarization")

    summary = []

    for par in article.paragraphs:
        text = par['text']
        inputs = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=1024
        )

        inputs = {k: v.to(model.device) for k, v in inputs.items()}

        summary_ids = model.generate(
            **inputs,
            max_length=128,        
            num_beams=4,           
            length_penalty=2.0,    
            early_stopping=False
        )

        summ = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

        summary.append(summ)

    summary = " ".join(summary)

    return summary