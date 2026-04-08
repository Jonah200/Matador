import random
import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import Ridge, RidgeCV, RidgeClassifier, RidgeClassifierCV
from sklearn.model_selection import StratifiedKFold, RandomizedSearchCV, KFold
from sklearn.metrics import f1_score
from sklearn.base import clone
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
import math
from model_configs import MODEL_CONFIGS


# models: random forest, SVM, Ridge regression, multi class logistic regression




def param_grid(type, data):
    match type:
        case 'ridge':
        
            return {

                "tfidf__ngram_range" : [(1,2), (1,3)],
                "tfidf__max_df" : [0.5, 0.6, 0.7, 0.8, 0.9],
                "tfidf__min_df" : [5, 10, 25, 50, 100],
                "tfidf__sublinear_tf" : [True],

                "clf" : [Ridge()],
                "clf__alpha" : [0, 0.1, 0.5, 1, 5, 10],
                
            }
        
        case 'rf class':

            return {
                "tfidf__ngram_range" : [(1,2), (1,3)],
                "tfidf__max_df" : [0.5, 0.6, 0.7, 0.8, 0.9],
                "tfidf__min_df" : [5, 10, 25, 50, 100],
                "tfidf__sublinear_tf" : [True],

                "clf" : [RandomForestClassifier()],
                "clf__n_estimators" : [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
                "clf__criterion" : ['gini', 'entropy', 'log_loss'],
                "clf__max_depth" : np.linspace(1, 32, 32, endpoint=True, dtype=int),
                "clf__min_samples_split" : np.linspace(0.1, 1.0, 10, endpoint=True),
                "clf__min_samples_leaf" : np.linspace(0.1, 0.5, 5, endpoint=True),
                "clf__max_features" : list(range(1, data.drop('Text', axis=1).shape[1]))
            }
        
        case 'rf reg':
            pass

    







prediction_types = ['regression']

def random_search(pipeline, param_grid, data, pred_type, n_iter=50):
    results = []

    for i in range(n_iter):
        params = {}

        for key, values in param_grid.items():
            params[key] = random.choice(values)

        model = clone(pipeline)
        model.set_params(**params)

        metric_value = kfold_cv(model, pred_type, data)
        metric = 'MSE' if pred_type == 'regression' else 'F1 Macro'


        results.append({
            **params,
            'metric' : metric_value,
            'pred_type' : pred_type
        })

        print(f'Iteration {i}')
        print(f'Params: {params}')
        print(f'{metric}: {metric_value}')

    if pred_type == 'regression':
        best = min(results, key=lambda x: x['metric'])
    else:
        best = max(results, key=lambda x: x['metric'])

    results = pd.DataFrame(results)
    results.to_csv('results.csv')
    return best, results




def kfold_cv(pipeline, pred_type, data, k=5):
    X = data['Text']
    y = data['Bias']

    skf = StratifiedKFold(n_splits = k, shuffle=True, random_state=42)

    metric_values = []

    for train_idx, test_idx in skf.split(X, y):

        train_X = X.iloc[train_idx]
        train_y = y.iloc[train_idx]

        test_X = X.iloc[test_idx]
        test_y = y.iloc[test_idx]

        pipeline.fit(train_X, train_y)

        pred = pipeline.predict(test_X)

        if pred_type == 'regression':
            metric = compute_mse(test_y, pred)
        elif pred_type == 'classification':
            metric = compute_f1(test_y, pred)

        metric_values.append(metric)

    return np.mean(metric_values)


def compute_mse(test_y, pred):
    test_y = list(test_y)
    pred = list(pred)

    return sum([(actual - predicted) ** 2 for actual, predicted in zip(test_y, pred)]) / len(test_y)

def compute_f1(test_y, pred):
    return f1_score(test_y, pred, average='macro')



if __name__ == "__main__":

    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer()),
        ('clf', Ridge())
    ])
    
    data = pd.read_csv('bias_text_data.csv')
    
    results = {}

    for model in MODEL_CONFIGS:
        pipeline.set_params(clf=model['clf'])

        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42) if model['type'] == 'classification' else KFold(n_splits=5, random_state=42, shuffle=True)

        search = RandomizedSearchCV(
            pipeline,
            param_distributions=model['params'],
            n_iter=model['n_iter'],
            cv=cv,
            scoring=model['scoring'],
            n_jobs=5,
            verbose=2
        )

        search.fit(data['Text'], data['Bias'])
        df = pd.DataFrame(search.cv_results_)
        df.to_csv(f"{model['name']}_results.csv", index=False)

        print(search.best_params_, search.best_score_, search.best_estimator_)
        best_params = {
            'best_params' : search.best_params_,
            'best_score' : search.best_score_,
            'best_estimator' : search.best_estimator_
        }

        results[model['name']] = best_params
    
    results_df = pd.DataFrame.from_dict(results, orient='index')
    results_df.to_csv('results.csv', index=False)
