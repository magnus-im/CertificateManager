
import "dotenv/config";
import { generateMockData, clearMockData } from "../server/services/mock-data";

async function runTest() {
    try {
        console.log("--- TEST: Clearing Mock Data (Pre-check) ---");
        await clearMockData();
        console.log("--- TEST: Cleared ---");

        console.log("\n--- TEST: Generating Mock Data ---");
        const result = await generateMockData();
        console.log("Result:", result);
        console.log("--- TEST: Generated ---");

        console.log("\n--- TEST: Clearing Mock Data (Post-check) ---");
        await clearMockData();
        console.log("--- TEST: Cleared ---");

        console.log("\nSUCCESS: Service logic verification passed.");
        process.exit(0);
    } catch (error) {
        console.error("\nFAILURE: Verification failed:", error);
        process.exit(1);
    }
}

runTest();
