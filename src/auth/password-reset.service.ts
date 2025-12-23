import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { PasswordResetToken } from './entities/password-reset-token.entity';

@Injectable()
export class PasswordResetService {
  private readonly tokenExpiry: number;

  constructor(
    @InjectRepository(PasswordResetToken)
    private tokenRepository: Repository<PasswordResetToken>,
    private configService: ConfigService,
  ) {
    // Token expires in 1 hour by default (3600 seconds)
    this.tokenExpiry =
      parseInt(
        this.configService.get<string>('passwordReset.tokenExpiry') || '3600',
        10,
      ) * 1000; // Convert to milliseconds
  }

  /**
   * Generate a secure random token
   */
  generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Save a password reset token for a user
   */
  async saveToken(userId: string, token: string): Promise<PasswordResetToken> {
    // Invalidate any existing tokens for this user
    await this.tokenRepository.update(
      { userId, used: false },
      { used: true },
    );

    const expiresAt = new Date(Date.now() + this.tokenExpiry);

    const resetToken = this.tokenRepository.create({
      userId,
      token,
      expiresAt,
      used: false,
    });

    return this.tokenRepository.save(resetToken);
  }

  /**
   * Validate a password reset token
   */
  async validateToken(token: string): Promise<PasswordResetToken> {
    const resetToken = await this.tokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (resetToken.used) {
      throw new BadRequestException('This reset token has already been used');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('This reset token has expired');
    }

    return resetToken;
  }

  /**
   * Mark a token as used
   */
  async markTokenAsUsed(token: string): Promise<void> {
    await this.tokenRepository.update({ token }, { used: true });
  }

  /**
   * Clean up expired tokens (can be called by a cron job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.tokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }

  /**
   * Get token expiry time in seconds
   */
  getTokenExpirySeconds(): number {
    return this.tokenExpiry / 1000;
  }
}

