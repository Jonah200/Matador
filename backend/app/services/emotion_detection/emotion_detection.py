import nltk
from nltk.tokenize.punkt import PunktSentenceTokenizer, PunktParameters
from importlib import import_module
from app.services.emotion_detection.ed_configs import WEIGHTS, EKMAN_EMOTIONS, EKMAN_MAPPING, NORM, ABBREVS
from app.DTO.Article import Article


def detect_emotions(article: Article):

    text = "".join(para["text"] for para in article.paragraphs)
    nltk.download('punkt_tab')

    flagged = []
    okay = []
    out = {}

    punkt_params = PunktParameters()
    
    punkt_params.abbrev_types = set(ABBREVS)

    tokenizer = PunktSentenceTokenizer(punkt_params)

    sents = tokenizer.tokenize(text)
    spans = list(tokenizer.span_tokenize(text))

    inference_module = import_module("app.services.emotion_detection.inference")
    predict_emotions = inference_module.predict_emotions

    
    for index, sent in enumerate(sents):
        result, processed = predict_emotions(sent)
        print(sent)
        print(type(result))

        mapped = {emotion: sum(value if EKMAN_MAPPING[key] == emotion else 0 for key, value in result.items()) for emotion in EKMAN_EMOTIONS}
        norm = {emotion : value * NORM[emotion] for emotion, value in mapped.items()}
        ekman = {emotion : value * WEIGHTS[emotion] for emotion, value in norm.items()}


        top_emotion = max(ekman, key=ekman.get)
        dominance = ekman[top_emotion]
        mass = sum(v for k,v in ekman.items())


        span = spans[index]

        token = {
            'start' : span[0],
            'end' : span[1],
            'token' : sent,
            'processed' : processed,
            'emotions' : result,
            'ekman' : ekman,
            'dominance' : dominance,
            'top_emotion' : top_emotion,
            'mass' : mass
        }

        
        if mass > 0.3:
            flagged.append(token)
        else:
            okay.append(token)

    out['flagged'] = flagged
    out['okay'] = okay

    return out

# paragraphs = [
#     {
#         'text' : 'President Donald Trump on Tuesday announced that, based on conversations with Pakistani Prime Minister Shehbaz Sharif and Field Marshal Asim Munir, he will delay the "bombing and attack of Iran" for two weeks.'
#     },
#     {
#         'text' : 'Trump said the decision came after the leaders requested the U.S. "hold off the destructive force being sent tonight to Iran," which the president previously threatened would start at 8 p.m. eastern time if a deal was not reached.'
#     }
# ]

# article = Article(
#     url='url',
#     authors=['author1', 'author2'],
#     org='org',
#     paragraphs=paragraphs
# )

# print(detect_emotions(article))