
import { db } from "../db";
import {
  tenants, users, plans, productCategories, productSubcategories, productBase,
  products, suppliers, manufacturers, clients, entryCertificates,
  entryCertificateResults, issuedCertificates, productFiles, productBaseFiles,
  productCharacteristics, moduleFeatures, modules, planModules,
  issuanceQueue, productMappings, invoiceItems, invoices
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPasswordMock(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

const MOCK_TENANT_CNPJ = "00.000.000/0001-99";
const MOCK_TENANT_NAME = "Empresa Mock de Testes Ltda";

// Helper para escolher item aleatório de array
function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Helper para gerar número aleatório entre min e max
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper para gerar float aleatório
function getRandomFloat(min: number, max: number, decimals: number = 2): string {
  return (Math.random() * (max - min) + min).toFixed(decimals);
}

// Helper de nomes para geração
const companyPrefixes = ["Indústria", "Comércio", "Distribuidora", "Logística", "Importadora"];
const companySuffixes = ["Ltda", "SA", "ME", "Eireli", "Group"];
const chemicalNames = ["Ácido", "Sulfato", "Cloreto", "Hidróxido", "Carbonato", "Nitrato", "Acetato", "Óxido"];
const chemicaSuffixes = ["de Sódio", "de Potássio", "de Cálcio", "de Magnésio", "de Ferro", "de Cobre", "de Zinco", "de Alumínio"];
const categoriesList = ["Químicos", "Solventes", "Ácidos", "Bases", "Sais", "Óxidos", "Metais", "Plásticos", "Polímeros", "Resinas", "Corantes", "Pigmentos", "Aditivos", "Catalisadores", "Lubrificantes"];

export async function clearMockData() {
  console.log("Iniciando limpeza de dados mock...");

  const mockTenant = await db.query.tenants.findFirst({
    where: eq(tenants.cnpj, MOCK_TENANT_CNPJ)
  });

  if (!mockTenant) {
    console.log("Tenant mock não encontrado. Nada a limpar.");
    return { message: "Nenhum dado mock encontrado para limpar." };
  }

  const tenantId = mockTenant.id;

  // Novas tabelas (ordem de dependência: filhos primeiro)
  await db.delete(issuanceQueue).where(eq(issuanceQueue.tenantId, tenantId));
  await db.delete(productMappings).where(eq(productMappings.tenantId, tenantId));
  // Invoice Items não tem tenantId direto, mas deletamos via join ou cascade. 
  // Na verdade, invoiceItems depende de invoices que tem tenantId. 
  // Melhor deletar invoices e deixar o banco lidar com cascade OU deletar manualmente.
  // Como não temos garantia de Cascade no DB configurado via drizzle se não for definido, vamos deletar manualmente.

  // Para deletar invoiceItems, precisamos dos IDs das invoices do tenant.
  const tenantInvoices = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.tenantId, tenantId));
  if (tenantInvoices.length > 0) {
    const invoiceIds = tenantInvoices.map(i => i.id);
    // Drizzle doesn't support "inArray" delete directly easily without importing 'inArray'.
    // Vamos iterar ou usar sql delete.
    // Ou melhor, deletar invoices que o Drizzle deve saber lidar se configurado? Não.

    // Vamos tentar deletar invoices direto. Se der erro de FK no invoiceItems, precisamos deletar itens antes.
    // Como não importei 'inList' ou 'inArray', vou fazer loop ou query bruta se necessário.
    // Mas espere, invoices e invoiceItems são tabelas novas. O mock data gera invoices?
    // O codigo de generateMockData NÃO gera invoices.
    // ENTÃO, se existem invoices, são frutos de importação manual do usuário no tenant mock.
    // O usuário pode ter importado XMLs no tenant mock.

    // Delete invoiceItems via subquery logic ou loop.
    for (const inv of tenantInvoices) {
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, inv.id));
    }
    await db.delete(invoices).where(eq(invoices.tenantId, tenantId));
  }

  await db.delete(issuedCertificates).where(eq(issuedCertificates.tenantId, tenantId));
  await db.delete(entryCertificateResults).where(eq(entryCertificateResults.tenantId, tenantId));
  await db.delete(entryCertificates).where(eq(entryCertificates.tenantId, tenantId));
  await db.delete(productFiles).where(eq(productFiles.tenantId, tenantId));
  await db.delete(productBaseFiles).where(eq(productBaseFiles.tenantId, tenantId));
  await db.delete(productCharacteristics).where(eq(productCharacteristics.tenantId, tenantId));
  await db.delete(products).where(eq(products.tenantId, tenantId));
  await db.delete(productBase).where(eq(productBase.tenantId, tenantId));
  await db.delete(productSubcategories).where(eq(productSubcategories.tenantId, tenantId));
  await db.delete(productCategories).where(eq(productCategories.tenantId, tenantId));
  await db.delete(suppliers).where(eq(suppliers.tenantId, tenantId));
  await db.delete(manufacturers).where(eq(manufacturers.tenantId, tenantId));
  await db.delete(clients).where(eq(clients.tenantId, tenantId));
  await db.delete(users).where(eq(users.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));

  console.log("Dados mock limpos com sucesso.");
  return { message: "Dados mock removidos com sucesso." };
}

