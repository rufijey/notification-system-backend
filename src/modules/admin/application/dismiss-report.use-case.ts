import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../shared/application/use-case.interface';
import { ADMIN_REPOSITORY, IAdminRepository } from '../domain/admin.repository.interface';

import { AdminEvent } from '../domain/admin-events.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class DismissReportUseCase implements IUseCase<string, Promise<void>> {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepository: IAdminRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(reportId: string): Promise<void> {
    await this.adminRepository.deleteReport(reportId);
    this.eventEmitter.emit(AdminEvent.REPORT_DISMISSED, { id: reportId });
  }
}
