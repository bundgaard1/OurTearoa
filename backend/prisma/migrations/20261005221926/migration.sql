/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `places` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "places" DROP COLUMN "imageUrl",
ADD COLUMN     "type" TEXT;
