/*
  Warnings:

  - You are about to drop the column `status` on the `ControlFrom` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `ControlFrom` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `ControlFrom` table. All the data in the column will be lost.
  - You are about to drop the column `equipmentId` on the `MaterialPhoto` table. All the data in the column will be lost.
  - You are about to drop the `Equipment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MaterialPhoto" DROP CONSTRAINT "MaterialPhoto_equipmentId_fkey";

-- AlterTable
ALTER TABLE "ControlFrom" DROP COLUMN "status",
DROP COLUMN "title",
DROP COLUMN "value",
ADD COLUMN     "adminId" TEXT,
ADD COLUMN     "bon_ecoulement" BOOLEAN,
ADD COLUMN     "equipment" TEXT,
ADD COLUMN     "etat_cloche" BOOLEAN,
ADD COLUMN     "etat_gille" BOOLEAN,
ADD COLUMN     "garde_en_eau" BOOLEAN,
ADD COLUMN     "presence_cloche" BOOLEAN,
ADD COLUMN     "presence_grille" BOOLEAN,
ADD COLUMN     "profondeur_cloche" BOOLEAN;

-- AlterTable
ALTER TABLE "MaterialPhoto" DROP COLUMN "equipmentId";

-- DropTable
DROP TABLE "Equipment";

-- AddForeignKey
ALTER TABLE "ControlFrom" ADD CONSTRAINT "ControlFrom_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
