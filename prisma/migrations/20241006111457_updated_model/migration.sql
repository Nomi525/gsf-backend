/*
  Warnings:

  - You are about to drop the column `equipmentId` on the `FunctionalPhoto` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "FunctionalPhoto" DROP CONSTRAINT "FunctionalPhoto_equipmentId_fkey";

-- AlterTable
ALTER TABLE "FunctionalPhoto" DROP COLUMN "equipmentId";
