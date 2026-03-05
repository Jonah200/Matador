from dataclasses import asdict, dataclass, field
from enum import Enum
import time
from typing import List

# Useful Enums
class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETE = "complete"
    FAILED = "failed"

class ServiceScope(str, Enum):
    ARTICLE = "article"
    PARAGRAPH = "paragraph"

class ServiceResultCode(str, Enum):
    COMPLETE = "complete"
    FAILED = "failed"

# Definition of Job and Paragraph and ServiceResult
@dataclass
class Paragraph:
    index: int
    text: str

@dataclass(frozen=True)
class ServiceResult:
    service_scope: ServiceScope
    service_name: str
    result_code: ServiceResultCode
    paragraph_index: int | None = None
    result: dict | None = None
    error: str | None = None
    completed_at: float = field(default_factory=time.time)
    def to_dict(self):
        return asdict(self)

# TODO add url, org, authors??
@dataclass
class Job:
    job_id: str
    paragraphs: List[Paragraph]
    created_at: float = field(default_factory=time.time)
    status: JobStatus = JobStatus.PENDING
    results: List[ServiceResult] = field(default_factory=list)
    completed_at: float | None = None

