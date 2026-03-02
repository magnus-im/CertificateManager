import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { checkFeatureAccess } from './feature-access';
import { storage } from '../storage';
import { db } from '../db';
import { plans, moduleFeatures, planModules, modules } from '@shared/schema';

const mockResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

const mockRequest = (userRole: string, tenantId: number, reqPath: string) => {
    return {
        isAuthenticated: () => true,
        user: { id: 1, role: userRole, tenantId, username: 'testuser' },
        path: reqPath,
    };
};

describe('Middleware: checkFeatureAccess', () => {
    let dbPlans: typeof plans.$inferSelect[] = [];
    let dbFeatures: typeof moduleFeatures.$inferSelect[] = [];
    let dbPlanModules: typeof planModules.$inferSelect[] = [];

    // We mock getTenant to return a dynamic planId without needing real tenants in DB
    const originalGetTenant = storage.getTenant;
    let currentMockedPlanId = 1;

    beforeAll(async () => {
        storage.getTenant = vi.fn().mockImplementation(async (tenantId: number) => {
            return { id: tenantId, planId: currentMockedPlanId };
        });

        dbPlans = await db.select().from(plans);
        dbFeatures = await db.select().from(moduleFeatures);
        dbPlanModules = await db.select().from(planModules);
    });

    afterAll(() => {
        storage.getTenant = originalGetTenant;
    });

    it('should deny access if user is not authenticated', async () => {
        const req = { isAuthenticated: () => false };
        const res = mockResponse();
        const next = vi.fn();

        const middleware = checkFeatureAccess('/api/products');
        await middleware(req as any, res as any, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Não autenticado" });
        expect(next).not.toHaveBeenCalled();
    });

    it('should allow access to any route for system_admin and admin', async () => {
        const req = mockRequest('admin', 1, '/api/some-secure-route');
        const res = mockResponse();
        const next = vi.fn();

        const middleware = checkFeatureAccess('/api/some-secure-route');
        await middleware(req as any, res as any, next);

        expect(next).toHaveBeenCalled();
    });

    it('should dynamically validate access based on database configuration (Plans vs Features)', async () => {
        // This test dynamically loop through every plan and every feature registered in the database.
        // Making it future-proof: developers just need to add features via seed.ts, and this test adapts.

        expect(dbPlans.length).toBeGreaterThan(0);
        expect(dbFeatures.length).toBeGreaterThan(0);

        for (const plan of dbPlans) {
            currentMockedPlanId = plan.id;

            // Determine which modules belong to this plan
            const modulesForPlan = dbPlanModules
                .filter(pm => pm.planId === plan.id)
                .map(pm => pm.moduleId);

            for (const feature of dbFeatures) {
                // Is this feature part of a module associated with the current plan?
                const shouldHaveAccess = modulesForPlan.includes(feature.moduleId);

                // Convert featurePath (e.g. /api/products*) to a testable simulated request path
                let simulatedRequestPath = feature.featurePath;
                if (simulatedRequestPath.endsWith('*')) {
                    simulatedRequestPath = simulatedRequestPath.slice(0, -1) + 'test';
                }

                const req = mockRequest('user', 999, simulatedRequestPath);
                const res = mockResponse();
                const next = vi.fn();

                const middleware = checkFeatureAccess(feature.featurePath);
                await middleware(req as any, res as any, next);

                if (shouldHaveAccess) {
                    if (!next.mock.calls.length) {
                        throw new Error(`Plan "${plan.name}" should HAVE access to "${feature.featureName}" (${feature.featurePath}), but was DENIED.`);
                    }
                    expect(next).toHaveBeenCalled();
                    expect(res.status).not.toHaveBeenCalled();
                } else {
                    if (next.mock.calls.length) {
                        throw new Error(`Plan "${plan.name}" should NOT have access to "${feature.featureName}" (${feature.featurePath}), but was ALLOWED.`);
                    }
                    expect(next).not.toHaveBeenCalled();
                    expect(res.status).toHaveBeenCalledWith(403);
                }
            }
        }
    });

});
