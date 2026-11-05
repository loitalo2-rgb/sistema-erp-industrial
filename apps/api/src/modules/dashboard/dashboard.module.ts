import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { EstoqueModule } from '../estoque/estoque.module';
import { FinanceiroModule } from '../financeiro/financeiro.module';

@Module({
  imports: [EstoqueModule, FinanceiroModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