export async function generateMockData() {
  console.log("Iniciando geração de dados mock de alto volume...");

  const existingTenant = await db.query.tenants.findFirst({
    where: eq(tenants.cnpj, MOCK_TENANT_CNPJ)
  });

  if (existingTenant) {
    throw new Error("Dados mock já existem. Por favor, limpe os dados antes de gerar novamente.");
  }

  const plan = await db.query.plans.findFirst({
    where: eq(plans.code, "C")
  });

  if (!plan) {
    throw new Error("Plano 'C' (Completo) não encontrado. Execute o seed do banco de dados primeiro.");
  }

  // 1. Criar Tenant
  const [tenant] = await db.insert(tenants).values({
    name: MOCK_TENANT_NAME,
    cnpj: MOCK_TENANT_CNPJ,
    address: "Rua dos Testes, 123 - Cidade Mock, MT",
    phone: "(11) 99999-9999",
    planId: plan.id,
    active: true,
    paymentStatus: "active",
    planStartDate: new Date().toISOString(),
  }).returning();

  // 2. Criar Usuário Admin Mock
  const passwordHash = await hashPasswordMock("mock123");
  await db.insert(users).values({
    username: "admin_mock",
    password: passwordHash,
    name: "Administrador Mock",
    role: "admin",
    tenantId: tenant.id,
    active: true
  });

  // 3. Categorias e Subcategorias (15 Cats, 25 Subcats)
  console.log("Gerando categorias e subcategorias...");
  const createdCategories = [];
  const createdSubcategories = [];

  for (let i = 0; i < 15; i++) {
    const catName = categoriesList[i] || `Categoria ${i + 1}`;
    const [cat] = await db.insert(productCategories).values({
      name: catName,
      description: `Descrição da categoria ${catName}`,
      tenantId: tenant.id
    }).returning();
    createdCategories.push(cat);
  }

  for (let i = 0; i < 25; i++) {
    const parentCat = getRandomItem(createdCategories);
    const [sub] = await db.insert(productSubcategories).values({
      name: `${parentCat.name} - Tipo ${getRandomInt(1, 5)}`,
      categoryId: parentCat.id,
      tenantId: tenant.id
    }).returning();
    createdSubcategories.push(sub);
  }

  // 4. Produtos Base (40)
  console.log("Gerando produtos base...");
  const createdBaseProducts = [];

  for (let i = 0; i < 40; i++) {
    const sub = getRandomItem(createdSubcategories);
    const techName = `${getRandomItem(chemicalNames)} ${getRandomItem(chemicaSuffixes)}`;

    const [base] = await db.insert(productBase).values({
      technicalName: techName,
      commercialName: `Comercial ${techName}`,
      subcategoryId: sub.id,
      defaultMeasureUnit: "kg",
      riskClass: getRandomInt(1, 9).toString(),
      unNumber: getRandomInt(1000, 3000).toString(),
      tenantId: tenant.id
    }).returning();
    createdBaseProducts.push(base);
  }

  // 5. Produtos Variantes (80)
  console.log("Gerando variantes...");
  const createdProducts = [];

  for (let i = 0; i < 80; i++) {
    const base = getRandomItem(createdBaseProducts);
    const weight = getRandomInt(10, 200);

    const [prod] = await db.insert(products).values({
      baseProductId: base.id,
      technicalName: base.technicalName,
      commercialName: `${base.commercialName} - ${weight}kg`,
      sku: `PROD-${base.id}-${i}`,
      defaultMeasureUnit: "kg",
      netWeight: weight.toString(),
      tenantId: tenant.id
    }).returning();
    createdProducts.push(prod);
  }

  // 6. Parceiros (5 Fabricantes, 8 Fornecedores, 10 Clientes)
  console.log("Gerando parceiros...");
  const createdManufacturers = [];
  const createdSuppliers = [];
  const createdClients = [];

  for (let i = 0; i < 5; i++) {
    const [m] = await db.insert(manufacturers).values({
      name: `${getRandomItem(companyPrefixes)} Fab ${i + 1} ${getRandomItem(companySuffixes)}`,
      country: i === 0 ? "Brasil" : (Math.random() > 0.5 ? "China" : "Alemanha"),
      tenantId: tenant.id
    }).returning();
    createdManufacturers.push(m);
  }

  for (let i = 0; i < 8; i++) {
    const [s] = await db.insert(suppliers).values({
      name: `${getRandomItem(companyPrefixes)} Forn ${i + 1} ${getRandomItem(companySuffixes)}`,
      cnpj: `10.${getRandomInt(100, 999)}.${getRandomInt(100, 999)}/0001-${getRandomInt(10, 99)}`,
      tenantId: tenant.id,
      address: `Rua Indústria, ${i * 100}`
    }).returning();
    createdSuppliers.push(s);
  }

  for (let i = 0; i < 10; i++) {
    const [c] = await db.insert(clients).values({
      name: `Cliente ${i + 1} ${getRandomItem(companySuffixes)}`,
      cnpj: `20.${getRandomInt(100, 999)}.${getRandomInt(100, 999)}/0001-${getRandomInt(10, 99)}`,
      tenantId: tenant.id,
      address: `Av Comércio, ${i * 50}`
    }).returning();
    createdClients.push(c);
  }

  // 7. Certificados de Entrada (~20)
  console.log("Gerando certificados de entrada...");
  const createdEntryCerts = [];

  for (let i = 0; i < 20; i++) {
    const prod = getRandomItem(createdProducts);
    const supplier = getRandomItem(createdSuppliers);
    const manufacturer = getRandomItem(createdManufacturers);

    // 96% Chance of Aprovado
    const isApproved = Math.random() > 0.04;
    const status = isApproved ? "Aprovado" : "Reprovado";

    // Tuning for ~30% remaining stock
    const qty = getRandomInt(500, 2000);

    const [cert] = await db.insert(entryCertificates).values({
      supplierId: supplier.id,
      manufacturerId: manufacturer.id,
      productId: prod.id,
      tenantId: tenant.id,
      referenceDocument: `NF-${getRandomInt(10000, 99999)}`,
      entryDate: new Date(Date.now() - getRandomInt(1, 30) * 24 * 60 * 60 * 1000).toISOString(),
      receivedQuantity: qty.toString(),
      measureUnit: "kg",
      packageType: Math.random() > 0.5 ? "Tambor" : "Saco",
      supplierLot: `LOT-${getRandomInt(1000, 9999)}`,
      internalLot: `INT-${2024}-${getRandomInt(1000, 9999)}`,
      manufacturingDate: new Date(Date.now() - getRandomInt(60, 120) * 24 * 60 * 60 * 1000).toISOString(),
      expirationDate: new Date(Date.now() + getRandomInt(180, 360) * 24 * 60 * 60 * 1000).toISOString(),
      inspectionDate: new Date().toISOString(),
      status: status
    }).returning();
    createdEntryCerts.push(cert);

    // Results Generation
    // Pureza: Min 99.0%
    // Umidade: Max 0.5%

    let purezaValue: string;
    let umidadeValue: string;

    if (isApproved) {
      // Generate valid values
      purezaValue = getRandomFloat(99.0, 99.99);
      umidadeValue = getRandomFloat(0.01, 0.5);
    } else {
      // Generate INVALID values (at least one)
      if (Math.random() > 0.5) {
        // Fail Pureza (Low)
        purezaValue = getRandomFloat(90.0, 98.9);
        umidadeValue = getRandomFloat(0.01, 0.5); // Valid
      } else {
        // Fail Umidade (High)
        purezaValue = getRandomFloat(99.0, 99.99); // Valid
        umidadeValue = getRandomFloat(0.51, 2.0);
      }
    }

    await db.insert(entryCertificateResults).values([
      {
        entryCertificateId: cert.id,
        tenantId: tenant.id,
        characteristicName: "Pureza",
        unit: "%",
        minValue: "99.0",
        obtainedValue: purezaValue,
        analysisMethod: "GC"
      },
      {
        entryCertificateId: cert.id,
        tenantId: tenant.id,
        characteristicName: "Umidade",
        unit: "%",
        maxValue: "0.5",
        obtainedValue: umidadeValue,
        analysisMethod: "Karl Fischer"
      }
    ]);
  }

  // 8. Certificados Emitidos (~40)
  console.log("Gerando certificados emitidos...");

  for (let i = 0; i < 40; i++) {
    const entryCert = getRandomItem(createdEntryCerts);
    const client = getRandomItem(createdClients);

    // Tuning for ~30% remaining stock
    const soldQty = getRandomInt(300, 600);

    await db.insert(issuedCertificates).values({
      entryCertificateId: entryCert.id,
      clientId: client.id,
      tenantId: tenant.id,
      invoiceNumber: `V-${getRandomInt(50000, 99999)}`,
      issueDate: new Date().toISOString(),
      soldQuantity: soldQty.toString(),
      measureUnit: "kg",
      customLot: `${entryCert.internalLot}/S${i}`,
      showSupplierInfo: Math.random() > 0.8 // 20% chance to show supplier info
    });
  }

  return {
    message: `Dados mock gerados com sucesso! 
    Tenant: ${tenant.name}
    Produtos: ${createdProducts.length}
    Boletins Entrada: ${createdEntryCerts.length}
    Boletins Saída: 40
    (Status corrigidos para PT-BR e lógica de aprovação consistente)
    `,
    tenantId: tenant.id
  };
}
