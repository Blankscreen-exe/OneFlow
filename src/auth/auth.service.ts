import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetService } from './password-reset.service';
import { EmailService } from '../email/email.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { RegisterClientDto } from './dto/register-client.dto';
import { ClientServiceProviderService } from '../users/services/client-service-provider.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private passwordResetService: PasswordResetService,
    private emailService: EmailService,
    private clientServiceProviderService: ClientServiceProviderService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    const { password, ...result } = user;
    return {
      ...result,
      accessToken: this.generateToken(user.id, user.email, user.role),
    };
  }

  async registerClient(registerClientDto: RegisterClientDto) {
    // Check if email already exists
    const existingUser = await this.usersService.findByEmail(registerClientDto.email);

    let user: User;

    if (existingUser) {
      // If user exists and is CLIENT role, link to new SP
      if (existingUser.role === Role.CLIENT) {
        // Check if already linked to this SP
        const isLinked = await this.clientServiceProviderService.isClientLinkedToSP(
          existingUser.id,
          registerClientDto.serviceProviderId,
        );

        if (!isLinked) {
          // Link to new SP
          await this.clientServiceProviderService.linkClientToServiceProvider(
            existingUser.id,
            registerClientDto.serviceProviderId,
          );
        }

        user = existingUser;
      } else {
        // User exists with different role
        throw new ConflictException(
          'Email already registered with a different account type',
        );
      }
    } else {
      // Create new user with CLIENT role
      const hashedPassword = await bcrypt.hash(registerClientDto.password, 10);

      user = this.usersRepository.create({
        email: registerClientDto.email,
        password: hashedPassword,
        firstName: registerClientDto.firstName,
        lastName: registerClientDto.lastName,
        role: Role.CLIENT,
      });

      user = await this.usersRepository.save(user);

      // Link to service provider
      await this.clientServiceProviderService.linkClientToServiceProvider(
        user.id,
        registerClientDto.serviceProviderId,
      );
    }

    const { password, ...result } = user;
    return {
      ...result,
      accessToken: this.generateToken(user.id, user.email, user.role),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password, ...result } = user;
    return {
      ...result,
      accessToken: this.generateToken(user.id, user.email, user.role),
    };
  }

  async requestPasswordReset(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    // Security: Don't reveal if email exists
    // Always return success message even if user doesn't exist
    if (!user) {
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate token
    const token = this.passwordResetService.generateToken();
    await this.passwordResetService.saveToken(user.id, token);

    // Build reset link
    const frontendUrl =
      this.configService.get<string>('frontend.url') ||
      'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    // Send email
    await this.emailService.sendPasswordResetEmail(
      user.email,
      resetLink,
      user.firstName || user.email,
    );

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    // Validate passwords match
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Validate token
    const resetToken = await this.passwordResetService.validateToken(
      resetPasswordDto.token,
    );

    // Hash new password
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    // Update user password
    await this.usersRepository.update(resetToken.userId, {
      password: hashedPassword,
    });

    // Mark token as used
    await this.passwordResetService.markTokenAsUsed(resetPasswordDto.token);

    return {
      message: 'Password has been reset successfully',
    };
  }

  private generateToken(userId: string, email: string, role: Role): string {
    const payload = { email, sub: userId, role };
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });
  }
}

