"""Phase 3 placeholder — asynchronous AI / embedding workers.

Phase 1-2 only persists raw feedback. In Phase 3 these tasks will:
- retrieve the trainee learning profile from pgvector (tenant-filtered),
- call vLLM (Llama 3.1/3.3 or Mistral) via LlamaIndex to build a 3-step plan,
- write `trainer_evaluations.ai_action_plan` and new `vector_memories` rows.
"""

import logging

from celery import Celery

from app.core.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "lms_worker",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)
celery_app.conf.update(task_serializer="json", result_serializer="json", accept_content=["json"])


@celery_app.task(name="worker.generate_ai_action_plan")
def generate_ai_action_plan(evaluation_id: int) -> dict:
    # TODO Phase 3: pgvector retrieval + LlamaIndex + vLLM generation.
    logger.info("Phase 3 stub: AI action plan requested for evaluation %s", evaluation_id)
    return {"status": "stub", "evaluation_id": evaluation_id, "ai_action_plan": None}


@celery_app.task(name="worker.generate_embedding")
def generate_embedding(memory_id: int) -> dict:
    # TODO Phase 3: embed content_text (768-dim) and store in vector_memories.embedding.
    logger.info("Phase 3 stub: embedding requested for vector memory %s", memory_id)
    return {"status": "stub", "memory_id": memory_id}
