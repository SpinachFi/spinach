-- AlterTable
ALTER TABLE "ProjectRecord" ALTER COLUMN "earnings" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "currentMonthEarnings" SET DEFAULT 0,
ALTER COLUMN "currentMonthEarnings" SET DATA TYPE DOUBLE PRECISION;
