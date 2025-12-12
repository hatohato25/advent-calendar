import { chromium } from '@playwright/test';

async function checkCursorStyle() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // ローカル開発サーバーにアクセス
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');

  // ページの読み込みを待つ
  await page.waitForLoadState('networkidle');

  // ボタン要素を探す
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} button elements`);

  if (buttons.length > 0) {
    const button = buttons[0];

    // ボタンのcomputed styleを取得
    const cursorStyle = await button.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });

    console.log('Button cursor style:', cursorStyle);

    // ボタン内の子要素も確認
    const buttonChildren = await button.locator('*').all();
    if (buttonChildren.length > 0) {
      const childCursorStyle = await buttonChildren[0].evaluate((el) => {
        return window.getComputedStyle(el).cursor;
      });
      console.log('Button child cursor style:', childCursorStyle);
    }
  }

  // リンク要素も確認
  const links = await page.locator('a').all();
  console.log(`Found ${links.length} link elements`);

  if (links.length > 0) {
    const link = links[0];
    const linkCursorStyle = await link.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });

    console.log('Link cursor style:', linkCursorStyle);

    // リンク内の子要素も確認
    const linkChildren = await link.locator('*').all();
    if (linkChildren.length > 0) {
      const childCursorStyle = await linkChildren[0].evaluate((el) => {
        return window.getComputedStyle(el).cursor;
      });
      console.log('Link child cursor style:', childCursorStyle);
    }
  }

  // 特定のクラスを持つ要素を確認
  const cursorPointerElements = await page.locator('.cursor-pointer').all();
  console.log(`Found ${cursorPointerElements.length} .cursor-pointer elements`);

  if (cursorPointerElements.length > 0) {
    const cursorStyle = await cursorPointerElements[0].evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    console.log('.cursor-pointer element cursor style:', cursorStyle);
  }

  // CSSが読み込まれているか確認
  const stylesheets = await page.evaluate(() => {
    const sheets = Array.from(document.styleSheets);
    return sheets.map(sheet => {
      try {
        return {
          href: sheet.href,
          rules: Array.from(sheet.cssRules || []).length
        };
      } catch (e) {
        return {
          href: sheet.href,
          error: 'Cannot access rules'
        };
      }
    });
  });

  console.log('\nLoaded stylesheets:', JSON.stringify(stylesheets, null, 2));

  // 特定のCSSルールが存在するか確認
  const hasCursorPointerRule = await page.evaluate(() => {
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        for (const rule of rules) {
          if (rule.cssText.includes('cursor: pointer')) {
            return true;
          }
        }
      } catch (e) {
        // CORS制限などで読み込めない場合はスキップ
      }
    }
    return false;
  });

  console.log('\nHas cursor:pointer rule:', hasCursorPointerRule);

  // 5秒待って手動で確認できるようにする
  console.log('\nWaiting 5 seconds for manual inspection...');
  await page.waitForTimeout(5000);

  await browser.close();
}

checkCursorStyle().catch(console.error);
