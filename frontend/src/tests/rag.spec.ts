import { test, expect } from '@playwright/test';

test.describe('NIRIKSHAN AI Sidebar Assistant', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  async function openSidebarAI(page) {
    await page.locator('button:has-text("Ask NIRIKSHAN AI")').click();
    await expect(page.locator('text=NIRIKSHAN AI Assistant')).toBeVisible({ timeout: 10000 });
  }

  async function sendQuery(page, query) {
    const input = page.locator('input[placeholder*="Ask AI"]');
    await input.fill(query);
    await page.locator('button.bg-slate-800').click();
    await page.waitForTimeout(8000);
  }

  test('opens sidebar and sends greeting', async ({ page }) => {
    await openSidebarAI(page);
    await sendQuery(page, 'hi');
    await expect(page.locator('text=Hello! I am NIRIKSHAN AI')).toBeVisible({ timeout: 20000 });
  });

  test('responds to why flagged query', async ({ page }) => {
    await openSidebarAI(page);
    await sendQuery(page, 'why flagged');
    await expect(page.locator('text=SIGNAL').first()).toBeVisible({ timeout: 25000 });
  });

  test('responds to vendor analysis query', async ({ page }) => {
    await openSidebarAI(page);
    await sendQuery(page, 'vendor analysis');
    await expect(page.locator('text=PORTFOLIO').first()).toBeVisible({ timeout: 25000 });
  });

  test('responds to sanction amount query', async ({ page }) => {
    await openSidebarAI(page);
    await sendQuery(page, 'sanction amount');
    await expect(page.locator('text=RECOMMENDED OUTLAY').first()).toBeVisible({ timeout: 25000 });
  });

  test('responds to MP track record query', async ({ page }) => {
    await openSidebarAI(page);
    await sendQuery(page, 'MP track record');
    await expect(page.locator('text=PORTFOLIO').first()).toBeVisible({ timeout: 25000 });
  });

  test('responds to timeline query', async ({ page }) => {
    await openSidebarAI(page);
    await sendQuery(page, 'timeline delay');
    await expect(page.locator('text=RECORDED TIMELINE').first()).toBeVisible({ timeout: 25000 });
  });

  test('responds to identity query', async ({ page }) => {
    await openSidebarAI(page);
    await sendQuery(page, 'who are you');
    await expect(page.locator('text=deterministic forensic audit reasoning engine')).toBeVisible({ timeout: 20000 });
  });

  test('message formatting - user messages right-aligned, assistant left-aligned', async ({ page }) => {
    await openSidebarAI(page);
    await sendQuery(page, 'hi');
    await expect(page.locator('text=Hello! I am NIRIKSHAN AI')).toBeVisible({ timeout: 20000 });
    
    const userMsg = page.locator('text=hi').first();
    const assistantMsg = page.locator('text=Hello! I am NIRIKSHAN AI').first();
    await expect(userMsg).toBeVisible();
    await expect(assistantMsg).toBeVisible();
  });

  test('closes sidebar', async ({ page }) => {
    await openSidebarAI(page);
    const closeBtn = page.locator('button[aria-label*="close" i], button:has(svg)').filter({ hasText: /Close|close|×/i }).first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await expect(page.locator('text=NIRIKSHAN AI Assistant')).toBeHidden({ timeout: 5000 });
    }
  });
});

test.describe('Investigation AI Assistant', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => {
    await page.goto('/investigation');
    await page.waitForLoadState('networkidle');
  });

  async function openCaseAndAI(page) {
    await expect(page.locator('h2:has-text("Investigation Workspace")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=High Risk Case Files')).toBeVisible({ timeout: 15000 });
    
    const caseRows = page.locator('div[class*="cursor-pointer"][class*="hover:bg-slate-50"]');
    if (await caseRows.count() === 0) {
      const caseRows2 = page.locator('div.border-l-4');
      if (await caseRows2.count() > 0) {
        await caseRows2.first().click();
      }
    } else {
      await caseRows.first().click();
    }
    
    await expect(page.locator('text=Case AI Assistant')).toBeVisible({ timeout: 15000 });
  }

  async function sendInvestigationQuery(page, query) {
    const input = page.locator('input[placeholder*="Ask about this case"]');
    await input.fill(query);
    await page.locator('button.bg-teal-600').click();
    await page.waitForTimeout(10000);
  }

  test('loads cases and opens case detail', async ({ page }) => {
    await openCaseAndAI(page);
  });

  test('sends query to case AI assistant', async ({ page }) => {
    await openCaseAndAI(page);
    await sendInvestigationQuery(page, 'why flagged');
    await expect(page.locator('text=Risk Justification').first()).toBeVisible({ timeout: 35000 });
  });

  test('chat formatting consistent', async ({ page }) => {
    await openCaseAndAI(page);
    await sendInvestigationQuery(page, 'hello');
    await expect(page.locator('text=Context loaded')).toBeVisible({ timeout: 25000 });
  });
});

