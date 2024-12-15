/*
  Warnings:

  - You are about to drop the column `body` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `likedCount` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "body",
DROP COLUMN "likedCount",
ADD COLUMN     "wishedCount" INTEGER NOT NULL DEFAULT 0;
