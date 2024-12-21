/*
  Warnings:

  - Added the required column `filePath` to the `ReviewImg` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ReviewImg" ADD COLUMN     "filePath" TEXT NOT NULL;
