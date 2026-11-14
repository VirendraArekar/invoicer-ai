import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IUser } from '../../common/interfaces/user.interface';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'List and filter expenses' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @CurrentUser() user: IUser,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.expensesService.findAll(user.id, { category, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single expense details' })
  async findOne(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.expensesService.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Record a new business expense' })
  async create(@CurrentUser() user: IUser, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user.id, dto);
  }

  @Post('upload-receipt')
  @ApiOperation({ summary: 'Upload receipt file via Multer' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(16)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadReceipt(
    @CurrentUser() user: IUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return {
      success: true,
      filename: file ? file.filename : 'receipt.pdf',
      url: file ? `/uploads/${file.filename}` : '/uploads/receipt.pdf',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update expense' })
  async update(
    @CurrentUser() user: IUser,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense' })
  async remove(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.expensesService.remove(user.id, id);
  }
}
