import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { OwnershipService } from './ownership.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('ownership')
@Controller('ownership')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.CLIENT, UserRole.PARTNER)
@ApiBearerAuth()
export class OwnershipController {
  constructor(private readonly ownershipService: OwnershipService) {}

  @Get('history/:unitId')
  findHistory(@Param('unitId') unitId: string) {
    return this.ownershipService.findHistoryByUnit(unitId);
  }
}
