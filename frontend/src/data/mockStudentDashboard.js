export const DASHBOARD_CONTEXT_LABEL = "Week 6 Progress & Latest Feedback";

export const INITIAL_ACTION_PLAN = [
  {
    id: "step-1",
    stepNumber: 1,
    title: "Tighten pgvector cosine threshold calibration",
    rationale:
      "Your Week 6 retrieval lab flagged false-positive context matches above 0.42 distance; narrowing to 0.32 improves precision.",
    module: "Vector Retrieval & RAG",
    estimatedMinutes: 25,
    status: "done",
  },
  {
    id: "step-2",
    stepNumber: 2,
    title: "Add latency benchmarks for indexed vs. sequential queries",
    rationale:
      "Trainer evaluation noted strong schema design, with room to document HNSW index recall-vs-speed trade-offs.",
    module: "Database Performance",
    estimatedMinutes: 30,
    status: "in_progress",
  },
  {
    id: "step-3",
    stepNumber: 3,
    title: "Structure a 3-bullet executive recap for Capstone review",
    rationale:
      "Keep regional stakeholder briefs concise—lead with measurable accuracy gains before implementation notes.",
    module: "Applied Capstone Prep",
    estimatedMinutes: 20,
    status: "todo",
  },
];

export const WEEKLY_SCORES = [
  { week: "Week 1", shortLabel: "W1", score: 6.8, topic: "Foundations & SQL Modeling" },
  { week: "Week 2", shortLabel: "W2", score: 7.2, topic: "API Contracts & Validation" },
  { week: "Week 3", shortLabel: "W3", score: 7.0, topic: "Async Pipelines & Auth" },
  { week: "Week 4", shortLabel: "W4", score: 7.6, topic: "Embeddings & Chunking" },
  { week: "Week 5", shortLabel: "W5", score: 7.9, topic: "pgvector Indexing" },
  { week: "Week 6", shortLabel: "W6", score: 8.5, topic: "Evaluation & Calibration" },
];

export const TRAINER_FEEDBACK = [
  {
    id: "fb-1",
    date: "Nov 24",
    trainer: "Dr. Amara Okafor",
    module: "Vector Retrieval & RAG",
    score: "8.5 / 10",
    note: "Clean hybrid search pipeline and clear error handling. Tighten your cosine distance threshold before Friday's benchmark.",
  },
  {
    id: "fb-2",
    date: "Nov 17",
    trainer: "Samuel Mensah",
    module: "pgvector Indexing",
    score: "7.9 / 10",
    note: "Good migration structure and reproducible seed data. Document why HNSW parameters were chosen over IVFFlat.",
  },
  {
    id: "fb-3",
    date: "Nov 10",
    trainer: "Dr. Amara Okafor",
    module: "Embeddings & Chunking",
    score: "7.6 / 10",
    note: "Chunk overlap tuning improved recall noticeably. Watch token budget constraints on longer regional transcripts.",
  },
];

export const MOCK_COURSES = [
  {
    id: "course-1",
    code: "ML-204",
    title: "Vector Retrieval & RAG Systems",
    region: "5-Country Cohort",
    progress: 82,
    instructor: "Dr. Amara Okafor",
    nextSession: "Thu · 14:00 UTC",
  },
  {
    id: "course-2",
    code: "DB-118",
    title: "High-Scale PostgreSQL & pgvector",
    region: "5-Country Cohort",
    progress: 74,
    instructor: "Samuel Mensah",
    nextSession: "Fri · 11:30 UTC",
  },
  {
    id: "course-3",
    code: "CAP-301",
    title: "Multi-Region Capstone Studio",
    region: "Regional Track",
    progress: 60,
    instructor: "Lina Haddad",
    nextSession: "Mon · 16:00 UTC",
  },
];

export const MOCK_ANNOUNCEMENTS = [
  {
    id: "ann-1",
    tag: "Capstone",
    date: "Nov 26",
    title: "Milestone 2 benchmark submissions due Friday 18:00 UTC",
    body: "Include your HNSW recall/latency comparison table in the repo README.",
  },
  {
    id: "ann-2",
    tag: "Office Hours",
    date: "Nov 25",
    title: "Regional Q&A with Dr. Amara Okafor moved to Thursday 14:00 UTC",
    body: "Bring any pgvector threshold tuning questions from this week's lab.",
  },
];
