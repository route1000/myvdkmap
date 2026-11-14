-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "population" INTEGER NOT NULL,
    "populationYear" INTEGER NOT NULL,
    "color" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Microdistrict" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    CONSTRAINT "Microdistrict_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Complex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "developer" TEXT,
    "street" TEXT,
    "status" TEXT NOT NULL,
    "floors" TEXT,
    "note" TEXT,
    "microdistrictId" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    CONSTRAINT "Complex_microdistrictId_fkey" FOREIGN KEY ("microdistrictId") REFERENCES "Microdistrict" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ManagementCompany" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "rating" REAL NOT NULL,
    "avgResponseDays" REAL NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "floors" INTEGER,
    "yearBuilt" INTEGER,
    "wallMaterial" TEXT,
    "apartments" INTEGER,
    "complexId" TEXT,
    "microdistrictId" TEXT NOT NULL,
    "managementCompanyId" TEXT,
    "lastCapRepairYear" INTEGER,
    "nextCapRepair" INTEGER,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Building_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "Complex" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Building_microdistrictId_fkey" FOREIGN KEY ("microdistrictId") REFERENCES "Microdistrict" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Building_managementCompanyId_fkey" FOREIGN KEY ("managementCompanyId") REFERENCES "ManagementCompany" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buildingId" TEXT,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'appeal',
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photoUrl" TEXT,
    "authorityId" TEXT NOT NULL,
    "appealText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "severity" INTEGER NOT NULL DEFAULT 2,
    "supports" INTEGER NOT NULL DEFAULT 0,
    "statusBeforeVotes" TEXT,
    "authorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Issue_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Issue_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Issue_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Authority" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "handles" TEXT NOT NULL,
    "contact" TEXT
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buildingId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "total" REAL NOT NULL,
    CONSTRAINT "Bill_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CityWork" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "plainSummary" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "lat" REAL,
    "lng" REAL
);

-- CreateTable
CREATE TABLE "CityWorkImpact" (
    "workId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,

    PRIMARY KEY ("workId", "buildingId"),
    CONSTRAINT "CityWorkImpact_workId_fkey" FOREIGN KEY ("workId") REFERENCES "CityWork" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CityWorkImpact_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "esiaId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "IssueVote" (
    "issueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gone" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("issueId", "userId"),
    CONSTRAINT "IssueVote_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IssueVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CabinetData" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "json" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CabinetData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Microdistrict_districtId_idx" ON "Microdistrict"("districtId");

-- CreateIndex
CREATE INDEX "Complex_microdistrictId_idx" ON "Complex"("microdistrictId");

-- CreateIndex
CREATE INDEX "Building_microdistrictId_idx" ON "Building"("microdistrictId");

-- CreateIndex
CREATE INDEX "Building_complexId_idx" ON "Building"("complexId");

-- CreateIndex
CREATE INDEX "Building_managementCompanyId_idx" ON "Building"("managementCompanyId");

-- CreateIndex
CREATE INDEX "Issue_buildingId_idx" ON "Issue"("buildingId");

-- CreateIndex
CREATE INDEX "Issue_createdAt_idx" ON "Issue"("createdAt");

-- CreateIndex
CREATE INDEX "Bill_buildingId_idx" ON "Bill"("buildingId");

-- CreateIndex
CREATE INDEX "CityWorkImpact_buildingId_idx" ON "CityWorkImpact"("buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_esiaId_key" ON "User"("esiaId");

-- CreateIndex
CREATE INDEX "IssueVote_userId_idx" ON "IssueVote"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");


CREATE TABLE "_DataSeed" ("id" TEXT NOT NULL PRIMARY KEY);
