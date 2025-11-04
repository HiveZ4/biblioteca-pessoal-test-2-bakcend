-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "finish_date" TIMESTAMP(3),
ADD COLUMN     "genre" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "start_date" TIMESTAMP(3);
