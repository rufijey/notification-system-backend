import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../shared/application/use-case.interface';
import { ADMIN_REPOSITORY, IAdminRepository } from '../domain/admin.repository.interface';

interface ReportChannelInput {
  channelId: string;
  reporterId: string;
  reason: string;
}

import { AdminEvent } from '../domain/admin-events.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ReportChannelUseCase implements IUseCase<ReportChannelInput, Promise<void>> {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepository: IAdminRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: ReportChannelInput): Promise<void> {
    const { channelId, reporterId, reason } = input;

    const report = await this.adminRepository.createReport({
      channelId,
      reporterId,
      reason,
    });

    this.eventEmitter.emit(AdminEvent.REPORT_CREATED, report);
  }
}
