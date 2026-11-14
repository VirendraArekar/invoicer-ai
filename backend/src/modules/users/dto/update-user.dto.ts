import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'Alex Rivera', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Nexus Cloud Technologies Inc.', required: false })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({ example: 'USD', required: false })
  @IsString()
  @IsOptional()
  currency?: string;
}
