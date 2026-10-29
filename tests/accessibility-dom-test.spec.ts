import { test, expect, defineConfig } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



const runMetrics = {
    timestamp: new Date().toISOString(),
    environment: 'Unoptimized CSR Baseline',
    accessibility: [] as Array<{ state: string; violationsCount: number; violations: any[] }>,
    performance: [] as Array<{ milestone: string; domNodes: number; durationMs?: number; jsHeapSizeMB?: number; clsScore?: number; rawMovement?: number; fcpMs?: number; lcpMs?: number; longTaskMs: number }>
};

test('Comprehensive Accessibility & Performance Benchmark Suite', async ({ page, context }) => {
    const cdpSession = await context.newCDPSession(page);
    await cdpSession.send('Performance.enable');

    async function recordPerformanceMetrics(milestone: string, durationMs?: number) {
        const perfStats = await page.evaluate(() => {
            const memory = (performance as any).memory;
            const paintEntries = performance.getEntriesByType('paint');
            const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');

            return {
                domNodes: document.getElementsByTagName('*').length,
                jsHeapSizeMB: memory ? parseFloat((memory.usedJSHeapSize / (1024 * 1024)).toFixed(2)) : null,
                cls: (window as any).__clsScore || 0,
                rawMovement: (window as any).__rawMovement || 0,
                fcpMs: fcpEntry ? fcpEntry.startTime : null,
                lcpMs: (window as any).__lcpValue || null,
                longTaskMs: (window as any).__totalLongTaskDuration || 0
            };
        });

        runMetrics.performance.push({
            milestone,
            domNodes: perfStats.domNodes,
            durationMs: durationMs ? parseFloat(durationMs.toFixed(2)) : undefined,
            jsHeapSizeMB: perfStats.jsHeapSizeMB ?? undefined,
            clsScore: parseFloat(perfStats.cls.toFixed(4)),
            rawMovement: parseFloat(perfStats.rawMovement.toFixed(4)),
            fcpMs: perfStats.fcpMs ? parseFloat(perfStats.fcpMs.toFixed(2)) : undefined,
            lcpMs: perfStats.lcpMs ? parseFloat(perfStats.lcpMs.toFixed(2)) : undefined,
            longTaskMs: parseFloat(perfStats.longTaskMs.toFixed(2))
        });
    }

    async function recordAccessibilityScan(stateName: string) {
        const results = await new AxeBuilder({ page }).analyze();
        runMetrics.accessibility.push({
            state: stateName,
            violationsCount: results.violations.length,
            violations: results.violations.map(v => ({
                id: v.id,
                impact: v.impact,
                description: v.description,
                nodesAffected: v.nodes.length,
                helpUrl: v.helpUrl
            }))
        });
    }

    // Milestone: 1 Initial Page Load ---
    const startTime = performance.now();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    const loadDuration = performance.now() - startTime;

    await page.evaluate(() => {
        (window as any).__clsScore = 0;
        (window as any).__rawMovement = 0;
        (window as any).__totalLongTaskDuration = 0;
        (window as any).__lcpValue = 0;

        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                const shiftValue = (entry as any).value;
                (window as any).__rawMovement += (entry as any).value;

                if (!(entry as any).hadRecentInput) {
                    (window as any).__clsScore += shiftValue;
                }
            }
        });
        observer.observe({ type: 'layout-shift', buffered: true });

        const longTaskObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                (window as any).__totalLongTaskDuration += entry.duration;
            }
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });

        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
                (window as any).__lcpValue = lastEntry.startTime;
            }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    });


    await recordPerformanceMetrics('01_Initial_Page_Load', loadDuration);
    await recordAccessibilityScan('Initial Page Load');

    // Milestone: 2 Accordion 1 (System Overview & Live Feed Injection) ---
    const startM2 = performance.now();

    const accordion1Header = page.locator('.accordion-header', { hasText: 'Quick System Overview' });
    await accordion1Header.click();

    const injectButton = page.getByRole('button', { name: 'Simulate Real-time Log Injection' });
    await injectButton.click();

    const durationM2 = performance.now() - startM2;

    await recordPerformanceMetrics('02_Accordion_1_Feed_Injection', durationM2);
    await recordAccessibilityScan('Accordion 1 - Live Log Injected');

    // Milestone: 3 Accordion 2 (Multi-Step Form Errors & Validation State) ---
    const startM3 = performance.now();

    const accordion2Header = page.locator('.accordion-header', { hasText: 'Inventory Intake Wizard' });
    await accordion2Header.click();

    // Trigger form validation error state
    const nextStepButton = page.getByRole('button', { name: 'Next Step' });
    await nextStepButton.click();

    const durationM3 = performance.now() - startM3;

    await recordPerformanceMetrics('03_Form_Validation_Error_State', durationM3);
    await recordAccessibilityScan('Form Step 1 - Error State');

    // Milestone: 4 Fill input correctly and advance to Step 2
    const startM4 = performance.now();

    await page.getByPlaceholder('Enter item name...').fill('Pharmaceutical Batch Alpha');
    await nextStepButton.click();
    await expect(page.getByText('Step 2: Details & Confirmation')).toBeVisible();

    const durationM4 = performance.now() - startM4;

    await recordPerformanceMetrics('04_Form_Step_2_Mounted', durationM4);
    await recordAccessibilityScan('Form Step 2 - Mounted');

    // Milestone: 5 Accordion 3 (Live Activity Stream) ---
    const startM5 = performance.now();

    const accordion3Header = page.locator('.accordion-header', { hasText: 'Live Activity Stream' });
    await accordion3Header.click();

    const durationM5 = performance.now() - startM5;

    await recordPerformanceMetrics('05_Activity_Stream_Expanded', durationM5);
    await recordAccessibilityScan('Accordion 3 - Activity Stream');

    // Milestone: 6 Accordion 4 (Unvirtualized Table - 500 DOM Rows) ---
    const tableStartTime = performance.now();
    const accordion4Header = page.locator('.accordion-header', { hasText: 'Full Asset Catalog Table' });
    await accordion4Header.click();

    // Wait for 500 table row elements to render in the DOM
    await page.locator('.data-table tbody tr').nth(499).waitFor();
    const tableRenderDuration = performance.now() - tableStartTime;

    await recordPerformanceMetrics('06_Table_500_Rows_Mounted', tableRenderDuration);
    await recordAccessibilityScan('Table - 500 Unvirtualized Rows Loaded');

    // Milestone: 7 Inspection Modal (Unmanaged Focus & Overlay) ---
    const modalStartTime = performance.now();

    const inspectButton = page.locator('.data-table tbody tr').first().getByRole('button', { name: 'Inspect' });
    await inspectButton.click();

    const modalHeading = page.getByRole('heading', { name: 'Asset Inspection Details' });
    await expect(modalHeading).toBeVisible();

    const modalRenderDuration = performance.now() - modalStartTime;

    await recordPerformanceMetrics('07_Modal_Dialog_Opened', modalRenderDuration);
    await recordAccessibilityScan('Modal - Active Inspection Dialog');

    // Close Modal
    await page.getByRole('button', { name: 'Close Window' }).click();
    await expect(page.getByRole('heading', { name: 'Asset Inspection Details' })).toBeHidden();

    // --- EXPORT BENCHMARK DATA ---
    const outputDir = path.join(__dirname, 'benchmark-results');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(
        path.join(outputDir, 'unoptimized-csr-metrics.json'),
        JSON.stringify(runMetrics, null, 2)
    );

    const totalViolations = runMetrics.accessibility.reduce((sum, item) => sum + item.violationsCount, 0);
    console.log(`Total Accessibility Violations across all state transitions: ${totalViolations}`);

    const finalCls = await page.evaluate(() => (window as any).__clsScore);
    console.log(`Current Cumulative Layout Shift (CLS): ${finalCls.toFixed(4)}`);
});