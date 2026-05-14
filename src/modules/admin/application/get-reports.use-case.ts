import { Inject, Injectable, Logger } from '@nestjs/common';
import { IUseCase } from '../../../shared/application/use-case.interface';
import { ADMIN_REPOSITORY, IAdminRepository, ChannelReport } from '../domain/admin.repository.interface';

@Injectable()
export class GetReportsUseCase implements IUseCase<void, Promise<(ChannelReport & { channelTitle: string; reporterUsername: string })[]>> {
  private readonly logger = new Logger(GetReportsUseCase.name);

  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepository: IAdminRepository,
  ) {}

  async execute(): Promise<(ChannelReport & { channelTitle: string; reporterUsername: string })[]> {
    const reports = await this.adminRepository.getAllReports();
    this.logger.log(`[GetReports] Fetched ${reports.length} reports.`);
    return reports;
  }
}
