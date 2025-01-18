-- CreateTable
CREATE TABLE "GiftCollectionTag" (
    "GiftCollectionId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "GiftCollectionTag_pkey" PRIMARY KEY ("GiftCollectionId","tagId")
);

-- AddForeignKey
ALTER TABLE "GiftCollectionTag" ADD CONSTRAINT "GiftCollectionTag_GiftCollectionId_fkey" FOREIGN KEY ("GiftCollectionId") REFERENCES "GiftCollection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCollectionTag" ADD CONSTRAINT "GiftCollectionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
