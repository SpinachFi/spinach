/*
  Warnings:

  - A unique constraint covering the columns `[projectRecordId]` on the table `Payout` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Payout_projectRecordId_key" ON "Payout"("projectRecordId");
