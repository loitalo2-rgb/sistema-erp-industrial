import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CadastrosModule } from './modules/cadastros/cadastros.module';
import { EngenhariaModule } from './modules/engenharia/engenharia.module';
import { MrpModule } from './modules/mrp/mrp.module';
import { ProducaoModule } from './modules/producao/producao.module';
import { EstoqueModule } from './modules/estoque/estoque.module';
import { VendasModule } from './modules/vendas/vendas.module';
import { FinanceiroModule } from './modules/financeiro/financeiro.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CadastrosModule,
    EngenhariaModule,
    MrpModule,
    ProducaoModule,
    EstoqueModule,
    VendasModule,
    FinanceiroModule,
  ],
})
export class AppModule {}
