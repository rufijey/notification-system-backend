import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { USERS_REPOSITORY } from './domain/users.repository.interface';
import { PrismaUsersRepository } from './infrastructure/prisma-users.repository';
import { TOKEN_SERVICE } from './domain/token-service.interface';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { RefreshTokenCleanupService } from './infrastructure/refresh-token-cleanup.service';
import { RegisterUseCase } from './application/register.use-case';
import { LoginUseCase } from './application/login.use-case';
import { RefreshTokensUseCase } from './application/refresh-tokens.use-case';
import { LogoutUseCase } from './application/logout.use-case';
import { UpdateProfileUseCase } from './application/update-profile.use-case';
import { GetProfileUseCase } from './application/get-profile.use-case';
import { UsersController } from './presentation/users.controller';
import { AtStrategy } from './presentation/strategies/at.strategy';
import { RtStrategy } from './presentation/strategies/rt.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({}), ScheduleModule.forRoot()],
  controllers: [UsersController],
  providers: [
    {
      provide: USERS_REPOSITORY,
      useClass: PrismaUsersRepository,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
    RefreshTokenCleanupService,
    RegisterUseCase,
    LoginUseCase,
    RefreshTokensUseCase,
    LogoutUseCase,
    UpdateProfileUseCase,
    GetProfileUseCase,
    AtStrategy,
    RtStrategy,
  ],
  exports: [USERS_REPOSITORY, TOKEN_SERVICE],
})
export class UsersModule {}
