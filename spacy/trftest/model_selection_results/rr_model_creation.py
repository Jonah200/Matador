import matplotlib.pyplot as plt
import seaborn as sns
import nltk
from gensim.models import Doc2Vec
import gensim
from gensim.models.doc2vec import TaggedDocument
from sklearn import utils
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score, cross_val_predict
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import LinearSVC
from sklearn.metrics import confusion_matrix
import pandas as pd
import numpy as np
import math
import re
from bs4 import BeautifulSoup
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import Ridge
import collections
import time
from sklearn.preprocessing import StandardScaler
import joblib
from sklearn.preprocessing import FunctionTransformer
from spacy.trftest.isd.preprocessing import preprocess


def create_rr_model():
    nltk.download('punkt')
    nltk.download('stopwords')
    
    # data = pd.read_csv('bias.csv')
    data = pd.read_csv('bias_balanced.csv')
    data = data.rename(columns={'bias':'Bias', 'page_text':'Text'})

    data['Bias'] = data['Bias'].astype(str).str.strip().str.lower()


    label_map = {
        'left' : -2,
        'leaning-left' : -1,
        'center' : 0,
        'leaning-right' : 1,
        'right' : 2
    }
    data['Bias'] = data['Bias'].map(label_map)


    data = data.dropna()
    # data['Text'] = data['Text'].apply(clean)
    # data['Text'] = data['Text'].apply(remove_stopwords)

    data.to_csv('bias_text_data.csv')
    ridge_pipeline = Pipeline([
        ('clean', FunctionTransformer(preprocess)),
        ('tfidf', TfidfVectorizer(
            ngram_range=(1,3),
            min_df=100,
            max_df=0.7,
            max_features=20000
        )),
        ('clf', Ridge(
             alpha=0.5
        ))
    ])

    X = data['Text']
    y = data['Bias']

    skf = StratifiedKFold(n_splits = 5, shuffle=True, random_state=42)

    scores = cross_val_score(
        ridge_pipeline,
        X,
        y,
        scoring='neg_mean_squared_error',
        cv=skf
    )

    scores = [round(score, 4) for score in scores]

    ridge_pipeline.fit(X, y)

    joblib.dump(ridge_pipeline, 'ridge_model.pkl')

create_rr_model()