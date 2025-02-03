/*
  Warnings:

  - A unique constraint covering the columns `[naverProductId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "naverProductId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_naverProductId_key" ON "Product"("naverProductId");
