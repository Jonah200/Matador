from datasets import load_dataset

def load_claimbuster(split="train"):
    dataset = load_dataset("rashmikamath01/claimbuster2Cfrom3C", split=split)
    dataset.map(lambda x: {"text": x['text'], "label": int(x['label'])})
    return dataset