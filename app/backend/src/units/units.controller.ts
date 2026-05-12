import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { UnitsService } from './units.service';

@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  findAll() {
    return this.unitsService.findAll();
  }

  @Get('passport/:qr_token')
  findByQr(@Param('qr_token') qr_token: string) {
    return this.unitsService.findByQrToken(qr_token);
  }

  @Post()
  create(@Body() body: any) {
    return this.unitsService.create(body);
  }

  @Post(':id/transfer')
  transfer(
    @Param('id') id: string,
    @Body() body: { toClientId: string; reason: string; notes?: string },
  ) {
    return this.unitsService.transferOwnership(id, body.toClientId, body.reason, body.notes);
  }
}
