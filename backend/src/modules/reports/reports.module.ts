import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { CsvService } from './csv.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, CsvService],
  exports: [ReportsService, CsvService],
})
export class ReportsModule {}
