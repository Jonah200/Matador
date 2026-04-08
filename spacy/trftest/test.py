import spacy
import time
import numpy as np
import json
import pandas as pd






def extract_entities(text:str):
    doc = nlp(text)
    entities = []

    for ent in doc.ents:
        entities.append({
            "text" : ent.text,
            "label" : ent.label_,
            "start_char" : ent.start_char,
            "end_char" : ent.end_char
        })

    return entities


if __name__ == "__main__":
    init = time.time()
    nlp = spacy.load("en_core_web_trf")
    print('Time to load model:', time.time() - init)
    start = time.time()

    df = pd.DataFrame(columns=['Title', 'Outlet', 'Word Count', 'Processing Time', 'WPS'])
    for i in range(5):
        with open(f'articles/json/article_{i+1}.json', 'r', encoding='utf-8') as file:
            start_time = time.time()
            print(f'\nStarting file {i+1}:', time.time() - start)
            data = json.load(file)
            paragraphs = data['paragraphs']
            title = data['title']
            outlet = data['outlet']

            word_count = 0
            ents = []

            for paragraph in paragraphs:
                text = paragraph['text']
                word_count += len(text.split())
                ents.extend(extract_entities(text))

            processing_time = time.time() - start_time
            wps = word_count / processing_time
            print(f'\nEntities extracted from file {i+1}:', processing_time)

            df.loc[len(df)] = [title, outlet, word_count, processing_time, wps]
        with open(f'ner/ent_{i+1}.json', 'w', encoding='utf-8') as file:
            json.dump(ents, file, indent=4, ensure_ascii=False)

    df.to_csv('test_articles.csv')
    print(df)
    print('Time:', time.time() - start)
