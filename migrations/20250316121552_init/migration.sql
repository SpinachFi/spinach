-- CreateTable
CREATE TABLE "Project" (
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "website" TEXT,
    "addLiquidity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "ProjectRecord" (
    "id" SERIAL NOT NULL,
    "projectToken" TEXT NOT NULL,
    "projectChainId" INTEGER NOT NULL,
    "tvl" INTEGER NOT NULL,
    "earnings" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_token_chainId_key" ON "Project"("token", "chainId");

-- AddForeignKey
ALTER TABLE "ProjectRecord" ADD CONSTRAINT "ProjectRecord_projectToken_projectChainId_fkey" FOREIGN KEY ("projectToken", "projectChainId") REFERENCES "Project"("token", "chainId") ON DELETE RESTRICT ON UPDATE CASCADE;
