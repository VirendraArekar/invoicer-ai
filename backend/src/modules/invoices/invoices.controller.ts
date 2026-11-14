import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IUser } from '../../common/interfaces/user.interface';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List and filter invoices' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @CurrentUser() user: IUser,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('search') search?: string,
  ) {
    return this.invoicesService.findAll(user.id, { status, clientId, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full invoice by id including items and payments' })
  async findOne(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.invoicesService.findOne(user.id, id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Generate and stream high-quality PDF for invoice' })
  async downloadPdf(
    @CurrentUser() user: IUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.invoicesService.generatePdf(user.id, id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new invoice with line items' })
  async create(@CurrentUser() user: IUser, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update invoice and recalculate totals' })
  async update(
    @CurrentUser() user: IUser,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(user.id, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update invoice status directly (e.g. mark as sent, paid)' })
  async updateStatus(
    @CurrentUser() user: IUser,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.invoicesService.updateStatus(user.id, id, status);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Clone/duplicate invoice to a new draft' })
  async duplicate(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.invoicesService.duplicate(user.id, id);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Simulate sending invoice via email' })
  async sendEmail(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.invoicesService.sendInvoiceEmail(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete invoice' })
  async remove(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.invoicesService.remove(user.id, id);
  }
}
