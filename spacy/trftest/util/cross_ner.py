import numpy as np
import os
import json
import pandas as pd
from typing import Literal
import string
import spacy
import spacy.tokens
from spacy.tokens import DocBin

OPEN_BEFORE = {"("}
NO_SPACE_BEFORE = {')', '.', ',', '!', '?', ':', ';', "'", "'s"}
NO_SPACE_AFTER = {"(", "'"}

def process_sentence(lines):
    text = ''
    entities = []
    cursor = 0

    current_start = None
    current_label = None
    prev_token = None

    for line in lines:
        token, tag = line.split('\t')
        token = token.strip()

        if text:
            if token in OPEN_BEFORE:
                text += ' '
                cursor += 1

            elif token in NO_SPACE_BEFORE:
                pass

            elif prev_token in NO_SPACE_AFTER:
                pass

            else:
                text += ' '
                cursor += 1

        start = cursor
        text += token
        end = start + len(token)
        cursor = end

        if tag.startswith('B-'):
            if current_start is not None:
                entities.append((current_start, prev_end, current_label))
            current_start = start
            current_label = tag[2:]
        elif tag.startswith('I-'):
            pass
        else:
            if current_start is not None:
                entities.append((current_start, prev_end, current_label))
                current_start = None
                current_label = None
        
        prev_token = token
        prev_end = end

    if current_start is not None:
        entities.append((current_start, prev_end, current_label))

    return (text, {'entities' : entities})

def convert_file_to_training_data(filepath):
    training_data = []
    sentence_buffer = []

    with open(filepath, 'r') as file:
        for line in file:
            stripped = line.strip()

            if not stripped:
                if sentence_buffer:
                    training_data.append(process_sentence(sentence_buffer))
                    sentence_buffer = []
            else:
                sentence_buffer.append(stripped)

    if sentence_buffer:
        training_data.append(process_sentence(sentence_buffer))

    if 'train' in filepath:
        print('sentences:', len(training_data))
    return training_data




def create_docbin(training_data, output_path):
    nlp = spacy.load("en_core_web_trf")
    ner = nlp.get_pipe('ner')

    docbin = DocBin()

    for text, annotations in training_data:
        doc = nlp.make_doc(text)

        ents = []

        for start, end, label in annotations['entities']:
            span = doc.char_span(start, end, label=label)
            ner.add_label(label)

            if span is None:
                print('skipping misaligned entity')
                continue

            ents.append(span)


        doc.ents = ents
        docbin.add(doc)
    
    docbin.to_disk(output_path)


if __name__ == '__main__':
    training_data = convert_file_to_training_data(r'spacy/trftest/data/crossNER/dev.txt')
    create_docbin(training_data, r'spacy/trftest/data/training/dev.spacy')

    training_data = convert_file_to_training_data(r'spacy/trftest/data/crossNER/train.txt')
    create_docbin(training_data, r'spacy/trftest/data/training/train.spacy')

    training_data = convert_file_to_training_data(r'spacy/trftest/data/crossNER/test.txt')
    create_docbin(training_data, r'spacy/trftest/data/training/test.spacy')

