
import "dotenv/config";
import { db } from "../server/db";
import { plans, modules, moduleFeatures, planModules } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
    console.log("Seeding database...");

    // 1. Plans
    console.log("Seeding Plans...");
    const plansData = [
        { code: "A", name: "Plano Básico", description: "Funcionalidades essenciais", price: "99.90", storageLimit: 1000, maxUsers: 5 },
        { code: "B", name: "Plano Intermediário", description: "Funcionalidades avançadas", price: "199.90", storageLimit: 5000, maxUsers: 15 },
        { code: "C", name: "Plano Completo", description: "Todas as funcionalidades", price: "399.90", storageLimit: 20000, maxUsers: 50 },
    ];

    for (const plan of plansData) {
        const existing = await db.select().from(plans).where(eq(plans.code, plan.code));
        if (existing.length === 0) {
            await db.insert(plans).values(plan);
            console.log(`Plan ${plan.name} created.`);
        }
    }

    // 2. Modules
    console.log("Seeding Modules...");
    const modulesData = [
        { code: "core", name: "Core", description: "Funcionalidades básicas do sistema", isCore: true },
        { code: "products", name: "Produtos", description: "Gerenciamento completo de produtos", isCore: false },
        { code: "certificates", name: "Certificados", description: "Gerenciamento básico de certificados", isCore: false },
        { code: "certificates_advanced", name: "Certificados Avançados", description: "Recursos avançados de certificados", isCore: false },
        { code: "traceability", name: "Rastreabilidade", description: "Sistema de rastreabilidade completo", isCore: false },
        { code: "analytics", name: "Análises", description: "Relatórios e dashboards avançados", isCore: false },
        { code: "multi_user", name: "Multi-usuário", description: "Permissões de usuários avançadas", isCore: false },
        { code: "api", name: "API", description: "Acesso à API do sistema", isCore: false },
    ];

    for (const module of modulesData) {
        const existing = await db.select().from(modules).where(eq(modules.code, module.code));
        if (existing.length === 0) {
            await db.insert(modules).values(module);
            console.log(`Module ${module.name} created.`);
        }
    }

    // Reload modules to get IDs
    const dbModules = await db.select().from(modules);
    const getModuleId = (code: string) => dbModules.find(m => m.code === code)?.id;

    // 3. Module Features
    console.log("Seeding Module Features...");
    const featuresData = [
        // Core
        { moduleCode: "core", featurePath: "/api/user", featureName: "Perfil de Usuário", description: "Acesso ao perfil do usuário atual" },
        { moduleCode: "core", featurePath: "/api/files*", featureName: "Arquivos Básicos", description: "Acesso a arquivos gerais do sistema" },

        // Products
        { moduleCode: "products", featurePath: "/api/products*", featureName: "Produtos", description: "Gerenciamento de produtos" },
        { moduleCode: "products", featurePath: "/api/product-categories*", featureName: "Categorias", description: "Gerenciamento de categorias" },
        { moduleCode: "products", featurePath: "/api/product-subcategories*", featureName: "Subcategorias", description: "Gerenciamento de subcategorias" },
        { moduleCode: "products", featurePath: "/api/product-base*", featureName: "Produtos Base", description: "Gerenciamento de produtos base" },
        { moduleCode: "products", featurePath: "/api/manufacturers*", featureName: "Fabricantes", description: "Gerenciamento de fabricantes" },
        { moduleCode: "products", featurePath: "/api/suppliers*", featureName: "Fornecedores", description: "Gerenciamento de fornecedores" },
        { moduleCode: "products", featurePath: "/api/package-types*", featureName: "Tipos de Embalagem", description: "Gerenciamento de tipos de embalagem" },

        // Certificates
        { moduleCode: "certificates", featurePath: "/api/entry-certificates*", featureName: "Boletins de Entrada", description: "Gerenciamento de boletins de entrada" },
        { moduleCode: "certificates", featurePath: "/api/entry-certificates/*/results*", featureName: "Resultados de Entrada", description: "Gerenciamento de resultados de testes" },
        { moduleCode: "certificates", featurePath: "/api/certificates/view*", featureName: "Visualização de Certificados", description: "Visualização de certificados em HTML/PDF" },

        // Certificates Advanced
        { moduleCode: "certificates_advanced", featurePath: "/api/issued-certificates*", featureName: "Boletins Emitidos", description: "Gerenciamento de boletins emitidos" },
        { moduleCode: "certificates_advanced", featurePath: "/api/certificates/bulk*", featureName: "Processamento em Lote", description: "Processamento em lote de certificados" },

        // Traceability
        { moduleCode: "traceability", featurePath: "/api/clients*", featureName: "Clientes", description: "Gerenciamento de clientes" },
        { moduleCode: "traceability", featurePath: "/api/traceability*", featureName: "Rastreabilidade", description: "Sistema de rastreabilidade" },

        // Analytics
        { moduleCode: "analytics", featurePath: "/api/reports*", featureName: "Relatórios", description: "Geração de relatórios" },
        { moduleCode: "analytics", featurePath: "/api/dashboard/stats*", featureName: "Estatísticas do Dashboard", description: "Visualização de estatísticas no dashboard" },

        // Multi User
        { moduleCode: "multi_user", featurePath: "/api/users*", featureName: "Gerenciamento de Usuários", description: "Criação e administração de usuários" },
        { moduleCode: "multi_user", featurePath: "/api/admin/tenants*", featureName: "Gerenciamento de Tenants", description: "Administração de tenants" },

        // API
        { moduleCode: "api", featurePath: "/api/v1*", featureName: "API v1", description: "Acesso à API pública" },
        { moduleCode: "api", featurePath: "/api/webhooks*", featureName: "Webhooks", description: "Gerenciamento de webhooks" },
    ];

    for (const feature of featuresData) {
        const moduleId = getModuleId(feature.moduleCode);
        if (!moduleId) {
            console.warn(`Module ${feature.moduleCode} not found for feature ${feature.featureName}`);
            continue;
        }

        // Check if exists
        const existing = await db.select().from(moduleFeatures).where(
            eq(moduleFeatures.featurePath, feature.featurePath)
        );

        if (existing.length === 0) {
            await db.insert(moduleFeatures).values({
                moduleId,
                featurePath: feature.featurePath,
                featureName: feature.featureName,
                description: feature.description
            });
            console.log(`Feature ${feature.featureName} created.`);
        }
    }

    // 4. Plan Modules
    console.log("Linking Plans and Modules...");
    // Plan A: Core
    // Plan B: Core, Products, Certificates
    // Plan C: All

    const dbPlans = await db.select().from(plans);
    const getPlanId = (code: string) => dbPlans.find(p => p.code === code)?.id;

    const planModulesData = [
        { planCode: "A", moduleCodes: ["core"] },
        { planCode: "B", moduleCodes: ["core", "products", "certificates"] },
        { planCode: "C", moduleCodes: ["core", "products", "certificates", "certificates_advanced", "traceability", "analytics", "multi_user", "api"] },
    ];

    for (const pm of planModulesData) {
        const planId = getPlanId(pm.planCode);
        if (!planId) continue;

        for (const moduleCode of pm.moduleCodes) {
            const moduleId = getModuleId(moduleCode);
            if (!moduleId) continue;

            // Check existing link (simple check, assume unique constraint or idempotent needs)
            // Drizzle doesn't support easy "UPSERT" on cross-db, so manual check
            const existing = await db.select().from(planModules).where(
                eq(planModules.planId, planId)
            );

            const alreadyLinked = existing.some(e => e.moduleId === moduleId);

            if (!alreadyLinked) {
                await db.insert(planModules).values({ planId, moduleId });
                console.log(`Linked Plan ${pm.planCode} to Module ${moduleCode}`);
            }
        }
    }

    console.log("Seeding completed successfully.");
    process.exit(0);
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
