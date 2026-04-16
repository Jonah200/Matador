import http.client
import json
import os
import ssl
from pathlib import Path
from urllib.parse import urlparse
import certifi
from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[2] / ".env")


def _extract_domain(article_url):
    try:
        hostname = urlparse(article_url).hostname or ""
        return hostname.replace("www.", "")
    except Exception:
        return ""


def _build_query(article_url, headline, keywords):
    cleaned_keywords = [keyword for keyword in keywords if keyword]
    headline_part = (headline or "").strip()
    keyword_part = " ".join(cleaned_keywords[:4]).strip()
    domain = _extract_domain(article_url)

    headline_query = f"\"{headline_part}\"" if headline_part else ""
    exclude_site = f"-site:{domain}" if domain else ""

    if headline_query and keyword_part:
        return " ".join(part for part in [headline_query, keyword_part, exclude_site] if part)

    return " ".join(part for part in [headline_query or keyword_part, exclude_site] if part)


def _post_json(path, payload, headers):
    context = ssl.create_default_context(cafile=certifi.where())
    conn = http.client.HTTPSConnection("google.serper.dev", context=context)
    conn.request("POST", path, json.dumps(payload), headers)
    res = conn.getresponse()
    data = res.read()
    conn.close()
    return json.loads(data)


def _get_api_key():
    return os.getenv("SERPER_API_KEY") or os.getenv("SERPER-API-KEY")


def get_articles(article_url, headline, keywords):
    query = _build_query(article_url, headline, keywords)
    if not query:
        return {}

    api_key = _get_api_key()
    if not api_key:
        return {}

    payload = {
        "q": query,
        "num": 10,
    }
    headers = {
        "X-API-KEY": api_key,
        "Content-Type": "application/json",
    }

    news_results = _post_json("/news", payload, headers)
    if news_results.get("news"):
        return news_results

    web_results = _post_json("/search", payload, headers)
    return {
        **web_results,
        "news": web_results.get("organic", []),
    }
