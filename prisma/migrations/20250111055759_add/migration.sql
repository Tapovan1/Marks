/*
  Warnings:

  - Added the required column `test` to the `MarkEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MarkEntry" ADD COLUMN     "test" TEXT NOT NULL;
