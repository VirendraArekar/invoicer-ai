import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Senior AI Engineering' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Custom full-stack AI development per hour', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'DEV-AI-SR', required: false })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({ example: 160.0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: 8.25, required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @ApiProperty({ example: 'Development', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'hour', required: false, default: 'unit' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateProductDto extends CreateProductDto {}
