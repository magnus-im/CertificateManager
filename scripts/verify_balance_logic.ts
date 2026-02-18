
import "dotenv/config";
import { db } from "../server/db";
import { entryCertificates, issuedCertificates, tenants } from "@shared/schema";
import { eq } from "drizzle-orm";

async function verifyBalance() {
    console.log("Verifying calculated balance...");

    // 1. Get a mock tenant
    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.cnpj, "00.000.000/0001-99") // Mock tenant
    });

    if (!tenant) {
        console.error("Mock tenant not found");
        return;
    }

    // 2. Get all entry certificates
    const entries = await db.query.entryCertificates.findMany({
        where: eq(entryCertificates.tenantId, tenant.id)
    });

    console.log(`Found ${entries.length} entry certificates`);

    for (const entry of entries.slice(0, 5)) { // Check first 5
        // 3. Get issued certificates for this entry
        const issued = await db.query.issuedCertificates.findMany({
            where: eq(issuedCertificates.entryCertificateId, entry.id)
        });

        const totalSold = issued.reduce((sum, i) => sum + Number(i.soldQuantity), 0);
        const expectedBalance = Number(entry.receivedQuantity) - totalSold;

        console.log(`Entry ${entry.id}:`);
        console.log(`  Received: ${entry.receivedQuantity}`);
        console.log(`  Sold: ${totalSold}`);
        console.log(`  Expected Balance: ${expectedBalance.toFixed(2)}`);

        // We simulate the API logic here
        const currentBalance = Number(entry.receivedQuantity) - totalSold;

        if (currentBalance <= 0) {
            console.log("  -> Zero or negative balance (should be filtered in frontend)");
        } else {
            console.log("  -> Positive balance");
        }
    }
}

verifyBalance().catch(console.error).then(() => process.exit(0));
