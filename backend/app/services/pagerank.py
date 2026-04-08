import json
from app.services.core import AnalysisService, register_service
from app.util.types import ServiceScope
import spacy
import time
import numpy as np
import json
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import networkx as nx

@register_service
class PageRankService(AnalysisService):
    name = 'pagerank_service'
    scope = ServiceScope.ARTICLE

    # takes string of article text as input
    def run(self, text):


        sentences = [s.strip() for s in text.split('.') if s.strip()]

        vectorizer = TfidfVectorizer().fit_transform(sentences)
        sim_matrix = cosine_similarity(vectorizer)

        nx_graph = nx.from_numpy_array(sim_matrix)
        scores = nx.pagerank(nx_graph)

        ranked = sorted(((scores[i], s) for i, s in enumerate(sentences)), reverse=True)
        summary = ' . '.join([s for _, s in ranked[:3]])

        output = {
            'summary' : summary
        }

        return output
    