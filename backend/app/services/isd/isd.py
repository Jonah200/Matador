from app.DTO.Article import Article
import joblib
from app.services.isd.preprocessing import preprocess
from pathlib import Path


def is_detection(article: Article):
    model_path = Path(__file__).with_name("ridge_model.pkl")
    model = joblib.load(model_path)
    text = " ".join(par["text"] for par in article.paragraphs)
    processed_text = preprocess([text])[0]
    bias = model.predict([processed_text])[0]

    direction = 'right' if bias > 0 else 'left'
    if bias == 0:
        direction = 'center'

    output = {
        'bias' : f'{bias:.3f}',
        'direction' : direction
    }

    return output
