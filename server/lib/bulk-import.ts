import * as xlsx from 'xlsx';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import {
    insertSupplierSchema,
    insertManufacturerSchema,
    insertClientSchema,
    insertProductCategorySchema,
    insertProductSubcategorySchema,
    insertProductBaseSchema
} from '@shared/schema';

// Tipos de resposta
export interface ImportError {
    row: number;
    column?: string;
    message: string;
    data?: any;
}

export interface ImportSuccess {
    row: number;
    data: any;
}

export interface ImportResult {
    total: number;
    processed: number;
    successCount: number;
    errorCount: number;
    successes: ImportSuccess[];
    errors: ImportError[];
}

// Mapeamento de colunas (Nome no CSV/Excel -> Nome no Schema)
const COLUMN_MAPPINGS: Record<string, Record<string, string>> = {
    suppliers: {
        'Nome': 'name',
        'CNPJ': 'cnpj',
        'Telefone': 'phone',
        'Endereço': 'address',
        'Código Interno': 'internalCode'
    },
    manufacturers: {
        'Nome': 'name',
        'País': 'country'
    },
    clients: {
        'Nome': 'name',
        'CNPJ': 'cnpj',
        'Telefone': 'phone',
        'Endereço': 'address',
        'Código Interno': 'internalCode'
    },
    categories: {
        'Nome': 'name',
        'Descrição': 'description'
    },
    subcategories: {
        'Nome': 'name',
        'Descrição': 'description',
        'ID Categoria': 'categoryId' // O usuário terá que saber o ID ou implementaremos busca por nome depois? Por enquanto ID.
    },
    products_base: {
        'Nome Técnico': 'technicalName',
        'Nome Comercial': 'commercialName',
        'Descrição': 'description',
        'ID Subcategoria': 'subcategoryId',
        'Código Interno': 'internalCode',
        'Unidade Padrão': 'defaultMeasureUnit',
        'Classe de Risco': 'riskClass',
        'Número de Risco': 'riskNumber',
        'Número ONU': 'unNumber',
        'Grupo de Embalagem': 'packagingGroup'
    }
};

// Schemas de validação
const SCHEMAS: Record<string, z.ZodType<any>> = {
    suppliers: insertSupplierSchema,
    manufacturers: insertManufacturerSchema,
    clients: insertClientSchema,
    categories: insertProductCategorySchema,
    subcategories: insertProductSubcategorySchema,
    products_base: insertProductBaseSchema
};

export async function processImportFile(
    buffer: Buffer,
    filename: string,
    entityType: string,
    tenantId: number
): Promise<ImportResult> {
    const fileExtension = filename.split('.').pop()?.toLowerCase();
    let rawData: any[] = [];

    // 1. Parse do arquivo
    try {
        if (fileExtension === 'csv') {
            rawData = parse(buffer, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });
        } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            rawData = xlsx.utils.sheet_to_json(sheet);
        } else {
            throw new Error('Formato de arquivo não suportado (apenas .csv, .xlsx, .xls)');
        }
    } catch (error: any) {
        return {
            total: 0,
            processed: 0,
            successCount: 0,
            errorCount: 1,
            successes: [],
            errors: [{ row: 0, message: `Erro ao ler arquivo: ${error.message}` }]
        };
    }

    const result: ImportResult = {
        total: rawData.length,
        processed: 0,
        successCount: 0,
        errorCount: 0,
        successes: [],
        errors: []
    };

    const mapping = COLUMN_MAPPINGS[entityType];
    const schema = SCHEMAS[entityType];

    if (!mapping || !schema) {
        return {
            ...result,
            errorCount: 1,
            errors: [{ row: 0, message: `Tipo de entidade não suportado: ${entityType}` }]
        };
    }

    // 2. Processamento linha a linha
    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowNumber = i + 2; // +1 zero-based, +1 header

        try {
            // Mapeamento de dados
            const mappedData: any = { tenantId }; // Injeta o tenantId automaticamente

            for (const [csvHeader, schemaKey] of Object.entries(mapping)) {
                if (row[csvHeader] !== undefined) {
                    mappedData[schemaKey] = row[csvHeader];
                }
            }

            // Tratamento de tipos específicos (números que vieram como string)
            // Isso depende do schema Zod que muitas vezes já faz coerção, mas podemos forçar aqui se necessário
            // Ex: categoryId e subcategoryId devem ser números
            if (mappedData.categoryId) mappedData.categoryId = Number(mappedData.categoryId);
            if (mappedData.subcategoryId) mappedData.subcategoryId = Number(mappedData.subcategoryId);

            // Validação
            const parsedData = schema.parse(mappedData);

            result.successes.push({
                row: rowNumber,
                data: parsedData
            });
            result.successCount++;

        } catch (error: any) {
            result.errorCount++;
            let message = 'Erro desconhecido';

            if (error instanceof z.ZodError) {
                message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            } else {
                message = error.message;
            }

            result.errors.push({
                row: rowNumber,
                message,
                data: row
            });
        }

        result.processed++;
    }

    return result;
}

export function generateTemplate(entityType: string): string {
    const mapping = COLUMN_MAPPINGS[entityType];
    if (!mapping) throw new Error('Tipo de entidade desconhecido');

    // Retorna apenas os cabeçalhos separados por vírgula
    return Object.keys(mapping).join(',');
}
