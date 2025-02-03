-- DropForeignKey
ALTER TABLE "GiftCollectionProduct" DROP CONSTRAINT "GiftCollectionProduct_giftCollectionId_fkey";

-- DropForeignKey
ALTER TABLE "GiftCollectionProduct" DROP CONSTRAINT "GiftCollectionProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "GiftCollectionTag" DROP CONSTRAINT "GiftCollectionTag_GiftCollectionId_fkey";

-- AddForeignKey
ALTER TABLE "GiftCollectionProduct" ADD CONSTRAINT "GiftCollectionProduct_giftCollectionId_fkey" FOREIGN KEY ("giftCollectionId") REFERENCES "GiftCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCollectionProduct" ADD CONSTRAINT "GiftCollectionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCollectionTag" ADD CONSTRAINT "GiftCollectionTag_GiftCollectionId_fkey" FOREIGN KEY ("GiftCollectionId") REFERENCES "GiftCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
