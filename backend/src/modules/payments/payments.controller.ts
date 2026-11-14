import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IUser } from '../../common/interfaces/user.interface';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all payment transactions' })
  async findAll(@CurrentUser() user: IUser) {
    return this.paymentsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment transaction receipt details' })
  async findOne(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.paymentsService.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Record payment against an invoice' })
  async record(@CurrentUser() user: IUser, @Body() dto: RecordPaymentDto) {
    return this.paymentsService.record(user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment transaction and restore invoice balance' })
  async remove(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.paymentsService.remove(user.id, id);
  }
}
