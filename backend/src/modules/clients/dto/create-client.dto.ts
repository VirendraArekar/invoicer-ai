import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ example: 'Acme Global Ventures' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'billing@acmeglobal.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+1 (415) 890-1234', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: '500 Market St, Floor 12', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'San Francisco', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'CA', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '94105', required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ example: 'United States', required: false, default: 'United States' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: 'US-92830192', required: false })
  @IsString()
  @IsOptional()
  taxNumber?: string;

  @ApiProperty({ example: 'Enterprise client with 15-day terms.', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'active', required: false, enum: ['active', 'inactive', 'archived'] })
  @IsString()
  @IsOptional()
  status?: string;
}

export class UpdateClientDto extends CreateClientDto {}
