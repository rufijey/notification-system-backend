import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import { USERS_REPOSITORY, IUsersRepository } from '../../users/domain/users.repository.interface';
import { User, UserRole } from '../../users/domain/user.entity';

@Injectable()
export class AdminInitializerService implements OnModuleInit {
  private readonly logger = new Logger(AdminInitializerService.name);

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async onModuleInit() {
    const username = process.env.ADMIN_USERNAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!username || !email || !password) {
      this.logger.warn('Admin credentials not fully provided in .env. Skipping admin initialization.');
      return;
    }

    const existingAdmin = await this.usersRepository.findByUsername(username);
    if (!existingAdmin) {
      this.logger.log(`[AdminInit] Creating global admin user: ${username}`);
      const passwordHash = await argon2.hash(password);
      const adminUser = new User(
        username,
        'Global Administrator',
        email,
        passwordHash,
        UserRole.GLOBAL_ADMIN,
        new Date(),
        new Date(),
      );
      await this.usersRepository.create(adminUser);
      this.logger.log('[AdminInit] Global admin user created successfully.');
    } else {
      this.logger.log(`[AdminInit] Admin user ${username} exists with role: ${existingAdmin.role}`);
      if (existingAdmin.role !== UserRole.GLOBAL_ADMIN) {
        this.logger.log(`[AdminInit] UPDATING user ${username} to GLOBAL_ADMIN role...`);
        const updatedAdmin = new User(
          existingAdmin.username,
          existingAdmin.fullName,
          existingAdmin.email,
          existingAdmin.passwordHash,
          UserRole.GLOBAL_ADMIN,
          existingAdmin.createdAt,
          new Date(),
          existingAdmin.avatarUrl,
        );
        await this.usersRepository.save(updatedAdmin);
        this.logger.log(`[AdminInit] User ${username} successfully promoted to GLOBAL_ADMIN.`);
      } else {
        this.logger.log(`[AdminInit] Admin user ${username} already has correct role.`);
      }
    }
  }
}
