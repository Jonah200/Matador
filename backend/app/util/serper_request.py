import http.client
import os
import json

conn = http.client.HTTPSConnection("google.serper.dev")

def get_articles(keywords):
    query = " ".join(keywords)
    payload = json.dumps({
    "q": query
    })
    headers = {
    'X-API-KEY': os.getenv('SERPER-API-KEY'),
    'Content-Type': 'application/json'
    }
    conn.request("POST", "/search", payload, headers)
    res = conn.getresponse()
    data = res.read()
    print(data.decode("utf-8"))

    return json.loads(data)

