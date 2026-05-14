-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "isEncrypted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ChannelMember" ADD COLUMN     "encryptedKey" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "publicKey" TEXT;
