from __future__ import annotations

import re
import numpy as np
import torch
import torch.nn.functional as F
from huggingface_hub import hf_hub_download
from transformers import pipeline as hf_pipeline

from app.DTO.Article import Article

MODEL_REPO = "JBLorenzo/distilbert-base-uncased-claim-detection"
MAX_LENGTH = 128

# Module-level singletons — populated once on the first call to detect_claims
_pipeline = None
_temperature: float | None = None


def _load_model() -> None:
    """Download the model and temperature scalar from HuggingFace (runs once)."""
    global _pipeline, _temperature

    device = 0 if torch.cuda.is_available() else -1
    _pipeline = hf_pipeline(
        "text-classification",
        model=MODEL_REPO,
        tokenizer=MODEL_REPO,
        top_k=None,        # return scores for all labels, not just the top one
        truncation=True,
        max_length=MAX_LENGTH,
        device=device,
    )

    temp_path = hf_hub_download(repo_id=MODEL_REPO, filename="temperature.pt")
    meta = torch.load(temp_path, map_location="cpu", weights_only=True)
    _temperature = float(meta["temperature"])


def _split_sentences(article: Article) -> list[str]:
    """Extract sentences from article paragraphs, preserving paragraph structure."""
    sentences = []
    for para in article.paragraphs:
        text = str(para.get("text", "")).strip()
        if not text:
            continue
        parts = re.split(r"(?<=[.!?])\s+", text)
        sentences.extend(s.strip() for s in parts if s.strip())
    return sentences


def _apply_temperature(per_class_scores: list[dict], T: float) -> dict:
    """
    Apply temperature scaling to the pipeline's per-class softmax outputs.

    The pipeline returns softmax probabilities; we recover approximate logits
    via log, divide by T, then re-apply softmax to get calibrated probabilities.

    Args:
        per_class_scores: List of {"label": str, "score": float} dicts from the pipeline.
        T: Temperature scalar (T > 1 softens overconfident predictions).

    Returns:
        {"label": str, "score": float} for the highest-probability class.
    """
    logits = torch.tensor(
        [np.log(max(s["score"], 1e-9)) for s in per_class_scores],
        dtype=torch.float32,
    )
    cal_probs = F.softmax(logits / T, dim=0).numpy()
    best = int(np.argmax(cal_probs))
    return {"label": per_class_scores[best]["label"], "score": float(cal_probs[best])}


def detect_claims(article: Article) -> dict:
    """
    Score each sentence in the article for check-worthiness.

    The model is loaded from HuggingFace on the first call and cached for
    subsequent calls. Temperature scaling is applied to calibrate confidence.

    Returns:
        {
            "sentences": [
                {"text": str, "label": "checkworthy"|"not-checkworthy", "score": float},
                ...
            ]
        }
    """
    global _pipeline, _temperature

    if _pipeline is None:
        _load_model()

    sentences = _split_sentences(article)
    if not sentences:
        return {"sentences": []}

    # Run all sentences through the model in a single batched call
    raw_outputs = _pipeline(sentences)  # list of [{"label": .., "score": ..}, ...]

    results = []
    for sent, per_class_scores in zip(sentences, raw_outputs):
        cal = _apply_temperature(per_class_scores, _temperature)
        results.append({"text": sent, "label": cal["label"], "score": cal["score"]})

    return {"sentences": results}
