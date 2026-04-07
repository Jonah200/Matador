from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import networkx as nx

from app.DTO.Article import Article


def process_textrank(article: Article):

    text = "".join(para["text"] for para in article.paragraphs)
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