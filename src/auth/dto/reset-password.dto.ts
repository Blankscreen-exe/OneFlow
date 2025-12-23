import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'abc123def456...',
    description: 'Password reset token received via email',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'newSecurePassword123',
    description: 'New password (minimum 6 characters)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty()
  newPassword: string;

  @ApiProperty({
    example: 'newSecurePassword123',
    description: 'Confirm new password (must match newPassword)',
  })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}

