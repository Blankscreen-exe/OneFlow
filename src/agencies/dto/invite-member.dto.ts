import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AgencyRole } from '../../common/enums/agency-role.enum';

export class InviteMemberDto {
  @ApiProperty({ example: 'member@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: AgencyRole.BUSINESS_DEVELOPER,
    enum: AgencyRole,
    required: false,
    default: AgencyRole.BUSINESS_DEVELOPER,
  })
  @IsOptional()
  @IsEnum(AgencyRole)
  role?: AgencyRole;
}



