import time
import random

from app.services.core import AnalysisService, register_service
from app.util.types import ServiceScope

@register_service
class FakeService(AnalysisService):
    name = "fake_service"
    scope = ServiceScope.PARAGRAPH
    def run(self, text):
        time.sleep(2)

        return {"result": random.random()}

@register_service
class FakeArticleService(AnalysisService):
    name = "fake_article_service"
    scope = ServiceScope.ARTICLE
    def run(self, text):
        time.sleep(5)
        return {"result": random.random()}
