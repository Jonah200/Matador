from pydantic import BaseModel
from typing import List, Dict, Union

class Article(BaseModel):
    url: str
    authors: List[str] | None = None
    org: str | None = None
    paragraphs: List[Dict[str, Union[int, str]]]