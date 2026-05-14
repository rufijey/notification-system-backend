import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Get,
  Param,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { LoginUseCase } from '../application/login.use-case';
import { RegisterUseCase } from '../application/register.use-case';
import { RefreshTokensUseCase } from '../application/refresh-tokens.use-case';
import { LogoutUseCase } from '../application/logout.use-case';
import { UpdateProfileUseCase } from '../application/update-profile.use-case';
import { GetProfileUseCase } from '../application/get-profile.use-case';
import {
  IUsersRepository,
  USERS_REPOSITORY,
} from '../domain/users.repository.interface';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AtGuard } from './guards/at.guard';
import { RtGuard } from './guards/rt.guard';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
  };
}

interface RequestWithRefreshToken extends Request {
  user: {
    sub: string;
    email: string;
    refreshToken: string;
    tokenId?: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshTokensUseCase: RefreshTokensUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.registerUseCase.execute({
      dto,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    this.setRefreshTokenCookie(res, result.refreshToken);
    const user = await this.usersRepository.findByUsername(result.userId);
    return {
      accessToken: result.accessToken,
      userId: result.userId,
      fullName: user?.fullName ?? null,
      avatarUrl: user?.avatarUrl ?? null,
      role: user?.role ?? null,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.loginUseCase.execute({
      dto,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    this.setRefreshTokenCookie(res, result.refreshToken);
    const user = await this.usersRepository.findByUsername(result.userId);
    return {
      accessToken: result.accessToken,
      userId: result.userId,
      fullName: user?.fullName ?? null,
      avatarUrl: user?.avatarUrl ?? null,
      role: user?.role ?? null,
    };
  }

  @Post('refresh')
  @UseGuards(RtGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: RequestWithRefreshToken,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;
    const tokenId = req.user.tokenId;
    const result = await this.refreshTokensUseCase.execute({
      userId,
      refreshToken,
      tokenId,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    this.setRefreshTokenCookie(res, result.refreshToken);
    const user = await this.usersRepository.findByUsername(result.userId);
    return {
      accessToken: result.accessToken,
      userId: result.userId,
      fullName: user?.fullName ?? null,
      avatarUrl: user?.avatarUrl ?? null,
      role: user?.role ?? null,
    };
  }

  @Post('logout')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.sub;
    const refreshToken = req.cookies?.refreshToken;
    await this.logoutUseCase.execute({ userId, refreshToken });
    res.clearCookie('refreshToken');
    return { notification: 'Logged out successfully' };
  }

  @Patch('profile')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() body: { fullName?: string; avatarUrl?: string; publicKey?: string },
  ) {
    const username = req.user.sub;
    return this.updateProfileUseCase.execute({
      username,
      fullName: body.fullName,
      avatarUrl: body.avatarUrl,
      publicKey: body.publicKey,
    });
  }

  @Post('public-keys')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  async getPublicKeys(@Body() body: { usernames: string[] }) {
    const users = await this.usersRepository.findByUsernames(body.usernames);
    const result: Record<string, string> = {};
    users.forEach((user) => {
      if (user.publicKey) {
        result[user.username] = user.publicKey;
      }
    });
    return result;
  }

  @Get(':username')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Param('username') username: string) {
    return this.getProfileUseCase.execute(username);
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
