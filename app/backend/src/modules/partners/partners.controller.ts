import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  findAll() {
    return this.partnersService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.partnersService.create(body);
  }
}
