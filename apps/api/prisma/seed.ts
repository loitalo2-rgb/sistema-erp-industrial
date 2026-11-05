import { PrismaClient } from '@prisma/client';
import {
  UserRole,
  ItemType,
  PartnerType,
  SaleOrderStatus,
  ProductionOrderStatus,
  FinancialType,
  FinancialStatus,
  DRECategory,
  StockMovementType,
} from '../src/common/enums';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function ensureInitialStock(
  itemId: string,
  lotNumber: string,
  quantity: number,
  expirationAt: Date | null,
) {
  const movementCount = await prisma.stockMovement.count({ where: { itemId } });
  if (movementCount > 0) return;

  const lot = await prisma.stockLot.upsert({
    where: { lotNumber_itemId: { lotNumber, itemId } },
    update: { quantity },
    create: { lotNumber, itemId, quantity, expirationAt },
  });

  await prisma.stockMovement.create({
    data: {
      itemId,
      stockLotId: lot.id,
      type: StockMovementType.ENTRADA_COMPRA,
      quantity,
      unitCost: 0,
      documentRef: 'SALDO-INICIAL',
    },
  });

  console.log(`Saldo inicial criado: ${quantity} un. do lote ${lotNumber}`);
}

async function main() {
  console.log('Iniciando seed do banco de dados ERP Industrial...');

  // 1. Criar usuário Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@erp.local' },
    update: {},
    create: {
      name: 'Administrador do Sistema',
      email: 'admin@erp.local',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log(`Usuário Admin configurado: ${admin.email}`);

  // 1.1 Usuários de demonstração para cada perfil (RBAC)
  const demoUsers: Array<{ name: string; email: string; password: string; role: UserRole }> = [
    { name: 'Engenharia de Produto', email: 'engenharia@erp.local', password: 'engenharia123', role: UserRole.ENGENHARIA },
    { name: 'Planejamento e Controle', email: 'pcp@erp.local', password: 'pcp123', role: UserRole.PCP },
    { name: 'Operador de Produção', email: 'operador@erp.local', password: 'operador123', role: UserRole.OPERADOR },
    { name: 'Analista de Compras', email: 'compras@erp.local', password: 'compras123', role: UserRole.COMPRAS },
    { name: 'Analista de Vendas', email: 'vendas@erp.local', password: 'vendas123', role: UserRole.VENDAS },
    { name: 'Analista Financeiro', email: 'financeiro@erp.local', password: 'financeiro123', role: UserRole.FINANCEIRO },
  ];

  for (const demo of demoUsers) {
    const password = await bcrypt.hash(demo.password, 10);
    await prisma.user.upsert({
      where: { email: demo.email },
      update: {},
      create: {
        name: demo.name,
        email: demo.email,
        password,
        role: demo.role,
      },
    });
    console.log(`Usuário ${demo.role} configurado: ${demo.email}`);
  }

  // 2. Criar Parceiros
  const cliente = await prisma.partner.upsert({
    where: { code: 'CLI-001' },
    update: {},
    create: {
      code: 'CLI-001',
      name: 'Indústria Metalúrgica Progresso Ltda',
      tradeName: 'Metalúrgica Progresso',
      docNumber: '12.345.678/0001-90',
      type: PartnerType.CLIENTE,
      email: 'contato@progresso.com.br',
      phone: '(11) 98765-4321',
      city: 'São Paulo',
      state: 'SP',
    },
  });

  const fornecedor = await prisma.partner.upsert({
    where: { code: 'FOR-001' },
    update: {},
    create: {
      code: 'FOR-001',
      name: 'Distribuidora de Aços Brasil S/A',
      tradeName: 'Aços Brasil',
      docNumber: '98.765.432/0001-10',
      type: PartnerType.FORNECEDOR,
      email: 'vendas@acosbrasil.com.br',
      phone: '(11) 3333-2222',
      city: 'Campinas',
      state: 'SP',
    },
  });

  // 3. Criar Itens (matérias-primas e produto acabado)
  const mpChapa = await prisma.item.upsert({
    where: { code: 'MP-CHAPA-01' },
    update: {},
    create: {
      code: 'MP-CHAPA-01',
      name: 'Chapa de Aço Carbono 2mm',
      type: ItemType.MATERIA_PRIMA,
      unit: 'KG',
      costPrice: 15.5,
      minStock: 500,
      leadTimeDays: 7,
    },
  });

  const mpParafuso = await prisma.item.upsert({
    where: { code: 'MP-PARAFUSO-M8' },
    update: {},
    create: {
      code: 'MP-PARAFUSO-M8',
      name: 'Parafuso Sextavado M8 x 25',
      type: ItemType.MATERIA_PRIMA,
      unit: 'UN',
      costPrice: 0.85,
      minStock: 2000,
      leadTimeDays: 3,
    },
  });

  const produtoAcabado = await prisma.item.upsert({
    where: { code: 'PA-ARMARIO-01' },
    update: {},
    create: {
      code: 'PA-ARMARIO-01',
      name: 'Armário Industrial Reforçado 2 Portas',
      type: ItemType.PRODUTO_ACABADO,
      unit: 'UN',
      costPrice: 320.0,
      salePrice: 680.0,
      minStock: 10,
      leadTimeDays: 5,
    },
  });

  // 4. Centros de Trabalho
  const ctCorte = await prisma.workCenter.upsert({
    where: { code: 'CT-CORTE' },
    update: {},
    create: {
      code: 'CT-CORTE',
      name: 'Corte a Laser e Dobra CNC',
      capacityPerHour: 20,
      costPerHour: 120.0,
    },
  });

  const ctMontagem = await prisma.workCenter.upsert({
    where: { code: 'CT-MONTAGEM' },
    update: {},
    create: {
      code: 'CT-MONTAGEM',
      name: 'Linha de Montagem e Fixação',
      capacityPerHour: 10,
      costPerHour: 80.0,
    },
  });

  // 5. Estrutura de Produto (BOM)
  const bom = await prisma.bOM.upsert({
    where: { code: 'BOM-ARMARIO-01' },
    update: {},
    create: {
      code: 'BOM-ARMARIO-01',
      productId: produtoAcabado.id,
      version: '1.0',
      description: 'Estrutura padrão para fabricação do armário',
      items: {
        create: [
          { componentId: mpChapa.id, quantity: 18.5, scrapRate: 3.0, order: 1 },
          { componentId: mpParafuso.id, quantity: 24, scrapRate: 1.0, order: 2 },
        ],
      },
    },
  });

  // 6. Roteiro de fabricação
  await prisma.routing.upsert({
    where: { code: 'RT-CORTE-ARM' },
    update: {},
    create: {
      code: 'RT-CORTE-ARM',
      name: 'Corte e Dobra da Chapa',
      itemId: produtoAcabado.id,
      workCenterId: ctCorte.id,
      sequence: 1,
      setupMinutes: 15,
      runTimeMinutes: 30,
      description: 'Corte a laser, dobra e preparação da estrutura',
    },
  });

  await prisma.routing.upsert({
    where: { code: 'RT-MONTAGEM-ARM' },
    update: {},
    create: {
      code: 'RT-MONTAGEM-ARM',
      name: 'Montagem e Fixação',
      itemId: produtoAcabado.id,
      workCenterId: ctMontagem.id,
      sequence: 2,
      setupMinutes: 10,
      runTimeMinutes: 15,
      description: 'Montagem final, fixação e inspeção',
    },
  });

  // 7. Saldo inicial de estoque
  await ensureInitialStock(
    mpChapa.id,
    'LT-2026-0881',
    120,
    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
  );
  await ensureInitialStock(
    mpParafuso.id,
    'LT-2026-0912',
    1500,
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  );

  // 8. Pedido de venda de demonstração
  const saleOrder = await prisma.saleOrder.upsert({
    where: { orderNumber: 'PED-2026-104' },
    update: {},
    create: {
      orderNumber: 'PED-2026-104',
      partnerId: cliente.id,
      status: SaleOrderStatus.APROVADO,
      totalAmount: 34000,
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: 'Pedido de homologação criado pelo seed.',
      items: {
        create: [
          {
            itemId: produtoAcabado.id,
            quantity: 50,
            unitPrice: 680,
            totalPrice: 34000,
          },
        ],
      },
    },
  });

  // 9. Ordem de produção de demonstração
  await prisma.productionOrder.upsert({
    where: { code: 'OP-2026-001' },
    update: {},
    create: {
      code: 'OP-2026-001',
      productId: produtoAcabado.id,
      saleOrderId: saleOrder.id,
      quantityPlanned: 50,
      status: ProductionOrderStatus.LIBERADA,
      startDate: new Date(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  // 10. Títulos financeiros e DRE de demonstração
  const dueDate30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const dueDate15 = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  await prisma.financialTransaction.upsert({
    where: { code: 'REC-PED-2026-104' },
    update: {},
    create: {
      code: 'REC-PED-2026-104',
      description: 'Recebimento Ref. Pedido de Venda PED-2026-104',
      type: FinancialType.RECEBER,
      status: FinancialStatus.PENDENTE,
      dreCategory: DRECategory.RECEITA_BRUTA,
      amount: 34000,
      dueDate: dueDate30,
      partnerId: cliente.id,
      saleOrderId: saleOrder.id,
    },
  });

  await prisma.financialTransaction.upsert({
    where: { code: 'IMP-PED-2026-104' },
    update: {},
    create: {
      code: 'IMP-PED-2026-104',
      description: 'Impostos e deduções sobre o pedido PED-2026-104',
      type: FinancialType.PAGAR,
      status: FinancialStatus.PENDENTE,
      dreCategory: DRECategory.DEDUCAO_RECEITA,
      amount: 3400,
      dueDate: dueDate30,
      partnerId: cliente.id,
      saleOrderId: saleOrder.id,
    },
  });

  await prisma.financialTransaction.upsert({
    where: { code: 'PAG-FOR-001' },
    update: {},
    create: {
      code: 'PAG-FOR-001',
      description: 'Compra de chapas e parafusos - Aços Brasil',
      type: FinancialType.PAGAR,
      status: FinancialStatus.PENDENTE,
      dreCategory: DRECategory.CUSTO_PRODUCAO_CPV,
      amount: 15000,
      dueDate: dueDate15,
      partnerId: fornecedor.id,
    },
  });

  await prisma.financialTransaction.upsert({
    where: { code: 'PAG-ALUGUEL-001' },
    update: {},
    create: {
      code: 'PAG-ALUGUEL-001',
      description: 'Aluguel do galpão industrial',
      type: FinancialType.PAGAR,
      status: FinancialStatus.PENDENTE,
      dreCategory: DRECategory.DESPESA_OPERACIONAL,
      amount: 8000,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.financialTransaction.upsert({
    where: { code: 'PAG-ENERGIA-001' },
    update: {},
    create: {
      code: 'PAG-ENERGIA-001',
      description: 'Energia elétrica da planta',
      type: FinancialType.PAGAR,
      status: FinancialStatus.PENDENTE,
      dreCategory: DRECategory.DESPESA_ADMINISTRATIVA,
      amount: 3500,
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`Seed finalizado: BOM ${bom.code}, pedido ${saleOrder.orderNumber}.`);
  console.log('ERP Industrial pronto para operação.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
