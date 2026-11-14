import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateInvoicePromptDto {
  @ApiProperty({
    example:
      'Invoice Acme Corp for 10 hours of backend NestJS development at $150/hr and $350 database optimization fee with Net 15 terms.',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;
}

export class PolishItemDto {
  @ApiProperty({ example: 'fixed the login bug and deployed to aws' })
  @IsString()
  @IsNotEmpty()
  rawDescription: string;
}

export class DraftReminderDto {
  @ApiProperty({ example: 'INV-2026-003' })
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiProperty({ example: 'Apex BioDynamics Ltd' })
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @ApiProperty({ example: 9500.0 })
  amountDue: number;

  @ApiProperty({ example: 9 })
  daysOverdue: number;

  @ApiProperty({ example: 'firm', enum: ['polite', 'firm', 'urgent'], default: 'firm' })
  @IsString()
  @IsOptional()
  tone?: 'polite' | 'firm' | 'urgent';
}

export class ParseReceiptDto {
  @ApiProperty({
    example:
      'AWS Cloud Services Invoice #99841 Date: 11/04/2026 Total: $450.00 Tax: $37.12 EC2 and RDS instances',
  })
  @IsString()
  @IsNotEmpty()
  receiptText: string;
}
