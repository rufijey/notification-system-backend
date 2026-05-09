-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateIndex
CREATE INDEX "Channel_title_idx" ON "Channel" USING GIN ("title" gin_trgm_ops);
