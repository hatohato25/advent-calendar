import { chromium } from '@playwright/test';

async function debugCursor() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // 最初のボタンを見つける
  const button = page.locator('button').first();
  const buttonExists = await button.count() > 0;

  if (!buttonExists) {
    console.log('No button found on page');
    await browser.close();
    return;
  }

  console.log('\n=== Button Element Analysis ===');

  // ボタンのHTML構造を取得
  const buttonHTML = await button.evaluate((el) => el.outerHTML);
  console.log('Button HTML:', buttonHTML);

  // ボタンのすべてのCSS値を取得
  const buttonStyles = await button.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      cursor: computed.cursor,
      pointerEvents: computed.pointerEvents,
      display: computed.display,
      position: computed.position,
      zIndex: computed.zIndex,
    };
  });
  console.log('Button computed styles:', buttonStyles);

  // ボタンに適用されているすべてのCSSルールを取得
  const appliedRules = await button.evaluate((el) => {
    const rules = [];
    const sheets = Array.from(document.styleSheets);

    for (const sheet of sheets) {
      try {
        const cssRules = Array.from(sheet.cssRules || []);
        for (const rule of cssRules) {
          if ('selectorText' in rule && rule.selectorText) {
            try {
              if (el.matches(rule.selectorText)) {
                const style = (rule as CSSStyleRule).style;
                if (style.cursor) {
                  rules.push({
                    selector: rule.selectorText,
                    cursor: style.cursor,
                    priority: style.getPropertyPriority('cursor'),
                    source: sheet.href || 'inline'
                  });
                }
              }
            } catch (e) {
              // invalid selector
            }
          }
        }
      } catch (e) {
        // CORS or other restrictions
      }
    }

    return rules;
  });

  console.log('\nCSS rules with cursor property applied to button:');
  console.log(JSON.stringify(appliedRules, null, 2));

  // ボタン内の子要素を確認
  const children = await button.locator('*').all();
  console.log(`\nButton has ${children.length} child elements`);

  if (children.length > 0) {
    const firstChild = children[0];
    const childHTML = await firstChild.evaluate((el) => el.outerHTML);
    console.log('First child HTML:', childHTML);

    const childStyles = await firstChild.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        cursor: computed.cursor,
        pointerEvents: computed.pointerEvents,
      };
    });
    console.log('First child computed styles:', childStyles);
  }

  // hover状態をシミュレート
  console.log('\n=== Hover Simulation ===');
  await button.hover();
  await page.waitForTimeout(1000);

  const hoverCursor = await button.evaluate((el) => {
    return window.getComputedStyle(el).cursor;
  });
  console.log('Button cursor during hover:', hoverCursor);

  // globals.cssの内容を確認
  console.log('\n=== Checking globals.css ===');
  const globalsCSS = await page.evaluate(() => {
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        for (const rule of rules) {
          if (rule.cssText.includes('button') && rule.cssText.includes('cursor')) {
            return {
              found: true,
              cssText: rule.cssText,
              source: sheet.href || 'inline'
            };
          }
        }
      } catch (e) {
        // skip
      }
    }
    return { found: false };
  });

  console.log('globals.css cursor rule:', JSON.stringify(globalsCSS, null, 2));

  // Tailwind CSSのutilityクラスが上書きしているか確認
  console.log('\n=== Checking for cursor utility classes ===');
  const utilityClasses = await page.evaluate(() => {
    const sheets = Array.from(document.styleSheets);
    const cursorClasses = [];

    for (const sheet of sheets) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        for (const rule of rules) {
          if (rule.cssText.includes('.cursor-') || rule.cssText.includes('cursor:')) {
            cursorClasses.push({
              cssText: rule.cssText.substring(0, 200),
              source: sheet.href || 'inline'
            });
          }
        }
      } catch (e) {
        // skip
      }
    }

    return cursorClasses.slice(0, 10); // 最初の10個だけ
  });

  console.log('Cursor-related CSS rules:', JSON.stringify(utilityClasses, null, 2));

  console.log('\nWaiting 10 seconds for manual inspection...');
  console.log('Please hover over elements to check cursor behavior manually');
  await page.waitForTimeout(10000);

  await browser.close();
}

debugCursor().catch(console.error);
