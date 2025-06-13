-- DropIndex
DROP INDEX "Message_streamId_key";

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "model" TEXT NOT NULL DEFAULT 'Pixtral 12B';

-- CreateTable
CREATE TABLE "StreamTracker" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StreamTracker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StreamTracker_streamId_key" ON "StreamTracker"("streamId");

-- CreateIndex
CREATE INDEX "StreamTracker_conversationId_idx" ON "StreamTracker"("conversationId");

-- CreateIndex
CREATE INDEX "StreamTracker_streamId_idx" ON "StreamTracker"("streamId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_streamId_idx" ON "Message"("streamId");

-- AddForeignKey
ALTER TABLE "StreamTracker" ADD CONSTRAINT "StreamTracker_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
