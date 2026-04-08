import matplotlib.pyplot as plt
import seaborn as sns
import nltk
from gensim.models import Doc2Vec
import gensim
from gensim.models.doc2vec import TaggedDocument
from sklearn import utils
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score, cross_val_predict
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import LinearSVC
from sklearn.metrics import confusion_matrix
import pandas as pd
import numpy as np
import math
import re
from bs4 import BeautifulSoup
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import Ridge
import collections
import time

nltk.download('punkt')
nltk.download('stopwords')
_stopwords = set(stopwords.words('english'))

# data = pd.read_csv('bias.csv')
data = pd.read_csv('bias_balanced.csv')
data = data.rename(columns={'bias':'Bias', 'page_text':'Text'})
print(data.head(10))

# data = data.drop('Link', axis=1)
print(data['Bias'].unique())

order = ['left', 'leaning-left', 'center', 'leaning-right', 'right']
biases = data['Bias'].value_counts()
plt.figure()
plt.title("Number of Observations per Bias Indicator")
plt.xlabel("Bias Indicator")
plt.ylabel('Frequency')
sns.barplot(x=biases.index, y=biases.values, order=order)
plt.show()

data['Bias'] = data['Bias'].astype(str).str.strip().str.lower()
# label_map = {
#     'left' : -2,
#     'lean left' : -1,
#     'center' : 0,
#     'lean right' : 1,
#     'right' : 2
# }

label_map = {
    'left' : -2,
    'leaning-left' : -1,
    'center' : 0,
    'leaning-right' : 1,
    'right' : 2
}
data['Bias'] = data['Bias'].map(label_map)

def clean(text):
    text = BeautifulSoup(text, "lxml").text
    text = re.sub(r'\|\|\|', r' ', text) 
    text = text.replace('„','')
    text = text.replace('“','')
    text = text.replace('"','')
    text = text.replace('\'','')
    text = text.lower()
    return text

def remove_stopwords(content):
    return " ".join([w for w in content.split() if w not in _stopwords])

data = data.dropna()
data['Text'] = data['Text'].apply(clean)
data['Text'] = data['Text'].apply(remove_stopwords)

data.to_csv('bias_text_data.csv')

print('bias type:', data['Bias'].dtype)
print('num nas:', sum(data['Bias'].isna()))


svm_pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1,2),
        min_df=5,
        max_df=0.8,
        max_features=20000
    )),
    ("clf", LinearSVC(class_weight='balanced'))
])

rf_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        ngram_range=(1,2),
        min_df=5,
        max_df=0.8,
        max_features=20000
    )),
    ('clf', RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        class_weight='balanced'
    ))
])

ridge_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        ngram_range=(1,2),
        min_df=5,
        max_df=0.8,
        max_features=20000
    )),
    ('clf', Ridge())
])

X = data['Text']
y = data['Bias']

skf = StratifiedKFold(n_splits = 5, shuffle=True, random_state=42)

pipelines = [svm_pipeline, rf_pipeline]
pipeline_names = ['Support Vector Machine', 'Random Forest']

text = """Fans were shocked on Monday when photos of Hollywood’s Dolby Theatre hit social media showing how Hollywood’s A-List celebrities, who constantly cry about climate change and environmental issues, left the theater looking like a pigsty.
A photo of the theater showing mounds of trash, including water bottles, snack bags and food debris, and papers and programs, sparked a backlash among fans, the New York Post reported.
One commenter was amazed at the mess and replied, “Aren’t some of them environmentalists? Where’s all that ‘protect the planet’ energy now?”

“Save the mountains, keep them clean, blah blah blah … but look at the mess they leave,” another wrote.

One piqued commenter added, “Just look at the hypocrisy— “Save the Planet” my ass! You people, that’s right- you people are nothing but a bunch of SLOBS! Trash and filth left behind by the over blown media apparatus known as ‘talent.’ What a bunch of pigs!”
Another ripped the A-Listers, writing, “I guess when your apart of the ultra wealthy elite you lose basic human decency.”

“The Elites make the mess and the lower class clears it after them,” an X user said.

“You’d think they’d have some more class,” a disgusted social media user said.

Despite the mess they left, several of Sunday’s Oscars stars used their time at the awards show to push environmental issues, including Jane Fonda, Javier Bardem, and Leonardo DiCaprio, the Post noted. The environmental activism goes back years at the Oscars, as well.
"""

