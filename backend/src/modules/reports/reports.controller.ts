import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IUser } from '../../common/interfaces/user.interface';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('profit-loss')
  @ApiOperation({ summary: 'Get Profit & Loss financial statement' })
  async getProfitLoss(@CurrentUser() user: IUser) {
    return this.reportsService.getProfitLoss(user.id);
  }

  @Get('tax-summary')
  @ApiOperation({ summary: 'Get tax collected vs deductible expenses summary' })
  async getTaxSummary(@CurrentUser() user: IUser) {
    return this.reportsService.getTaxSummary(user.id);
  }

  @Get('aging-ar')
  @ApiOperation({ summary: 'Get Accounts Receivable Aging report (0-30, 31-60, 61-90, 90+ days)' })
  async getAgingAr(@CurrentUser() user: IUser) {
    return this.reportsService.getAgingAccountsReceivable(user.id);
  }

  @Get('export/invoices-csv')
  @ApiOperation({ summary: 'Export complete invoices ledger as CSV file' })
  async exportInvoicesCsv(@CurrentUser() user: IUser, @Res() res: Response) {
    const csv = await this.reportsService.exportInvoicesCsv(user.id);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="invoices-report-${new Date().toISOString().substring(0, 10)}.csv"`,
    });
    res.end(csv);
  }

  @Get('export/expenses-csv')
  @ApiOperation({ summary: 'Export complete expenses ledger as CSV file' })
  async exportExpensesCsv(@CurrentUser() user: IUser, @Res() res: Response) {
    const csv = await this.reportsService.exportExpensesCsv(user.id);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="expenses-report-${new Date().toISOString().substring(0, 10)}.csv"`,
    });
    res.end(csv);
  }
}
