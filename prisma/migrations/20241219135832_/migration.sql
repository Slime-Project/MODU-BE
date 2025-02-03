-- CreateTable
CREATE TABLE "ReviewImg" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "reviewId" INTEGER NOT NULL,

    CONSTRAINT "ReviewImg_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewImg_reviewId_order_key" ON "ReviewImg"("reviewId", "order");

-- AddForeignKey
ALTER TABLE "ReviewImg" ADD CONSTRAINT "ReviewImg_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
