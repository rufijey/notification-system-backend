import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ADMIN_REPOSITORY } from './domain/admin.repository.interface';
import { PrismaAdminRepository } from './infrastructure/prisma-admin.repository';
import { AdminInitializerService } from './infrastructure/admin-initializer.service';
import { BanCheckerService } from './infrastructure/ban-checker.service';
import { BanChannelUseCase } from './application/ban-channel.use-case';
import { GetReportsUseCase } from './application/get-reports.use-case';
import { ReportChannelUseCase } from './application/report-channel.use-case';
import { DismissReportUseCase } from './application/dismiss-report.use-case';
import { GetBannedChannelsUseCase } from './application/get-banned-channels.use-case';
import { UnbanChannelUseCase } from './application/unban-channel.use-case';
import { AdminController } from './presentation/admin.controller';
import { GlobalAdminGuard } from './presentation/guards/global-admin.guard';
@Module({
  imports: [UsersModule],
  controllers: [AdminController],
  providers: [
    {
      provide: ADMIN_REPOSITORY,
      useClass: PrismaAdminRepository,
    },
    AdminInitializerService,
    BanCheckerService,
    BanChannelUseCase,
    GetReportsUseCase,
    ReportChannelUseCase,
    DismissReportUseCase,
    GetBannedChannelsUseCase,
    UnbanChannelUseCase,
    GlobalAdminGuard,
  ],
  exports: [ADMIN_REPOSITORY, BanCheckerService],
})
export class AdminModule {}
