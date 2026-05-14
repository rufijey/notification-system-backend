import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { USERS_REPOSITORY, IUsersRepository } from '../../../users/domain/users.repository.interface';
import { UserRole } from '../../../users/domain/user.entity';

@Injectable()
export class GlobalAdminGuard implements CanActivate {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;

    if (!userId) {
      return false;
    }

    const user = await this.usersRepository.findByUsername(userId);
    if (!user || user.role !== UserRole.GLOBAL_ADMIN) {
      throw new ForbiddenException('Access denied. Global Admin role required.');
    }

    return true;
  }
}
