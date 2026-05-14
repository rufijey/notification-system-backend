import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { IAdminRepository, ChannelBan, ChannelReport } from '../domain/admin.repository.interface';

@Injectable()
export class PrismaAdminRepository implements IAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createBan(ban: Omit<ChannelBan, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChannelBan & { channelTitle: string }> {
    const created = await this.prisma.channelBan.create({
      data: {
        channelId: ban.channelId,
        adminId: ban.adminId,
        reason: ban.reason,
        expiresAt: ban.expiresAt,
        isActive: ban.isActive,
      },
      include: {
        channel: { select: { title: true } }
      }
    });
    return {
      ...created,
      channelTitle: created.channel?.title || 'Unknown Channel'
    };
  }

  async deactivateBan(banId: string): Promise<void> {
    await this.prisma.channelBan.update({
      where: { id: banId },
      data: { isActive: false },
    });
  }

  async getBanById(id: string): Promise<ChannelBan | null> {
    return this.prisma.channelBan.findUnique({
      where: { id },
    });
  }

  async getActiveBan(channelId: string): Promise<ChannelBan | null> {
    const ban = await this.prisma.channelBan.findFirst({
      where: {
        channelId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
    return ban;
  }

  async getChannelBans(channelId: string): Promise<ChannelBan[]> {
    return this.prisma.channelBan.findMany({
      where: { channelId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReport(report: Omit<ChannelReport, 'id' | 'createdAt'>): Promise<ChannelReport & { channelTitle: string; reporterUsername: string }> {
    const created = await this.prisma.channelReport.create({
      data: {
        channelId: report.channelId,
        reporterId: report.reporterId,
        reason: report.reason,
      },
      include: {
        channel: { select: { title: true } },
        reporter: { select: { username: true } },
      }
    });
    return {
      ...created,
      channelTitle: created.channel?.title || 'Unknown Channel',
      reporterUsername: created.reporter?.username || 'Unknown User'
    };
  }

  async getAllReports(): Promise<(ChannelReport & { channelTitle: string; reporterUsername: string })[]> {
    const reports = await this.prisma.channelReport.findMany({
      include: {
        channel: { select: { title: true } },
        reporter: { select: { username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reports.map(r => ({
      ...r,
      channelTitle: r.channel?.title || 'Unknown Channel',
      reporterUsername: r.reporter?.username || 'Unknown User',
    }));
  }

  async deleteReport(reportId: string): Promise<void> {
    await this.prisma.channelReport.delete({
      where: { id: reportId },
    });
  }

  async getAllActiveBans(): Promise<(ChannelBan & { channelTitle: string })[]> {
    const bans = await this.prisma.channelBan.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        channel: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bans.map(b => ({
      ...b,
      channelTitle: b.channel?.title || 'Unknown Channel',
    }));
  }
}
