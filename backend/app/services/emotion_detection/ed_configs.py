WEIGHTS = {
    'anger' : 2,
    'disgust' : 2,
    'fear' : 1,
    'joy' : 1,
    'sadness' : 0.1,
    'surprise' : 0.25
}

EKMAN_MAPPING = {
    'anger' : 'anger',
    'annoyance' : 'anger',
    'disapproval' : 'anger',
    'disgust' : 'disgust',
    'fear' : 'fear',
    'nervousness' : 'fear',
    'joy' : 'joy',
    'amusement' : 'joy',
    'approval' : 'joy',
    'excitement' : 'joy',
    'gratitude' : 'joy',
    'love' : 'joy',
    'optimism' : 'joy',
    'relief' : 'joy',
    'pride' : 'joy',
    'admiration' : 'joy',
    'desire' : 'joy',
    'caring' : 'joy',
    'sadness' : 'sadness',
    'disappointment' : 'sadness',
    'embarrassment' : 'sadness',
    'grief' : 'sadness',
    'remorse' : 'sadness',
    'surprise' : 'surprise',
    'realization' : 'surprise',
    'confusion' : 'surprise',
    'curiosity' : 'surprise'
}

EKMAN_EMOTIONS = ['anger', 'disgust', 'fear', 'joy', 'sadness', 'surprise']

NORM = {emotion : 1 / sum(1 for v in EKMAN_MAPPING.values() if v == emotion) for emotion in EKMAN_EMOTIONS}

ABBREVS = ['capt', 'gov', 'sgt', 'mr', 'mrs', 'dr', 'jr', 'sr', 'cpl', 'gen', 'rep', 'tech', 'u.s', 'sen', 'hon', 'p.m', 'a.m']