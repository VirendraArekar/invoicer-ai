import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Software & Cloud' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Amazon Web Services' })
  @IsString()
  @IsNotEmpty()
  vendor: string;

  @ApiProperty({ example: 450.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 37.12, required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  taxAmount?: number;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isTaxDeductible?: boolean;

  @ApiProperty({ example: '2026-11-10' })
  @IsDateString()
  @IsNotEmpty()
  expenseDate: string;

  @ApiProperty({ example: 'Production database instances and GPU staging', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'cli_01', required: false })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiProperty({ example: '', required: false })
  @IsString()
  @IsOptional()
  receiptUrl?: string;
}

export class UpdateExpenseDto extends CreateExpenseDto {}
