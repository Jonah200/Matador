from app.DTO.Article import Article
import joblib
# from app.services.isd.preprocessing import preprocess
from importlib import import_module


def is_detection(article: Article):
    preprocess = import_module("app.services.isd.preprocessing.preprocess")
    model = joblib.load('app/services/isd/ridge_model.pkl')
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