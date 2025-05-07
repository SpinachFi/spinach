/*
  Warnings:

  - You are about to drop the column `baseTvl` on the `ProjectRecord` table. All the data in the column will be lost.
  - You are about to drop the column `quoteTvl` on the `ProjectRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProjectRecord" DROP COLUMN "baseTvl",
DROP COLUMN "quoteTvl",
ADD COLUMN     "incentiveTokenTvl" INTEGER,
ADD COLUMN     "participatingTokenTvl" INTEGER;
