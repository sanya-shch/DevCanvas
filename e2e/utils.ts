import type { Page } from "@playwright/test";

/**
 * Sets Monaco's content to `text`, replacing whatever was there.
 *
 * Two things make plain `page.keyboard.insertText(text)` unreliable
 * for Monaco specifically:
 *
 * 1. Ctrl+A selects inside Monaco's own editing model (via its
 *    command system), not the native DOM selection of the hidden
 *    proxy textarea — so a bulk `insertText` right after Ctrl+A does
 *    not actually replace that selection. Pressing Delete first is a
 *    real Monaco edit command, so it reliably empties the model.
 * 2. A single `insertText` call with embedded "\n" characters does
 *    not turn into real new lines in Monaco's model the way it would
 *    in a plain <textarea> — it can collapse multi-line input onto
 *    one line. Splitting on "\n" and pressing a real "Enter" between
 *    lines sidesteps that; `insertText` per line (rather than
 *    `.type()`) avoids the language's autoClosingPairs mangling
 *    typed brackets/quotes.
 */
export async function setMonacoContent(page: Page, text: string) {
  const monacoEditor = page.locator(".monaco-editor").first();

  await monacoEditor.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.press("Delete");

  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i += 1) {
    if (i > 0) {
      await page.keyboard.press("Enter");
    }

    if (lines[i]) {
      await page.keyboard.insertText(lines[i]);
    }
  }
}
