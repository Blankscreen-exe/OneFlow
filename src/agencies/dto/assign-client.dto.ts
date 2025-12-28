import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignClientDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  businessDeveloperId: string;

  @ApiProperty({ example: 'Assignment notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}




