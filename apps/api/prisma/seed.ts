import { PrismaClient } from '@prisma/client';
import { UserRole, ItemType, PartnerType } from '../src/common/enums';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

  // 3. Criar Itens (Matérias-primas e Produto Acabado)
  const mpChapa = await prisma.item.upsert({
    where: { code: 'MP-CHAPA-01' },
    update: {},
    create: {
      code: 'MP-CHAPA-01',
      name: 'Chapa de Aço Carbono 2mm',
      type: ItemType.MATERIA_PRIMA,
      unit: 'KG',
      costPrice: 15.50,
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
      costPrice: 320.00,
      salePrice: 680.00,
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
      costPerHour: 120.00,
    },
  });

  const ctMontagem = await prisma.workCenter.upsert({
    where: { code: 'CT-MONTAGEM' },
    update: {},
    create: {
      code: 'CT-MONTAGEM',
      name: 'Linha de Montagem e Fixação',
      capacityPerHour: 10,
      costPerHour: 80.00,
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

  console.log('Seed do ERP Industrial finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
