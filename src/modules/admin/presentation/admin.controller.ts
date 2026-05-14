import { Controller, Post, Get, Delete, Body, UseGuards, Request, Param } from '@nestjs/common';
import { AtGuard } from '../../users/presentation/guards/at.guard';
import { GlobalAdminGuard } from './guards/global-admin.guard';
import { BanChannelUseCase } from '../application/ban-channel.use-case';
import { GetReportsUseCase } from '../application/get-reports.use-case';
import { ReportChannelUseCase } from '../application/report-channel.use-case';
import { DismissReportUseCase } from '../application/dismiss-report.use-case';
import { GetBannedChannelsUseCase } from '../application/get-banned-channels.use-case';
import { UnbanChannelUseCase } from '../application/unban-channel.use-case';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly banChannelUseCase: BanChannelUseCase,
    private readonly getReportsUseCase: GetReportsUseCase,
    private readonly reportChannelUseCase: ReportChannelUseCase,
    private readonly dismissReportUseCase: DismissReportUseCase,
    private readonly getBannedChannelsUseCase: GetBannedChannelsUseCase,
    private readonly unbanChannelUseCase: UnbanChannelUseCase,
  ) {}

  @UseGuards(AtGuard, GlobalAdminGuard)
  @Post('ban')
  async banChannel(@Body() dto: { channelId: string; reason: string; durationDays?: number }, @Request() req: any) {
    await this.banChannelUseCase.execute({
      channelId: dto.channelId,
      adminId: req.user.sub,
      reason: dto.reason,
      durationDays: dto.durationDays,
    });
    return { success: true };
  }

  @UseGuards(AtGuard, GlobalAdminGuard)
  @Get('reports')
  async getReports() {
    return this.getReportsUseCase.execute();
  }

  @UseGuards(AtGuard, GlobalAdminGuard)
  @Delete('reports/:id')
  async dismissReport(@Param('id') id: string) {
    await this.dismissReportUseCase.execute(id);
    return { success: true };
  }

  @UseGuards(AtGuard, GlobalAdminGuard)
  @Get('bans')
  async getBannedChannels() {
    return this.getBannedChannelsUseCase.execute();
  }

  @UseGuards(AtGuard, GlobalAdminGuard)
  @Post('unban')
  async unbanChannel(@Body() dto: { banId: string }) {
    await this.unbanChannelUseCase.execute(dto.banId);
    return { success: true };
  }

  @UseGuards(AtGuard)
  @Post('report')
  async reportChannel(@Body() dto: { channelId: string; reason: string }, @Request() req: any) {
    await this.reportChannelUseCase.execute({
      channelId: dto.channelId,
      reporterId: req.user.sub,
      reason: dto.reason,
    });
    return { success: true };
  }
}
