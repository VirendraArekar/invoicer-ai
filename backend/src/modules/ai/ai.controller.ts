import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import {
  DraftReminderDto,
  GenerateInvoicePromptDto,
  ParseReceiptDto,
  PolishItemDto,
} from './dto/ai-requests.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IUser } from '../../common/interfaces/user.interface';

@ApiTags('AI Features')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-invoice')
  @ApiOperation({ summary: 'Generate structured invoice from natural language prompt' })
  async generateInvoice(
    @CurrentUser() user: IUser,
    @Body() dto: GenerateInvoicePromptDto,
  ) {
    return this.aiService.generateInvoiceFromPrompt(user.id, dto);
  }

  @Post('polish-item')
  @ApiOperation({ summary: 'Polish invoice line item description with professional scope' })
  async polishItem(@Body() dto: PolishItemDto) {
    return this.aiService.polishItemDescription(dto);
  }

  @Post('draft-reminder')
  @ApiOperation({ summary: 'Draft automated late payment reminder email with tone control' })
  async draftReminder(@Body() dto: DraftReminderDto) {
    return this.aiService.draftReminderEmail(dto);
  }

  @Get('financial-insights')
  @ApiOperation({ summary: 'Generate AI financial health score, cash flow forecast, and actionable advice' })
  async getInsights(@CurrentUser() user: IUser) {
    return this.aiService.getFinancialInsights(user.id);
  }

  @Post('parse-receipt')
  @ApiOperation({ summary: 'Extract structured vendor, date, amount, and tax from receipt text' })
  async parseReceipt(@Body() dto: ParseReceiptDto) {
    return this.aiService.parseReceiptText(dto);
  }
}
