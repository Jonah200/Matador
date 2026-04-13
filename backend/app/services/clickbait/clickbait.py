from transformers import AutoTokenizer, AutoModelForSequenceClassification
from app.DTO.Article import Article
import torch



def detect_clickbait(article: Article):
    tokenizer = AutoTokenizer.from_pretrained('jbull42/roberta-clickbait-detection')
    model = AutoModelForSequenceClassification.from_pretrained(
        "jbull42/roberta-clickbait-detection",
        num_labels=2
    )

    headline = article.headline
    inputs = tokenizer(
        headline,
        return_tensors="pt",
        truncation=True,
        padding=True
    )

    with torch.no_grad():
        outputs = model(**inputs)

    logits = outputs.logits
    pred_class = torch.argmax(logits, dim=1).item()

    mapping = {0 : 'OKAY', 1 : 'CLICKBAIT'}
    prediction = mapping[pred_class]

    return prediction

article = {
    "url": "https://www.foxnews.com/live-news/trump-us-iran-war-ceasefire-strait-hormuz-israel-live-updates-04-08-2026",
    "authors": [
        "Greg Norman",
        "Michael Lee",
        "Anders Hagstrom",
        "Alexandra Koch"
    ],
    "org": "Fox News",
    "headline" : "Hungary Election: Orbán concedes defeat to Magyar's Tisza",
    "paragraphs": [
        {
            "id": 1,
            "text": "President Donald Trump announced a ceasefire agreement involving Iran, aiming to de-escalate tensions in the region."
        },
        {
            "id": 2,
            "text": "Israeli Prime Minister Benjamin Netanyahu expressed support for the ceasefire and emphasized continued security concerns."
        },
        {
            "id": 3,
            "text": "Reports indicate that the Strait of Hormuz, a critical global oil route, was a major point of contention during the conflict."
        },
        {
            "id": 4,
            "text": "Global leaders from Europe and Australia welcomed the ceasefire and urged both sides to pursue long-term peace, Donald Trump"
        }
    ]
}

article = Article(**article)


print(detect_clickbait(article))