// Windows WebDriver smoke test for GoalDay.
//
// Drives the real built binary through `tauri-driver` (which brokers to
// msedgedriver / the WebView2 runtime) and asserts the UI actually renders and
// is interactive — the thing a successful `cargo build` can NOT prove.
//
// Env:
//   TAURI_APP_PATH  absolute path to the built .exe (required)
//   TAURI_DRIVER_PORT  port tauri-driver listens on (default 4444)
//
// Exit 0 = the window rendered and a nav click worked. Non-zero = failure.

import { Builder, By, until } from "selenium-webdriver";

const APP = process.env.TAURI_APP_PATH;
const PORT = process.env.TAURI_DRIVER_PORT || "4444";

if (!APP) {
  console.error("TAURI_APP_PATH not set");
  process.exit(2);
}

const capabilities = {
  browserName: "wry",
  "tauri:options": { application: APP },
  // tauri-driver forwards these to the native WebView2 driver.
  "ms:edgeOptions": {},
};

async function main() {
  console.log(`[smoke] connecting to tauri-driver on :${PORT}, app = ${APP}`);
  const driver = await new Builder()
    .usingServer(`http://127.0.0.1:${PORT}`)
    .withCapabilities(capabilities)
    .build();

  try {
    // 1) The React root must mount and produce a sidebar <nav> with buttons.
    console.log("[smoke] waiting for sidebar nav to render…");
    const nav = await driver.wait(until.elementLocated(By.css("nav")), 20000);
    const buttons = await nav.findElements(By.css("button"));
    if (buttons.length < 5) {
      throw new Error(`expected >=5 nav buttons, got ${buttons.length}`);
    }
    console.log(`[smoke] nav rendered with ${buttons.length} buttons`);

    // 2) The brand text ("GoalDay" / "目标日") must be present in the body.
    const bodyText = await driver.findElement(By.css("body")).getText();
    if (!/GoalDay|目标日/.test(bodyText)) {
      throw new Error("brand text not found in rendered body");
    }
    console.log("[smoke] brand text present");

    // 3) Clicking a nav item must not crash the webview (switch to a later view).
    await buttons[buttons.length - 2].click(); // second-to-last = Stats
    await driver.sleep(500);
    const stillAlive = await driver.findElements(By.css("nav"));
    if (stillAlive.length === 0) {
      throw new Error("nav disappeared after clicking a view — webview crashed?");
    }
    console.log("[smoke] nav click survived — UI is interactive");

    console.log("[smoke] PASS ✅");
  } finally {
    await driver.quit();
  }
}

main().catch((err) => {
  console.error("[smoke] FAIL ❌", err.message ?? err);
  process.exit(1);
});
