/*
  Warnings:

  - A unique constraint covering the columns `[id,productId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Review_id_productId_key" ON "Review"("id", "productId");
