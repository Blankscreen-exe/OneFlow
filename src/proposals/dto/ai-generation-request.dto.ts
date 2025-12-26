import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AIGenerationRequestDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Client UUID',
  })
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({
    example: 'I need a proposal for a website redesign project. The client wants a modern, responsive website with e-commerce functionality.',
    description: 'Prompt describing what proposal to generate',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;
}

