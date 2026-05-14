-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'GLOBAL_ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "ChannelBan" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelBan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelReport" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChannelBan_channelId_isActive_idx" ON "ChannelBan"("channelId", "isActive");

-- AddForeignKey
ALTER TABLE "ChannelBan" ADD CONSTRAINT "ChannelBan_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelBan" ADD CONSTRAINT "ChannelBan_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelReport" ADD CONSTRAINT "ChannelReport_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelReport" ADD CONSTRAINT "ChannelReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
