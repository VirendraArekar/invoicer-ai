import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RecordPaymentDto {
  @ApiProperty({ example: 'inv_02' })
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({ example: 1500.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2026-11-14' })
  @IsDateString()
  @IsNotEmpty()
  paymentDate: string;

  @ApiProperty({ example: 'Bank Transfer (ACH)', default: 'Bank Transfer' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({ example: 'ACH-TRANS-88912', required: false })
  @IsString()
  @IsOptional()
  transactionReference?: string;

  @ApiProperty({ example: 'Second milestone payment received', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
