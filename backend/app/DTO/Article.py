from pydantic import BaseModel

class Article(BaseModel):
    url: str
    authors: list[str] | None = None
    org: str | None = None
    paragraphs: list[dict]