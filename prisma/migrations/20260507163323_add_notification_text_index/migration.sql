-- CreateIndex
CREATE INDEX "Notification_text_idx" ON "Notification" USING GIN ("text" gin_trgm_ops);
