from transformers import BartTokenizer, BartForConditionalGeneration
from app.DTO.Article import Article
import torch



def summarize(article: Article):
    tokenizer = BartTokenizer.from_pretrained('jbull42/bart-xsum-summarization')
    model = BartForConditionalGeneration.from_pretrained("jbull42/bart-xsum-summarization")

    summary = []

    for par in article.paragraphs:
        text = par['text']
        inputs = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=1024
        )

        inputs = {k: v.to(model.device) for k, v in inputs.items()}

        summary_ids = model.generate(
            **inputs,
            max_length=128,        
            num_beams=4,           
            length_penalty=2.0,    
            early_stopping=False
        )

        summ = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

        summary.append(summ)

    summary = " ".join(summary)

    return summary

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
            "text": '''Rep. Tony Gonzales, R-Texas, abruptly announced his decision to resign from Congress Monday evening amid calls for him to step aside after admitting to sexual misconduct with a staffer earlier this year.

The embattled lawmaker is facing an anticipated expulsion vote that could occur as early as this week. 

"There is a season for everything and God has a plan for us all. When Congress returns tomorrow, I will file my retirement from office," Gonzales wrote on social media. "It has been my privilege to serve the great people of Texas." Gonzales has come under bipartisan pressure to immediately step aside or face expulsion following his acknowledgment of an affair with his former staffer, Regina Santos-Aviles, who later died by setting herself on fire.

Rep. Teresa Leger Fernandez, D-N.M., has vowed to move forward with her expulsion resolution if Gonzales does not quickly resign.

"He has until 2PM tomorrow—when we will file his expulsion. He better write that resignation "effective immediately," Leger Fernandez wrote on social media.'''
        },
        # {
        #     "id": 2,
        #     "text": "Israeli Prime Minister Benjamin Netanyahu expressed support for the ceasefire and emphasized continued security concerns."
        # },
        # {
        #     "id": 3,
        #     "text": "Reports indicate that the Strait of Hormuz, a critical global oil route, was a major point of contention during the conflict."
        # },
        # {
        #     "id": 4,
        #     "text": "Global leaders from Europe and Australia welcomed the ceasefire and urged both sides to pursue long-term peace, Donald Trump"
        # }
    ]
}

article = Article(**article)


print(summarize(article))