import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { WarrantiesService } from './warranties.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('warranties')
@Controller('warranties')
export class WarrantiesController {
  constructor(private readonly warrantiesService: WarrantiesService) {}

  @Get()
  findAll() {
    return this.warrantiesService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.warrantiesService.create(body);
  }
}
