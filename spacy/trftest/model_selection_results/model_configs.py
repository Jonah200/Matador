from sklearn.linear_model import Ridge, RidgeCV, RidgeClassifier, RidgeClassifierCV
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.linear_model import LogisticRegression
import numpy as np

TFIDF_PARAMS={

    "tfidf__ngram_range" : [(1,2), (1,3)],
    "tfidf__max_df" : [0.5, 0.6, 0.7, 0.8, 0.9],
    "tfidf__min_df" : [5, 10, 25, 50, 100],
    "tfidf__sublinear_tf" : [True]

}

MODEL_CONFIGS=[

    {
        'name' : 'ridge_reg',
        'clf' : Ridge(),
        'type' : 'regression',
        'params' : {
            **TFIDF_PARAMS,
            "clf__alpha" : [0, 0.1, 0.5, 1, 5, 10, 100]
        },
        'n_iter' : 100,
        'scoring' : 'neg_mean_squared_error'
    },

    {
        'name' : 'ridge_class',
        'clf' : RidgeClassifier(),
        'type' : 'classification',
        'params' : {
            **TFIDF_PARAMS,
            "clf__alpha" : [1e-3, 0.1, 0.5, 1, 5, 10, 100]
        },
        'n_iter' : 100,
        'scoring' : 'f1_macro'
    },

    {

        'name' : 'rf_reg',
        'clf' : RandomForestRegressor(),
        'type' : 'regression',
        'params' : {
            **TFIDF_PARAMS,
            "clf__n_estimators" : [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
            "clf__max_depth" : np.linspace(1, 32, 32, endpoint=True, dtype=int),
            "clf__min_samples_split" : np.linspace(0.1, 1.0, 10, endpoint=True),
            "clf__min_samples_leaf" : np.linspace(0.1, 0.5, 5, endpoint=True),
            "clf__max_features" : ['sqrt', 'log2', 0.1]
        },
        'n_iter' : 500,
        'scoring' : 'neg_mean_squared_error'

    },

    {
        'name' : 'rf_class',
        'clf' : RandomForestClassifier(),
        'type' : 'classification',
        'params' : {
            **TFIDF_PARAMS,
            "clf__n_estimators" : [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
            "clf__criterion" : ['gini', 'entropy', 'log_loss'],
            "clf__max_depth" : np.linspace(1, 32, 32, endpoint=True, dtype=int),
            "clf__min_samples_split" : np.linspace(0.1, 1.0, 10, endpoint=True),
            "clf__min_samples_leaf" : np.linspace(0.1, 0.5, 5, endpoint=True),
            "clf__max_features" : ['sqrt', 'log2', 0.1]
        },
        'n_iter' : 500,
        'scoring' : 'f1_macro'
    },

    {

        'name' : 'multinomial_nb',
        'clf' : MultinomialNB(),
        'type' : 'classification',
        'params' : {
            **TFIDF_PARAMS,
            'clf__alpha' : [1e-3, 0.1, 0.5, 1, 5, 10, 100]
        },
        'n_iter' : 100,
        'scoring' : 'f1_macro'

    },

    {

        'name' : 'linear_svc',
        'clf' : LinearSVC(),
        'type' : 'classification',
        'params' : {
            **TFIDF_PARAMS,
            'clf__penalty' : ['l1', 'l2'],
            'clf__C' : [1e-3, 0.1, 0.5, 1, 5, 10, 100, 1000],
            'clf__dual' : [False]
        },
        'n_iter' : 200,
        'scoring' : 'f1_macro'

    },

    {
        'name' : 'log_reg',
        'clf' : LogisticRegression(),
        'type' : 'classification',
        'params' : {
            **TFIDF_PARAMS,
            'clf__penalty' : ['l1', 'l2', 'none'],
            'clf__solver' : ['saga'],
            'clf__C' : [1e-3, 0.1, 0.5, 1, 5, 10, 100, 1000],
            'clf__l1_ratio' : [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1],
            'clf__max_iter' : [5000]
        },
        'n_iter' : 200,
        'scoring' : 'f1_macro'
    }
]