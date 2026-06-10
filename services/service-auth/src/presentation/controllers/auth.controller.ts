import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { LoginDto, RegisterDto, RefreshTokenDto, AuthTokensResponse, UserResponse } from '@scandark/contracts';
import { CurrentUser, AuthenticatedUser, JwtAuthGuard, RolesGuard, Roles } from '@scandark/nest-auth';
import { Result, UserRole } from '@scandark/shared-kernel';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  GetUserProfileUseCase,
  RefreshTokenUseCase,
  CreateUserByAdminUseCase,
} from '../../application/use-cases/auth.use-cases';

class CreateUserDto {
  email!: string;
  password!: string;
  name!: string;
  role!: UserRole;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
    private readonly getUserProfile: GetUserProfileUseCase,
    private readonly refreshToken: RefreshTokenUseCase,
    private readonly createUserByAdmin: CreateUserByAdminUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user (viewer role only)' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() dto: RegisterDto): Promise<UserResponse> {
    const result = await this.registerUser.execute(dto);
    if (Result.isFail(result)) {
      throw new BadRequestException(result.error.message);
    }
    const user = result.value!;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create user with specific role (admin only)' })
  async createUser(@Body() dto: CreateUserDto): Promise<UserResponse> {
    const result = await this.createUserByAdmin.execute(dto);
    if (Result.isFail(result)) {
      throw new BadRequestException(result.error.message);
    }
    const user = result.value!;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user and receive tokens',
    description:
      'Autentica com email e senha. Retorna accessToken (15min) e refreshToken (7 dias).',
  })
  @ApiResponse({ status: 200, type: AuthTokensResponse })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<AuthTokensResponse> {
    const result = await this.loginUser.execute(dto);
    if (Result.isFail(result)) {
      throw new UnauthorizedException(result.error.message);
    }
    return result.value!;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, type: AuthTokensResponse })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensResponse> {
    const result = await this.refreshToken.execute(dto.refreshToken);
    if (Result.isFail(result)) {
      throw new UnauthorizedException(result.error.message);
    }
    return result.value!;
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user profile' })
  async profile(@CurrentUser() user: AuthenticatedUser): Promise<UserResponse> {
    const result = await this.getUserProfile.execute(user.sub);
    if (Result.isFail(result)) {
      throw new UnauthorizedException(result.error.message);
    }
    const profile = result.value!;
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      createdAt: profile.createdAt.toISOString(),
    };
  }
}
