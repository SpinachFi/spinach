-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "message" TEXT,
ADD CONSTRAINT "Project_pkey" PRIMARY KEY ("id");
