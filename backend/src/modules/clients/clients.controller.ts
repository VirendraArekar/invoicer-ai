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
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IUser } from '../../common/interfaces/user.interface';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'List all clients for authenticated user' })
  @ApiQuery({ name: 'search', required: false })
  async findAll(@CurrentUser() user: IUser, @Query('search') search?: string) {
    return this.clientsService.findAll(user.id, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client details by id' })
  async findOne(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.clientsService.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  async create(@CurrentUser() user: IUser, @Body() dto: CreateClientDto) {
    return this.clientsService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client details' })
  async update(
    @CurrentUser() user: IUser,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete client' })
  async remove(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.clientsService.remove(user.id, id);
  }
}
