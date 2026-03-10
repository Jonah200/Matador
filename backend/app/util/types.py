from dataclasses import asdict, dataclass, field
from enum import Enum
import time
from typing import Dict, List

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

    def from_dict(res_dict):
        return ServiceResult(service_scope=ServiceScope(res_dict['service_scope']),
                             service_name=res_dict['service_name'],
                             result_code=ServiceResultCode(res_dict['result_code']),
                             paragraph_index=res_dict['paragraph_index'],
                             result=res_dict['result'],
                             error=res_dict['error'],
                             completed_at=res_dict['completed_at'])

# TODO add url, org, authors??
@dataclass
class Job:
    job_id: str
    paragraphs: List[Paragraph]
    created_at: float = field(default_factory=time.time)
    status: JobStatus = JobStatus.PENDING
    results: List[ServiceResult] = field(default_factory=list)
    completed_at: float | None = None

    def to_dict(self):
        return asdict(self)

    def from_dict(job_dict: dict):
        job = Job(job_id=job_dict['job_id'],
                  paragraphs=[Paragraph(**para) for para in job_dict['paragraphs']],
                  created_at=job_dict['created_at'],
                  status=JobStatus(job_dict['status']),
                  results=[ServiceResult(**res) for res in job_dict['results']],
                  completed_at=job_dict['completed_at'])
        return job
