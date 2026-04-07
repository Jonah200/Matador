import spacy
import pandas as pd
from app.util import serper_request
from collections import Counter

from app.DTO.Article import Article

def process_ner(article: Article):

    text = "".join(para["text"] for para in article.paragraphs)
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

    ents = [ent['text'] for ent in entities]
    counts = Counter(ents).most_common(5)
    keywords = [count[0] for count in counts]
    
    articles = serper_request.get_articles(keywords)

    output = {
        'entities' : entities,
        'articles' : articles
    }
    
    return output