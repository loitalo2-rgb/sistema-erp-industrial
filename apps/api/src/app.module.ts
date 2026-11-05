import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CadastrosModule } from './modules/cadastros/cadastros.module';
import { EngenhariaModule } from './modules/engenharia/engenharia.module';
import { MrpModule } from './modules/mrp/mrp.module';
import { ProducaoModule } from './modules/producao/producao.module';
import { EstoqueModule } from './modules/estoque/estoque.module';
import { VendasModule } from './modules/vendas/vendas.module';
import { FinanceiroModule } from './modules/financeiro/financeiro.module';
import { ComprasModule } from './modules/compras/compras.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { RelatoriosModule } from './modules/relatorios/relatorios.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { JwtAuthGuard, RolesGuard } from './modules/auth/guards';
import { AuditInterceptor } from './common/audit.interceptor';

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
    ComprasModule,
    FinanceiroModule,
    DashboardModule,
    RelatoriosModule,
    UsuariosModule,
    AuditoriaModule,
  ],
  providers: [
    // Autenticação JWT e RBAC aplicados globalmente.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // Registra automaticamente toda operação de escrita na auditoria.
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
