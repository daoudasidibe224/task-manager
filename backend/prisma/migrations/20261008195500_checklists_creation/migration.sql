ALTER TABLE "tasks" ADD COLUMN "checklist" JSONB NOT NULL DEFAULT '[]';
CREATE TABLE "TaskCreation" (
 "id" UUID NOT NULL,
 "userId" TEXT NOT NULL,
 "payloadHash" TEXT NOT NULL,
 "taskId" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "TaskCreation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TaskCreation_taskId_key" ON "TaskCreation"("taskId");
CREATE INDEX "TaskCreation_userId_idx" ON "TaskCreation"("userId");
ALTER TABLE "TaskCreation" ADD CONSTRAINT "TaskCreation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskCreation" ADD CONSTRAINT "TaskCreation_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
