from app.services.core import AnalysisService, register_service
from app.util.types import ServiceScope
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import re

import spacy

@register_service
class ClaimDetection(AnalysisService):
    name = "claim_detection"
    scope = ServiceScope.ARTICLE

    def run(self, text):

        nlp = spacy.load("en_core_web_sm")

        MODEL_PATH = "ml/artifacts/claim_model/"

        tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
        model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)

        doc = nlp(text)
        sentences = [sent.text.strip() for sent in doc.sents if sent.text.strip()]

        results = []

        for sentence in sentences:
            inputs = tokenizer(
                sentence,
                return_tensors="pt",
                truncation=True,
                max_length=128
            )

            with torch.no_grad():
                outputs = model(**inputs)
                logits = outputs.logits
                probs = F.softmax(logits, dim=-1)

                claim_score = probs[0][1].item()  # probability of "claim"

            # Apply your thresholds
            if claim_score > 0.5:
                label = "Likely Objective Claim"
            elif claim_score < 0.2:
                label = "Likely Opinion / Rhetoric"
            else:
                label = "Neutral / Ignored"

            results.append({
                "sentence": sentence,
                "score": claim_score,
                "label": label
            })

        return results