import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IUser } from '../../common/interfaces/user.interface';

@ApiTags('Catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'List all products/services in catalog' })
  @ApiQuery({ name: 'search', required: false })
  async findAll(@CurrentUser() user: IUser, @Query('search') search?: string) {
    return this.catalogService.findAll(user.id, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single product/service by id' })
  async findOne(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.catalogService.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new catalog product/service' })
  async create(@CurrentUser() user: IUser, @Body() dto: CreateProductDto) {
    return this.catalogService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update catalog product/service' })
  async update(
    @CurrentUser() user: IUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalogService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product/service' })
  async remove(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.catalogService.remove(user.id, id);
  }
}
