import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class AddNoteDto {
  @ApiProperty({
    description: 'Note title',
    example: 'Client Meeting',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Note description',
    example: 'Discussed project requirements and timeline',
    maxLength: 2000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

