/*
  Warnings:

  - A unique constraint covering the columns `[token,chainId,dex]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ProjectRecord" DROP CONSTRAINT "ProjectRecord_projectToken_projectChainId_fkey";

-- DropIndex
DROP INDEX "Project_token_chainId_key";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "dex" TEXT NOT NULL DEFAULT 'Uniswap';

-- AlterTable
ALTER TABLE "ProjectRecord" ADD COLUMN     "projectDex" TEXT NOT NULL DEFAULT 'Uniswap';

-- CreateIndex
CREATE UNIQUE INDEX "Project_token_chainId_dex_key" ON "Project"("token", "chainId", "dex");

-- AddForeignKey
ALTER TABLE "ProjectRecord" ADD CONSTRAINT "ProjectRecord_projectToken_projectChainId_projectDex_fkey" FOREIGN KEY ("projectToken", "projectChainId", "projectDex") REFERENCES "Project"("token", "chainId", "dex") ON DELETE RESTRICT ON UPDATE CASCADE;
