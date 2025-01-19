/*
  Warnings:

  - A unique constraint covering the columns `[imgId]` on the table `GiftCollection` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `imgId` to the `GiftCollection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `GiftCollection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GiftCollection" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "imgId" INTEGER NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "wishedCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "GiftCollectionImg" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,

    CONSTRAINT "GiftCollectionImg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftCollectionProduct" (
    "giftCollectionId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "GiftCollectionProduct_pkey" PRIMARY KEY ("giftCollectionId","productId")
);

-- CreateIndex
CREATE UNIQUE INDEX "GiftCollection_imgId_key" ON "GiftCollection"("imgId");

-- AddForeignKey
ALTER TABLE "GiftCollection" ADD CONSTRAINT "GiftCollection_imgId_fkey" FOREIGN KEY ("imgId") REFERENCES "GiftCollectionImg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCollection" ADD CONSTRAINT "GiftCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCollectionProduct" ADD CONSTRAINT "GiftCollectionProduct_giftCollectionId_fkey" FOREIGN KEY ("giftCollectionId") REFERENCES "GiftCollection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCollectionProduct" ADD CONSTRAINT "GiftCollectionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
