import { Controller, Get, Param } from '@nestjs/common';
import { OwnershipService } from './ownership.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('ownership')
export class OwnershipController {
  constructor(private readonly ownershipService: OwnershipService) {}

  @Get('history/:unitId')
  findHistory(@Param('unitId') unitId: string) {
    return this.ownershipService.findHistoryByUnit(unitId);
  }
}
