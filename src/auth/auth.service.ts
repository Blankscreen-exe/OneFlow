import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
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
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    const { password, ...result } = user;
    return {
      ...result,
      accessToken: this.generateToken(user.id, user.email),
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
      accessToken: this.generateToken(user.id, user.email),
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

  private generateToken(userId: string, email: string): string {
    const payload = { email, sub: userId };
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });
  }
}

