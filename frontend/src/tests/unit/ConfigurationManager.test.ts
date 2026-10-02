import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigurationManager } from '../../core/config/ConfigurationManager';
import { AdminService } from '../../networking/api/AdminService';

describe('ConfigurationManager Unit Tests', () => {
    let configMgr: ConfigurationManager;

    beforeEach(() => {
        configMgr = ConfigurationManager.getInstance();
    });

    it('should load fallback default configurations', () => {
        expect(configMgr.quizTimerSec).toBe(15);
        expect(configMgr.questionsPerMatch).toBe(10);
        expect(configMgr.maxLifelinesPerMatch).toBe(2);
        expect(configMgr.dailySubPriceEtb).toBe(2);
        expect(configMgr.isMaintenanceMode).toBe(false);
    });

    it('should dynamically update local configuration values', async () => {
        const updateRes = await configMgr.updateConfig('quiz_timer_sec', 25);
        expect(updateRes.success).toBe(true);
        expect(configMgr.quizTimerSec).toBe(25);

        // Reset back to default
        await configMgr.updateConfig('quiz_timer_sec', 15);
        expect(configMgr.quizTimerSec).toBe(15);
    });
});

describe('AdminService Unit Tests', () => {
    let adminService: AdminService;

    beforeEach(() => {
        adminService = AdminService.getInstance();
    });

    it('should validate and parse bulk CSV data correctly', async () => {
        const csvContent = `category,difficulty,prompt_en,opt0,opt1,opt2,opt3,correct_index
walia-ibex,1,Who won AFCON 1962?,Ethiopia,Egypt,Ghana,Nigeria,0
world-cup,2,Which country hosted 2022 World Cup?,Qatar,Brazil,Russia,France,0`;

        const result = await adminService.bulkImportCsv(csvContent);
        expect(result.successCount).toBe(2);
        expect(result.errorCount).toBe(0);
    });

    it('should report validation errors for invalid CSV input', async () => {
        const invalidCsv = `category,difficulty
invalid_line_without_required_fields`;

        const result = await adminService.bulkImportCsv(invalidCsv);
        expect(result.errorCount).toBeGreaterThan(0);
    });
});
