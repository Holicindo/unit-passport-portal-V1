import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthScoreService } from './health-score.service';

@ApiTags('Health Score')
@Controller('health-scores')
export class HealthScoreController {
  constructor(private readonly healthScoreService: HealthScoreService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get all latest health scores for active units' })
  async getActiveHealthScores() {
    return this.healthScoreService.getActiveHealthScores();
  }

  @Get('unit/:unitId')
  @ApiOperation({ summary: 'Get latest health score for a specific unit by internal ID' })
  async getUnitHealthScore(@Param('unitId') unitId: string) {
    return this.healthScoreService.getUnitHealthScore(unitId);
  }

  @Post('trigger')
  @ApiOperation({ summary: 'Manually trigger health score calculation for all active units (admin use)' })
  async triggerCalculation() {
    await this.healthScoreService.calculateV4HealthScore();
    return { message: 'Health score calculation triggered successfully.' };
  }

  @Post('trigger/:unitId')
  @ApiOperation({ summary: 'Manually trigger health score calculation for a specific unit' })
  async triggerUnitCalculation(@Param('unitId') unitId: string) {
    const result = await this.healthScoreService.calculateSingleUnitHealth(unitId);
    return { message: 'Unit health score calculated successfully.', data: result };
  }
}
