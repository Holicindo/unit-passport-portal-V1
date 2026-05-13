import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferOwnershipDto {
  @ApiProperty({ example: 'CLI-XXXXXXX', description: 'ID of the destination client' })
  @IsString()
  @IsNotEmpty()
  toClientId!: string;

  @ApiProperty({ example: 'Sold to new owner', description: 'Reason for transfer' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiProperty({ example: 'Maintenance records included', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
