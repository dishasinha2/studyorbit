CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "public"."Embedding"
ADD COLUMN "vector" vector(1536);

CREATE INDEX "Embedding_vector_hnsw_idx"
ON "public"."Embedding"
USING hnsw ("vector" vector_cosine_ops);
