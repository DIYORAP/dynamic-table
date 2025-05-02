/*
  Warnings:

  - The primary key for the `Record` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `tableName` to the `Record` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Record` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Record" DROP CONSTRAINT "Record_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tableName" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Record_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Record_id_seq";

-- CreateTable
CREATE TABLE "TableMetadata" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "columns" JSONB,

    CONSTRAINT "TableMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TableMetadata_name_key" ON "TableMetadata"("name");

-- CreateIndex
CREATE INDEX "Record_tableName_idx" ON "Record"("tableName");
