import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class InvoiceItemDto {
  @ApiProperty({ example: 'Senior AI Engineering - 10 hours' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 10, default: 1 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ example: 160.0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: 8.25, required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @ApiProperty({ example: 'prd_01', required: false })
  @IsString()
  @IsOptional()
  productId?: string;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: 'cli_01' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ example: 'INV-2026-005', required: false })
  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @ApiProperty({ example: '2026-11-15' })
  @IsDateString()
  @IsNotEmpty()
  issueDate: string;

  @ApiProperty({ example: '2026-12-15' })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiProperty({ type: [InvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiProperty({ example: 'percentage', enum: ['none', 'percentage', 'fixed'], required: false })
  @IsString()
  @IsOptional()
  discountType?: 'none' | 'percentage' | 'fixed';

  @ApiProperty({ example: 5, required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  discountValue?: number;

  @ApiProperty({ example: 8.25, required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @ApiProperty({ example: 'USD', required: false, default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: 'Payment due within 30 days via ACH wire or Stripe.', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'Net 30 Days. Late fees apply at 1.5% per month.', required: false })
  @IsString()
  @IsOptional()
  terms?: string;

  @ApiProperty({ example: 'draft', enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'], required: false })
  @IsString()
  @IsOptional()
  status?: string;
}

export class UpdateInvoiceDto extends CreateInvoiceDto {}
