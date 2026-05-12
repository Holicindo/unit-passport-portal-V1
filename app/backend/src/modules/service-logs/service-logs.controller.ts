import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ServiceLogsService } from './service-logs.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('service-logs')
export class ServiceLogsController {
  constructor(private readonly serviceLogsService: ServiceLogsService) {}

  @Get()
  findAll() {
    return this.serviceLogsService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.serviceLogsService.create(body);
  }
}