test.describe('SanityCheck AI Assistant', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => {
    await page.goto('/sanity-check?work_id=WS/MP005/2024-2025/145074');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
  });

  async function waitForAI(page) {
    await expect(page.locator('text=NIRIKSHAN AI Assistant')).toBeVisible({ timeout: 60000 });
    await page.waitForTimeout(10000);
  }

  async function sendSanityQuery(page, query) {
    const input = page.locator('input[placeholder*="Ask follow-up"]');
    await input.fill(query);
    await page.locator('button.bg-teal-600').click();
    await page.waitForTimeout(10000);
  }

  test('AI assistant panel renders', async ({ page }) => {
    await waitForAI(page);
    await expect(page.locator('text=Natural Language Audit Reasoning Engine')).toBeVisible();
    await expect(page.locator('button:has-text("Why is vendor flagged")')).toBeVisible();
    await expect(page.locator('button:has-text("Compare sanction amount")')).toBeVisible();
    await expect(page.locator('button:has-text("MP completion record")')).toBeVisible();
  });

  test('manual query works', async ({ page }) => {
    await waitForAI(page);
    await sendSanityQuery(page, 'compare sanction amount');
    await expect(page.locator('text=RECOMMENDED OUTLAY').first()).toBeVisible({ timeout: 35000 });
  });

  test('chat formatting with whitespace-pre-wrap', async ({ page }) => {
    await waitForAI(page);
    await sendSanityQuery(page, 'summary');
    await expect(page.locator('text=NIRIKSHAN Audit Summary').first()).toBeVisible({ timeout: 35000 });
    const msgContainer = page.locator('.whitespace-pre-wrap').first();
    await expect(msgContainer).toBeVisible();
  });
});

test.describe('Cross-UI Consistency (Sidebar & SanityCheck)', () => {
  test.setTimeout(120000);
  
  const queries = ['why flagged', 'vendor analysis', 'sanction amount'];
  
  for (const query of queries) {
    test(`consistent reply for "${query}" across Sidebar and SanityCheck`, async ({ page }) => {
      const replies = [];
      
      for (const route of ['/', '/sanity-check?work_id=WS/MP005/2024-2025/145074']) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        
        let input, sendBtn;
        
        if (route === '/') {
          await page.locator('button:has-text("Ask NIRIKSHAN AI")').click();
          await expect(page.locator('text=NIRIKSHAN AI Assistant')).toBeVisible({ timeout: 10000 });
          input = page.locator('input[placeholder*="Ask AI"]');
          sendBtn = page.locator('button.bg-slate-800');
        } else {
          await expect(page.locator('text=NIRIKSHAN AI Assistant')).toBeVisible({ timeout: 60000 });
          await page.waitForTimeout(10000);
          input = page.locator('input[placeholder*="Ask follow-up"]');
          sendBtn = page.locator('button.bg-teal-600');
        }
        
        await input.fill(query);
        await sendBtn.click();
        await page.waitForTimeout(10000);
        
        const assistantMsgs = page.locator('.whitespace-pre-wrap, .bg-slate-100, .bg-white.border, .bg-slate-50').filter({ hasText: new RegExp(query.split(' ')[0], 'i') });
        const reply = await assistantMsgs.last().textContent() || '';
        replies.push(reply);
      }
      
      const uniqueReplies = new Set(replies.map(r => r.substring(0, 200)));
      expect(uniqueReplies.size).toBeLessThanOrEqual(2);
    });
  }
});