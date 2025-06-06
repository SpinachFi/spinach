-- CreateTable
CREATE TABLE "Competition" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" SERIAL NOT NULL,
    "competitionId" INTEGER NOT NULL,
    "chainId" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionsOnProjects" (
    "competitionId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionsOnProjects_pkey" PRIMARY KEY ("competitionId","projectId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Competition_slug_key" ON "Competition"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Competition_name_key" ON "Competition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Competition_name_startDate_endDate_key" ON "Competition"("name", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionsOnProjects" ADD CONSTRAINT "CompetitionsOnProjects_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionsOnProjects" ADD CONSTRAINT "CompetitionsOnProjects_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


INSERT INTO "Competition" ("slug", "name", "description", "startDate", "endDate", "updatedAt")
VALUES ('usdglo', 'USDGLO', 'A competition to incentivize USDGLO projects.', '2025-06-01T00:00:00Z', '2025-07-01T00:00:00Z',  CURRENT_TIMESTAMP);

INSERT INTO "Reward" ("competitionId", "chainId", "value", "tokenAddress", "updatedAt")
VALUES (1, 42220, 100, '0x4F604735c1cF31399C6E711D5962b2B3E0225AD3',  CURRENT_TIMESTAMP);

-- Add projects with specified tokens to competition 1
INSERT INTO "CompetitionsOnProjects" ("competitionId", "projectId")
SELECT 1, "id" FROM "Project" WHERE "token" IN (
    'G$',
    'Ube',
    'NATURE',
    'COMMONS',
    'ANKOR',
    'Refi',
    'GIV',
    'axlREGEN'
);

-- AlterTable
ALTER TABLE "ProjectRecord" ADD COLUMN     "rewardId" INTEGER;

-- AddForeignKey
ALTER TABLE "ProjectRecord" ADD CONSTRAINT "ProjectRecord_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "ProjectRecord" SET "rewardId" = 1;
