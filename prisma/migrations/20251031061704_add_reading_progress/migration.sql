-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "current_page" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Quero Ler';