text = """
“The spiritual leader of the Georgian Orthodox Church for just shy of half a century, Ilia II oversaw its transformation from an institution repressed under the Soviet Union into the most powerful non-state body in one of the world's oldest Christian countries.
Ilia II, the Catholicos-Patriarch of Georgia, died on Tuesday after being hospitalised, said senior ​cleric Metropolitan Shio. He had been admitted for massive internal bleeding the previous evening. He was 93.
The Holy Synod, composed of senior bishops, has ‌40 days to elect a new leader.
DEFENDER OF TRADITIONAL VALUES
Ilia II was born Irakli Ghudushauri-Shiolashvili on January 4, 1933 in Russia's North Caucasus region into a family who hailed from Georgia's mountainous Kazbegi district, just over the Greater Caucasus mountain chain separating Russia from Georgia.
He studied at Moscow's Theological Academy, which was temporarily shuttered by a Soviet ban on the teaching of religious doctrines but later reopened in the waning ​days of World War Two. He was ordained under the name Ilia.
Upon completion of his theological studies, Ilia II returned to Georgia and climbed the ranks of ​the church. He was elected the new Catholicos-Patriarch of Georgia in 1977.
Georgia adopted Christianity as its state religion in the early fourth ⁠century, and to this day the population is deeply religious and spiritual. According to a 2017 study by the Pew Research Center, 89% of Georgians identify as Orthodox Christians.
Ilia II ​inherited a Church that had been battered by the anti-religious campaigns undertaken by the Soviet government, including deadly purges of clergy and desecrations of holy sites. It had few clergy ​to serve a flock of several million.
A 2002 agreement with Georgia's first post-Soviet president, Eduard Shevardnadze, cemented the Church's unique status in Georgian social and political life. The Church was granted special rights in education and cultural heritage preservation, as well as tax exemptions.
IDEOLOGICAL VACUUM
As the Soviet Union disintegrated in 1991, the Church filled the emerging ideological vacuum once occupied by state communism, as Georgians turned to the Church ​as the repository of the country's traditions in their quest for a new national identity.
The Church is consistently ranked as the most respected institution in Georgia - Ilia II was named ​its most trusted man in a 2008 poll - although rates of weekly church attendance hover at the low levels seen in many European countries.
Throughout Ilia II's long reign, the Church found itself at ‌the nexus ⁠of Georgia's central struggle: how a country with long-held conservative, traditional values could balance its aspirations for European integration.
For some clergy, the Western-style liberalism that Georgia sought to espouse in the first quarter of this century was at odds with its spiritual mission, and damaging to its heritage.
On social issues, for example, Ilia II was staunchly conservative. He opposed abortion and described homosexuality as a "disease", likening LGBT people to drug addicts.
He called for the government to ban a gay rights rally in 2013. When the march went ahead, several thousand counter-protesters led ​by Orthodox priests attacked the participants, resulting ​in 17 injuries, according to rights group ⁠Amnesty International.
UKRAINIAN CHURCH CONTROVERSY
Critics of Ilia II say that under his leadership the Church came under the sway of the Russian Orthodox Church, which President Vladimir Putin rallied to drum up support for the war in Ukraine. Moscow's influence remains a politically sensitive subject in ​Georgia, which fought and lost a short war against Russia in 2008.
When Russia's full-scale invasion of Ukraine began in 2022, Ilia II ​expressed "deep heartache" over the ⁠conflict and later called for a ceasefire, as did many other global spiritual leaders, including Pope Francis.”
"""

text = """
President Donald Trump continues to make false and unproven claims about the war in Iran.

Trump claimed Monday that “nobody” expected Iran to retaliate by targeting US allies in the region. In fact, various experts had publicly warned that Iran might or would likely respond this way – and top Iranian officials had themselves vowed that Iran would target nearby US allies if attacked.

Trump claimed that a former president had told him in a private conversation that they wished they had attacked Iran as Trump did. But aides to all four living former presidents told CNN on Monday that they hadn’t spoken to Trump about the war.
Trump also repeated his long-debunked lie that a book he released in 2000 warned that Osama bin Laden was going to commit a major terrorist attack and said the authorities needed to “get” bin Laden. In fact, the book contained no warnings or advice about bin Laden.

And Trump argued Sunday that media outlets should be charged with treason for supposedly spreading fake videos of a US aircraft carrier on fire. But the White House could not provide a single example of a US media outlet promoting the fake videos.

Here is a fact check of these four claims.
"""

scores = cross_val_score(
    svm_pipeline,
    X,
    y,
    scoring='f1_macro',
    cv=skf
)

scores = [round(score, 4) for score in scores]

svm_pipeline.fit(X, y)
begin = time.time()
pred = svm_pipeline.predict([text])
print('time to predict:', time.time() - begin)


# pred = pipeline.predict(X)
# print(collections.Counter(pred))

# y_pred = cross_val_predict(pipeline, X, y, cv=skf)
# print(confusion_matrix(y, y_pred))

print('prediction:', [key for key, value in label_map.items() if value == pred][0])
print('f1 scores per fold:', scores)
print('mean f1 score:', round(np.mean(scores), 4))

y = data['topic']
svm_pipeline.fit(X, y)
pred = svm_pipeline.predict([text])
print('predicted topic:', pred[0])

y = data['site']
svm_pipeline.fit(X, y)
pred = svm_pipeline.predict([text])
print('predicted site:', pred[0])


# for pipeline, name in zip(pipelines, pipeline_names):
#     scores = cross_val_score(
#         pipeline,
#         X,
#         y,
#         scoring='f1_macro',
#         cv=skf
#     )

#     scores = [round(score, 4) for score in scores]

#     pipeline.fit(X, y)
#     pred = pipeline.predict([text])
    
#     # pred = pipeline.predict(X)
#     # print(collections.Counter(pred))

#     # y_pred = cross_val_predict(pipeline, X, y, cv=skf)
#     # print(confusion_matrix(y, y_pred))

#     print(name)
#     print('prediction:', pred)
#     print('f1 scores per fold:', scores)
#     print('mean f1 score:', round(np.mean(scores), 4))



# maybe write something to predict the topic as well??


# for pipeline in pipelines:
#     pipeline.fit(X, y)
#     pred = pipeline.predict([text])
#     print(pred)

#     pred = pipeline.predict(X)
#     print(collections.Counter(pred))

#     y_pred = cross_val_predict(pipeline, X, y, cv=skf)
#     print(confusion_matrix(y, y_pred))

# ridge_pipeline.fit(X, y)
# pred = ridge_pipeline.predict([text])
# print(pred)

# y_pred = cross_val_predict(ridge_pipeline, X, y, cv=skf)
# print(confusion_matrix(y, y_pred))
    