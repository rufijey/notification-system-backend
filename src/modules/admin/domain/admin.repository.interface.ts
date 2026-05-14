export interface ChannelBan {
  id: string;
  channelId: string;
  adminId: string;
  reason: string;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelReport {
  id: string;
  channelId: string;
  reporterId: string;
  reason: string;
  createdAt: Date;
}

export interface IAdminRepository {
  createBan(ban: Omit<ChannelBan, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChannelBan & { channelTitle: string }>;
  deactivateBan(banId: string): Promise<void>;
  getBanById(id: string): Promise<ChannelBan | null>;
  getActiveBan(channelId: string): Promise<ChannelBan | null>;
  getChannelBans(channelId: string): Promise<ChannelBan[]>;
  
  createReport(report: Omit<ChannelReport, 'id' | 'createdAt'>): Promise<ChannelReport & { channelTitle: string; reporterUsername: string }>;
  getAllReports(): Promise<(ChannelReport & { channelTitle: string; reporterUsername: string })[]>;
  deleteReport(reportId: string): Promise<void>;
  getAllActiveBans(): Promise<(ChannelBan & { channelTitle: string })[]>;
}

export const ADMIN_REPOSITORY = 'ADMIN_REPOSITORY';
