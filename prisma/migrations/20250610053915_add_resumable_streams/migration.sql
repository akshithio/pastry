/*
  Warnings:

  - A unique constraint covering the columns `[streamId]` on the table `Message` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isStreaming" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "partialContent" TEXT,
ADD COLUMN     "streamId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Message_streamId_key" ON "Message"("streamId");
