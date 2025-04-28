-- CreateTable
CREATE TABLE "Payout" (
    "id" SERIAL NOT NULL,
    "projectRecordId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "payoutAddress" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_projectRecordId_fkey" FOREIGN KEY ("projectRecordId") REFERENCES "ProjectRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
