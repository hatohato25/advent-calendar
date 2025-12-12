import { chromium } from '@playwright/test';

async function finalCursorTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  console.log('\n=== Final Cursor Test ===\n');

  // ボタン要素のテスト
  const button = page.locator('button').first();
  if (await button.count() > 0) {
    const buttonCursor = await button.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    console.log('✓ Button cursor:', buttonCursor);

    // ボタン内の子要素のテスト
    const buttonChild = button.locator('*').first();
    if (await buttonChild.count() > 0) {
      const childCursor = await buttonChild.evaluate((el) => {
        return window.getComputedStyle(el).cursor;
      });
      console.log('✓ Button child cursor:', childCursor);
    }
  }

  // リンク要素のテスト
  const link = page.locator('a').first();
  if (await link.count() > 0) {
    const linkCursor = await link.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    console.log('✓ Link cursor:', linkCursor);

    // リンク内の子要素のテスト
    const linkChild = link.locator('*').first();
    if (await linkChild.count() > 0) {
      const childCursor = await linkChild.evaluate((el) => {
        return window.getComputedStyle(el).cursor;
      });
      console.log('✓ Link child cursor:', childCursor);
    }
  }

  // CSSルールの確認
  const cssRuleApplied = await page.evaluate(() => {
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        for (const rule of rules) {
          if (rule.cssText.includes('button, button *') && rule.cssText.includes('cursor: pointer')) {
            return true;
          }
        }
      } catch (e) {
        // skip
      }
    }
    return false;
  });

  console.log('✓ CSS rule with child selectors applied:', cssRuleApplied);

  // 実際のカーソル変化をテスト
  console.log('\n=== Manual Hover Test ===');
  console.log('Please hover over the button and child elements to verify cursor changes to pointer');
  console.log('The test will wait 10 seconds for you to manually verify...\n');

  // ボタンをハイライト
  await button.evaluate((el) => {
    el.style.outline = '3px solid red';
  });

  await page.waitForTimeout(10000);

  // アウトラインを削除
  await button.evaluate((el) => {
    el.style.outline = '';
  });

  console.log('\n=== Test Complete ===');
  console.log('If the cursor changed to pointer when hovering over the button and its children,');
  console.log('the fix is successful!');

  await browser.close();
}

finalCursorTest().catch(console.error);
