import { parseStringPromise } from 'xml2js';
import { db } from "../db";
import {
    invoices, invoiceItems, productMappings, issuanceQueue,
    clients, products, tenants, entryCertificates, issuedCertificates
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { storage } from "../storage";

interface NfeProduct {
    code: string;
    description: string;
    ncm: string;
    cfop: string;
    uCom: string;
    qCom: number;
    vUnCom: number;
}

export class XmlService {

    async processNfeXml(xmlBuffer: Buffer, tenantId: number): Promise<{ success: boolean; message: string; invoiceId?: number }> {
        try {
            const xmlString = xmlBuffer.toString('utf-8');
            const result = await parseStringPromise(xmlString, { explicitArray: false });

            const nfeProc = result.nfeProc || result.NFe; // Handle both distribution and raw XML
            if (!nfeProc) {
                throw new Error("Formato XML inválido. Tag nfeProc ou NFe não encontrada.");
            }

            const infNFe = nfeProc.NFe ? nfeProc.NFe.infNFe : nfeProc.infNFe;

            // Access Key
            const accessKey = infNFe.$.Id.replace('NFe', '');

            // Check if invoice already exists
            const [existingInvoice] = await db.select().from(invoices).where(eq(invoices.accessKey, accessKey));
            if (existingInvoice) {
                return { success: false, message: "Nota fiscal já importada." };
            }

            // Extract Issuer (Emitente)
            const emit = infNFe.emit;
            const issuerCnpj = emit.CNPJ;
            const issuerName = emit.xNome;

            // Extract Recipient (Destinatário)
            const dest = infNFe.dest;
            const recipientCnpj = dest.CNPJ || dest.CPF;
            const recipientName = dest.xNome;

            // Ensure Client Exists
            await this.ensureClientExists(dest, tenantId);

            // Extract Invoice Header Info
            const ide = infNFe.ide;
            const invoiceData = {
                tenantId,
                accessKey,
                number: ide.nNF,
                series: ide.serie,
                emissionDate: new Date(ide.dhEmi || ide.dEmi),
                issuerCnpj,
                issuerName,
                recipientCnpj,
                recipientName,
                xmlContent: xmlString,
                status: 'imported'
            };

            // Save Invoice
            const [newInvoice] = await db.insert(invoices).values(invoiceData).returning();

            // Process Items
            const det = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];

            for (const item of det) {
                const prod = item.prod;
                const nfeProduct: NfeProduct = {
                    code: prod.cProd,
                    description: prod.xProd,
                    ncm: prod.NCM,
                    cfop: prod.CFOP,
                    uCom: prod.uCom,
                    qCom: parseFloat(prod.qCom),
                    vUnCom: parseFloat(prod.vUnCom)
                };

                // Create Invoice Item
                const seqNumber = item.$ ? parseInt(item.$.nItem) : undefined;
                const [newItem] = await db.insert(invoiceItems).values({
                    invoiceId: newInvoice.id,
                    sequenceNumber: seqNumber || undefined,
                    productCode: nfeProduct.code,
                    productName: nfeProduct.description,
                    quantity: nfeProduct.qCom.toString(),
                    unit: nfeProduct.uCom,
                    unitValue: nfeProduct.vUnCom.toString(),
                    ncm: nfeProduct.ncm,
                    cfop: nfeProduct.cfop
                }).returning();

                // Check Product Mapping
                const mappingStatus = await this.resolveProductMapping(newItem.id, nfeProduct, issuerCnpj, tenantId);

                // Add to Issuance Queue
                await db.insert(issuanceQueue).values({
                    invoiceItemId: newItem.id,
                    status: mappingStatus,
                    tenantId,
                    priority: 0
                });
            }

            return { success: true, message: "Nota fiscal importada com sucesso.", invoiceId: newInvoice.id };

        } catch (error: any) {
            console.error("Erro ao processar XML da NF-e:", error);
            return { success: false, message: `Erro ao processar XML: ${error.message}` };
        }
    }

    private async ensureClientExists(dest: any, tenantId: number) {
        const cnpj = dest.CNPJ || dest.CPF;

        // We can't easily search by CNPJ via storage without fetching all or adding a method.
        // Making a direct DB call for efficiency.
        const [existingClient] = await db.select().from(clients).where(
            and(
                eq(clients.cnpj, cnpj),
                eq(clients.tenantId, tenantId)
            )
        );

        if (!existingClient) {
            // Create new client
            await storage.createClient({
                name: dest.xNome,
                cnpj: cnpj,
                address: `${dest.enderDest?.xLgr}, ${dest.enderDest?.nro} - ${dest.enderDest?.xBairro}, ${dest.enderDest?.xMun} - ${dest.enderDest?.UF}`,
                tenantId,
                internalCode: 'AUTO-IMPORT',
                phone: dest.enderDest?.fone
            });
        }
    }

    private async resolveProductMapping(invoiceItemId: number, nfeProduct: NfeProduct, supplierCnpj: string, tenantId: number): Promise<string> {
        // 1. Try exact match by Supplier SKU + Supplier CNPJ
        const [mapping] = await db.select().from(productMappings).where(
            and(
                eq(productMappings.supplierSku, nfeProduct.code),
                eq(productMappings.supplierCnpj, supplierCnpj),
                eq(productMappings.tenantId, tenantId)
            )
        );

        if (mapping) {
            return "READY";
        }

        // 2. Try exact match by Supplier SKU (generic mapping)
        const [genericMapping] = await db.select().from(productMappings).where(
            and(
                eq(productMappings.supplierSku, nfeProduct.code),
                eq(productMappings.tenantId, tenantId)
            )
        );

        if (genericMapping) {
            return "READY";
        }

        // 3. Fuzzy Matching could go here (Nice to have)
        // For now, if no mapping, return MAPPING_REQUIRED
        return "MAPPING_REQUIRED";
    }

    async getIssuanceQueue(tenantId: number) {
        return await db.select({
            id: issuanceQueue.id,
            status: issuanceQueue.status,
            priority: issuanceQueue.priority,
            createdAt: issuanceQueue.createdAt,
            updatedAt: issuanceQueue.updatedAt,
            errorMessage: issuanceQueue.errorMessage,
            invoiceItem: {
                id: invoiceItems.id,
                sequenceNumber: invoiceItems.sequenceNumber,
                productCode: invoiceItems.productCode,
                productName: invoiceItems.productName,
                quantity: invoiceItems.quantity,
                unit: invoiceItems.unit,
                unitValue: invoiceItems.unitValue
            },
            invoice: {
                id: invoices.id,
                number: invoices.number,
                series: invoices.series,
                issuerName: invoices.issuerName,
                issuerCnpj: invoices.issuerCnpj,
                recipientName: invoices.recipientName,
                recipientCnpj: invoices.recipientCnpj,
                emissionDate: invoices.emissionDate
            }
        })
            .from(issuanceQueue)
            .innerJoin(invoiceItems, eq(issuanceQueue.invoiceItemId, invoiceItems.id))
            .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
            .where(eq(issuanceQueue.tenantId, tenantId))
            .orderBy(issuanceQueue.createdAt);
    }

    async resolveItemMapping(queueId: number, productId: number, tenantId: number): Promise<{ success: boolean; message: string }> {
        try {
            // Get Queue Item
            const [queueItem] = await db.select().from(issuanceQueue).where(
                and(
                    eq(issuanceQueue.id, queueId),
                    eq(issuanceQueue.tenantId, tenantId)
                )
            );

            if (!queueItem) {
                return { success: false, message: "Item da fila não encontrado." };
            }

            // Get Invoice Item
            const [invoiceItem] = await db.select().from(invoiceItems).where(eq(invoiceItems.id, queueItem.invoiceItemId));
            if (!invoiceItem) {
                return { success: false, message: "Item da nota não encontrado." };
            }

            // Get Invoice to get Supplier CNPJ
            const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceItem.invoiceId));
            if (!invoice) {
                return { success: false, message: "Nota fiscal não encontrada." };
            }

            // Check if mapping exists, update or insert
            const existingMapping = await db.select().from(productMappings).where(
                and(
                    eq(productMappings.supplierSku, invoiceItem.productCode),
                    eq(productMappings.supplierCnpj, invoice.issuerCnpj),
                    eq(productMappings.tenantId, tenantId)
                )
            );

            if (existingMapping.length > 0) {
                await db.update(productMappings)
                    .set({ productId: productId })
                    .where(eq(productMappings.id, existingMapping[0].id));
            } else {
                // Create Mapping
                await db.insert(productMappings).values({
                    tenantId,
                    supplierSku: invoiceItem.productCode,
                    productId,
                    supplierCnpj: invoice.issuerCnpj
                });
            }

            // Update Queue Item Status
            await db.update(issuanceQueue)
                .set({ status: 'READY', updatedAt: new Date(), errorMessage: null })
                .where(eq(issuanceQueue.id, queueId));

            return { success: true, message: "Mapeamento resolvido com sucesso." };

        } catch (error: any) {
            console.error("Erro ao resolver mapeamento:", error);
            return { success: false, message: `Erro ao resolver mapeamento: ${error.message}` };
        }
    }

    async unlinkMapping(queueId: number, tenantId: number) {
        const [queueItem] = await db.select().from(issuanceQueue).where(
            and(eq(issuanceQueue.id, queueId), eq(issuanceQueue.tenantId, tenantId))
        );
        if (!queueItem) throw new Error("Item não encontrado na fila.");

        // Reset status to MAPPING_REQUIRED
        await db.update(issuanceQueue)
            .set({ status: 'MAPPING_REQUIRED', updatedAt: new Date(), errorMessage: null })
            .where(eq(issuanceQueue.id, queueId));

        return { success: true, message: "Produto desvinculado. Selecione um novo produto." };
    }

    async deleteQueueItem(queueId: number, tenantId: number) {
        // 1. Get queue item to find the related invoice
        const [queueItem] = await db.select().from(issuanceQueue).where(
            and(eq(issuanceQueue.id, queueId), eq(issuanceQueue.tenantId, tenantId))
        );
        if (!queueItem) throw new Error("Item não encontrado na fila.");

        // 2. Get the invoice item to find the invoice
        const [invoiceItem] = await db.select().from(invoiceItems).where(eq(invoiceItems.id, queueItem.invoiceItemId));

        // 3. Delete the queue item
        await db.delete(issuanceQueue).where(eq(issuanceQueue.id, queueId));

        // 4. Delete the related invoice item
        if (invoiceItem) {
            await db.delete(invoiceItems).where(eq(invoiceItems.id, invoiceItem.id));

            // 5. Check if there are remaining items for this invoice
            const remainingItems = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceItem.invoiceId));

            // 6. If no more items, delete the invoice itself (allows re-import)
            if (remainingItems.length === 0) {
                await db.delete(invoices).where(eq(invoices.id, invoiceItem.invoiceId));
            }
        }
    }

    async getAvailableLots(queueId: number, tenantId: number) {
        const [queueItem] = await db.select().from(issuanceQueue).where(and(eq(issuanceQueue.id, queueId), eq(issuanceQueue.tenantId, tenantId)));
        if (!queueItem) throw new Error("Item not found");

        const [invoiceItem] = await db.select().from(invoiceItems).where(eq(invoiceItems.id, queueItem.invoiceItemId));
        if (!invoiceItem) throw new Error("Invoice item not found");

        const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceItem.invoiceId));

        console.log(`[getAvailableLots] Buscando lotes para item da fila ${queueId}, produto código ${invoiceItem.productCode}, CNPJ emissor ${invoice.issuerCnpj}`);

        const [mapping] = await db.select().from(productMappings).where(
            and(
                eq(productMappings.supplierSku, invoiceItem.productCode),
                eq(productMappings.supplierCnpj, invoice.issuerCnpj),
                eq(productMappings.tenantId, tenantId)
            )
        ) || await db.select().from(productMappings).where(
            and(
                eq(productMappings.supplierSku, invoiceItem.productCode),
                eq(productMappings.tenantId, tenantId)
            )
        );

        if (!mapping) {
            console.log(`[getAvailableLots] Nenhum mapeamento encontrado para ${invoiceItem.productCode}`);
            return [];
        }

        console.log(`[getAvailableLots] Mapeamento encontrado: Produto ID ${mapping.productId}`);

        const entryCerts = await db.select().from(entryCertificates)
            .where(and(
                eq(entryCertificates.productId, mapping.productId),
                eq(entryCertificates.tenantId, tenantId)
            ))
            .orderBy(entryCertificates.expirationDate); // FEFO

        console.log(`[getAvailableLots] Encontrados ${entryCerts.length} certificados de entrada para o produto ${mapping.productId}`);

        const availableLots: any[] = []; // Type any for simplicity in this context or define interface
        for (const cert of entryCerts) {
            const issued = await db.select().from(issuedCertificates).where(eq(issuedCertificates.entryCertificateId, cert.id));
            const totalIssued = issued.reduce((acc, curr) => acc + parseFloat(curr.soldQuantity), 0);
            const currentBalance = parseFloat(cert.receivedQuantity) - totalIssued;

            console.log(`[getAvailableLots] Certificado Entrada ${cert.id}: Recebido ${cert.receivedQuantity}, Emitido ${totalIssued}, Saldo ${currentBalance}`);

            if (currentBalance > 0) {
                availableLots.push({
                    ...cert,
                    balance: currentBalance
                });
            }
        }

        console.log(`[getAvailableLots] Total lotes disponíveis: ${availableLots.length}`);
        return availableLots;
    }


    async issueManually(queueId: number, selectedLots: { entryCertificateId: number, quantity: number }[], tenantId: number) {
        const [queueItem] = await db.select().from(issuanceQueue).where(and(eq(issuanceQueue.id, queueId), eq(issuanceQueue.tenantId, tenantId)));
        if (!queueItem) throw new Error("Item not found");

        const [invoiceItem] = await db.select().from(invoiceItems).where(eq(invoiceItems.id, queueItem.invoiceItemId));
        const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceItem.invoiceId));

        const [client] = await db.select().from(clients).where(and(
            eq(clients.cnpj, invoice.recipientCnpj),
            eq(clients.tenantId, tenantId)
        ));

        if (!client) throw new Error("Cliente não encontrado");

        for (const selection of selectedLots) {
            // Get Entry Certificate to specifically get the internalLot
            const [entryCert] = await db.select().from(entryCertificates).where(eq(entryCertificates.id, selection.entryCertificateId));

            await db.insert(issuedCertificates).values({
                tenantId,
                entryCertificateId: selection.entryCertificateId,
                clientId: client.id,
                issueDate: new Date().toISOString().split('T')[0],
                invoiceNumber: invoice.number,
                soldQuantity: selection.quantity.toString(),
                measureUnit: invoiceItem.unit,
                customLot: entryCert?.internalLot || 'N/A' // default to entry cert lot
            });
        }

        await db.update(issuanceQueue)
            .set({ status: 'ISSUED', updatedAt: new Date(), errorMessage: null })
            .where(eq(issuanceQueue.id, queueId));

        return { success: true };
    }

    // Queue Processing - DESATIVADO: itens são processados manualmente pelo usuário
    startQueueProcessor() {
        console.log("Processador de fila de NF-e: modo manual ativo. Itens são processados pelo usuário via botão 'Emitir'.");
        // Processamento automático desativado para permitir seleção manual de lotes
        // setInterval(() => this.processReadyItems(), 60 * 1000);
        // this.processReadyItems();
    }

    private async processReadyItems() {
        try {
            const readyItems = await db.select().from(issuanceQueue).where(eq(issuanceQueue.status, 'READY'));

            for (const item of readyItems) {
                await this.processQueueItem(item);
            }
        } catch (error) {
            console.error("Erro no processamento da fila:", error);
        }
    }

    private async processQueueItem(queueItem: typeof issuanceQueue.$inferSelect) {
        try {
            // 1. Get Invoice Item
            const [invoiceItem] = await db.select().from(invoiceItems).where(eq(invoiceItems.id, queueItem.invoiceItemId));
            if (!invoiceItem) return;

            // 2. Get Invoice (for issuer CNPJ)
            const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceItem.invoiceId));
            if (!invoice) return;

            // 3. Get Mapping
            const [mapping] = await db.select().from(productMappings).where(
                and(
                    eq(productMappings.supplierSku, invoiceItem.productCode),
                    eq(productMappings.supplierCnpj, invoice.issuerCnpj),
                    eq(productMappings.tenantId, queueItem.tenantId)
                )
            ) || await db.select().from(productMappings).where(
                and(
                    eq(productMappings.supplierSku, invoiceItem.productCode),
                    eq(productMappings.tenantId, queueItem.tenantId)
                )
            );

            if (!mapping) {
                await db.update(issuanceQueue)
                    .set({ status: 'MAPPING_REQUIRED', errorMessage: 'Mapeamento não encontrado' })
                    .where(eq(issuanceQueue.id, queueItem.id));
                return;
            }

            // 4. Find valid Entry Certificate (FEFO)
            const entryCerts = await db.select().from(entryCertificates)
                .where(and(
                    eq(entryCertificates.productId, mapping.productId),
                    eq(entryCertificates.tenantId, queueItem.tenantId)
                ))
                .orderBy(entryCertificates.expirationDate); // FEFO logic

            let selectedCert = null;

            for (const cert of entryCerts) {
                // Calculate balance
                const issued = await db.select().from(issuedCertificates).where(eq(issuedCertificates.entryCertificateId, cert.id));
                const totalIssued = issued.reduce((acc, curr) => acc + parseFloat(curr.soldQuantity), 0);
                const currentBalance = parseFloat(cert.receivedQuantity) - totalIssued;

                // Check if SINGLE lot has enough balance
                if (currentBalance >= parseFloat(invoiceItem.quantity)) {
                    selectedCert = cert;
                    break;
                }
            }

            if (!selectedCert) {
                // If no SINGLE lot has enough balance, we DO NOT auto-issue.
                // We set status to MANUAL_REVIEW to alert the user.
                await db.update(issuanceQueue)
                    .set({ status: 'MANUAL_REVIEW', errorMessage: 'Saldo insuficiente em lote único. Necessário seleção manual.' })
                    .where(eq(issuanceQueue.id, queueItem.id));
                return;
            }

            // 5. Issue Certificate
            const [client] = await db.select().from(clients).where(and(
                eq(clients.cnpj, invoice.recipientCnpj),
                eq(clients.tenantId, queueItem.tenantId)
            ));

            if (!client) {
                await db.update(issuanceQueue)
                    .set({ status: 'ERROR', errorMessage: 'Cliente não encontrado' })
                    .where(eq(issuanceQueue.id, queueItem.id));
                return;
            }

            await db.insert(issuedCertificates).values({
                tenantId: queueItem.tenantId,
                entryCertificateId: selectedCert.id,
                clientId: client.id,
                issueDate: new Date().toISOString().split('T')[0],
                invoiceNumber: invoice.number,
                soldQuantity: invoiceItem.quantity,
                measureUnit: invoiceItem.unit,
                customLot: selectedCert.internalLot
            });

            // 6. Update Queue Status
            await db.update(issuanceQueue)
                .set({ status: 'ISSUED', updatedAt: new Date(), errorMessage: null })
                .where(eq(issuanceQueue.id, queueItem.id));

        } catch (error: any) {
            console.error(`Erro ao processar item da fila ${queueItem.id}:`, error);
            await db.update(issuanceQueue)
                .set({ status: 'ERROR', errorMessage: error.message })
                .where(eq(issuanceQueue.id, queueItem.id));
        }
    }
}

export const xmlService = new XmlService();
