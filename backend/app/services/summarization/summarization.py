from app.DTO.Article import Article
from transformers import AutoTokenizer, BartForConditionalGeneration
import torch


MODEL_NAME = "jbull42/bart-xsum-summarization"
MAX_SOURCE_CHARS = 2800
MAX_CHUNKS = 3

_tokenizer = None
_model = None


def _get_model():
    global _tokenizer, _model

    if _tokenizer is None or _model is None:
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        _model = BartForConditionalGeneration.from_pretrained(MODEL_NAME)
        _model.eval()

    return _tokenizer, _model


def _build_chunks(article: Article):
    chunks = []
    current = []
    current_len = 0

    for par in article.paragraphs:
        text = str(par.get("text", "")).strip()
        if not text:
            continue

        extra_len = len(text) + (1 if current else 0)
        if current and current_len + extra_len > MAX_SOURCE_CHARS:
            chunks.append(" ".join(current))
            if len(chunks) >= MAX_CHUNKS:
                return chunks
            current = [text]
            current_len = len(text)
        else:
            current.append(text)
            current_len += extra_len

    if current and len(chunks) < MAX_CHUNKS:
        chunks.append(" ".join(current))

    return chunks


def summarize(article: Article):
    tokenizer, model = _get_model()
    chunks = _build_chunks(article)

    if not chunks:
        return {"summary": ""}

    summaries = []

    with torch.no_grad():
        for chunk in chunks:
            inputs = tokenizer(
                chunk,
                return_tensors="pt",
                truncation=True,
                max_length=1024,
            )

            inputs = {key: value.to(model.device) for key, value in inputs.items()}

            summary_ids = model.generate(
                **inputs,
                max_length=96,
                min_length=20,
                num_beams=4,
                length_penalty=2.0,
                early_stopping=True,
            )

            summaries.append(
                tokenizer.decode(summary_ids[0], skip_special_tokens=True).strip()
            )

    return {"summary": " ".join(filter(None, summaries))}

