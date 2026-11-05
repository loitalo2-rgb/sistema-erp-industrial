import { Module } from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';
import { RelatoriosController } from './relatorios.controller';
import { FinanceiroModule } from '../financeiro/financeiro.module';
import { EstoqueModule } from '../estoque/estoque.module';

@Module({
  imports: [FinanceiroModule, EstoqueModule],
  controllers: [RelatoriosController],
  providers: [RelatoriosService],
})
export class RelatoriosModule {}
