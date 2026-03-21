import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import re


# ======================
# Load model + tokenizer
# ======================
MODEL_PATH = "ml/artifacts/claim_model/"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)

model.eval()


# ======================
# Sentence splitting
# ======================
def split_into_sentences(text):
    # Simple regex-based splitter (good enough for MVP)
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s for s in sentences if len(s) > 0]


# ======================
# Inference
# ======================
def analyze_article(article_text):
    sentences = split_into_sentences(article_text)

    results = []

    for sentence in sentences:
        inputs = tokenizer(
            sentence,
            return_tensors="pt",
            truncation=True,
            max_length=128
        )

        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probs = F.softmax(logits, dim=-1)

            claim_score = probs[0][1].item()  # probability of "claim"

        # Apply your thresholds
        if claim_score > 0.5:
            label = "Likely Objective Claim"
        elif claim_score < 0.2:
            label = "Likely Opinion / Rhetoric"
        else:
            label = "Neutral / Ignored"

        results.append({
            "sentence": sentence,
            "score": claim_score,
            "label": label
        })

    return results


# ======================
# Example usage
# ======================
if __name__ == "__main__":
    article = """
    European Commission President Ursula von der Leyen reflected a feeling of profound change among European \
    leaders at this weekend's Munich Security Conference when she said: \"Some lines have been crossed that cannot be uncrossed anymore\".\n\
    Transatlantic ties have already been strained over the past year by Donald Trump’s return to the White House.\
      But the U.S. president’s push to annex Greenland dramatically increased European doubts about Washington’s \
      commitment to protect the continent through the NATO alliance. U.S. Secretary of State Marco Rubio offered \
      limited reassurance to Europeans in his conference speech. Rubio said the U.S. wanted to work with Europe \
      and used a warmer tone than Vice President JD Vance last year. But he was critical of Europe's recent \
      political course and did not mention NATO, Russia or Moscow’s war in Ukraine - issues on which a gulf has \
      emerged between the U.S. and its partners in the alliance.\nWith the war about to enter its fifth year and \
      Moscow viewed as an increasing threat by its European neighbours, leaders from the continent declared they \
      would accelerate efforts to boost their own defences and rely less on the U.S. That, in theory, puts them on \
      the same page as Trump. His administration says it expects Europe to take primary responsibility for the \
      conventional defence of the continent in the coming years. In return, Washington will keep its nuclear umbrella \
      over Europe and uphold NATO’s mutual defence pact. German Chancellor Friedrich Merz, French President Emmanuel \
      Macron and British Prime Minister Keir Starmer pledged their commitment in Munich to a stronger “European\
       pillar” within NATO. But a stronger home-grown defence is also a hedge against Trump or a future U.S. leader \
       deciding not to defend Europe.\n“This new beginning is right under all circumstances. It is right if the \
       United States continues to distance itself. It is right as long as we cannot guarantee our own security on \
       our own,” Merz told the conference on Friday. In another sign of the nervousness surrounding U.S. security \
       commitments, Merz said he had begun talks with Macron about a European nuclear deterrence.\
       \nFrance holds the only truly independent nuclear deterrent in Europe since Britain's Trident nuclear \
       missiles are made and maintained by the United States. The big question for Europe and its leaders is \
       whether they can match their words with deeds – to buy and develop new weapons systems, to fill gaps in \
       their arsenals in areas such as long-range missiles and to coordinate their work.\nThe signs so far are mixed.\
       \nDriven by fears of Russia and exhortations from Trump, European countries have boosted defence spending. \
       NATO members agreed last year to raise spending on core defence from 2% of GDP to 3.5% of GDP, with a further 1.5% to be spent on \
       other security-related investments. European defence spending has risen nearly 80% since before the war in Ukraine began, \
       von der Leyen told the Munich conference.\nEuropean countries are forming consortia to build complex weapons systems. \
       Defence ministers from France, Germany, Italy, Poland and Sweden signed a letter of intent on Thursday to advance work on European Long-range Strike Approach (ELSA), a project to develop “deep strike” missiles.\
       \nOn the sidelines of a NATO defence ministers’ meeting on Thursday, coalitions of European countries agreed to work together on four projects, \
       including ballistic missile defence and air-launched munitions. But some high-profile pan-European projects have struggled to get off the ground. \
       The future of the FCAS French-German-Spanish fighter jet project has been in the balance for months, with the partners unable to agree on the share of work for the companies involved.\
       \nDebates on European Union defence projects have been accompanied by wrangling over whether they should be limited to EU companies or open to others.\
       \nFrance has been the strongest advocate to “buy European” provisions while the likes of Germany and \
       The Netherlands argue for a more open approach.\nAmid the debates in the swanky Bayerischer Hof hotel, \
       Ukrainian President Volodymyr Zelenskiy brought home the reality of modern war, surrounded by giant \
       screens showing images and statistics of Russian attacks. Last month alone, Ukraine was attacked by \
       more than 6,000 drones and 150 missiles.\n“During this war, weapons evolve faster than political decisions \
       meant to stop them,” he told the delegates
    """

    results = analyze_article(article)

    for r in results:
        print(f"\nSentence: {r['sentence']}")
        print(f"Score: {r['score']:.3f}")
        print(f"Label: {r['label']}")