import spacy
import pandas as pd
from collections import Counter
import nltk
from nltk.tokenize import sent_tokenize
from nltk.tokenize.punkt import PunktSentenceTokenizer, PunktParameters
import os
from huggingface_hub import hf_hub_download, login
from importlib import import_module
import json
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Dict, Union
from app.DTO.Article import Article
import joblib
from pydantic import BaseModel
from typing import List, Dict, Union
from preprocessing import preprocess


def is_detection(article: Article):
    model = joblib.load('ridge_model.pkl')
    text = " ".join([par['text'] for par in article.paragraphs])
    bias = model.predict([text])[0]

    direction = 'right' if bias > 0 else 'left'
    if bias == 0:
        direction = 'center'

    output = {
        'bias' : f'{bias:.3f}',
        'direction' : direction
    }

    return output