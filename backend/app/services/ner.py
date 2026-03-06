from app.services.core import AnalysisService, register_service
from app.util.types import ServiceScope
import spacy
import time
import numpy as np
import json
import pandas as pd

@register_service
class NamedEntityRecognition(AnalysisService):
    name = 'ner_service'
    scope = ServiceScope.ARTICLE
    def run(self, text):

        nlp = spacy.load("en_core_web_trf")
        entities = []

        doc = nlp(text)
        for ent in doc.ents:
            entities.append({
                "text" : ent.text,
                "label" : ent.label_,
                "start_char" : ent.start_char,
                "end_char" : ent.end_char
            })
        
        return entities