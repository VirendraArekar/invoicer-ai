import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({ example: 'Nexus Cloud Technologies Inc.', required: false })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({ example: 'billing@nexuscloud.io', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+1 (555) 234-5678', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'https://nexuscloud.io', required: false })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({ example: 'US-849203918-TX', required: false })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiProperty({ example: '100 Innovation Way, Suite 400', required: false })
  @IsString()
  @IsOptional()
  addressLine1?: string;

  @ApiProperty({ example: 'Floor 4', required: false })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ example: 'Austin', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'TX', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '78701', required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ example: 'United States', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: '', required: false })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ example: 'USD', required: false })
  @IsString()
  @IsOptional()
  defaultCurrency?: string;

  @ApiProperty({ example: 8.25, required: false })
  @IsNumber()
  @IsOptional()
  defaultTaxRate?: number;

  @ApiProperty({ example: 'Net 30', required: false })
  @IsString()
  @IsOptional()
  defaultPaymentTerms?: string;

  @ApiProperty({ example: 'Thank you for your business!', required: false })
  @IsString()
  @IsOptional()
  invoiceNotesTemplate?: string;
}
