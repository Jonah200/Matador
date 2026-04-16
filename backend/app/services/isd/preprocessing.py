from bs4 import BeautifulSoup
import re
from nltk.corpus import stopwords

def clean(text):
    text = BeautifulSoup(text, "html.parser").text
    text = re.sub(r'\|\|\|', r' ', text)
    text = text.replace('„','').replace('“','')
    text = text.replace('"','').replace("'", '')
    return text.lower()

def remove_stopwords(content):
    _stopwords = set(stopwords.words('english'))
    return " ".join([w for w in content.split() if w not in _stopwords])

def preprocess(texts):
    return [remove_stopwords(clean(t)) for t in texts]
