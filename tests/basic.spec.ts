import { expect, test } from "playwright-test-coverage";

test.beforeEach(async ({ page }) => {
  await page.addInitScript({
    path: "tests/init.ts",
  });
});

test("has correct title", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading").getByText("Imagelightbox"),
  ).toBeVisible();
});

test("opens and closes the lightbox", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("activity").getByRole("link").first().click();
  await expect(page.locator("#ilb-activity-indicator")).toBeVisible();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-activity-indicator")).toBeHidden();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo1.jpg",
  );
  await page.locator("#ilb-overlay").dispatchEvent("click");
  await expect(page.locator("#ilb-image")).toBeHidden();
});

test("shows the overlay", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("overlay").getByRole("link").first().click();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo1.jpg",
  );
  await expect(page.locator("#ilb-overlay")).toBeVisible();
  await page.locator("#ilb-overlay").dispatchEvent("click");
  await expect(page.locator("#ilb-image")).toBeHidden();
});

test("can be closed with the close button", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("close-button").getByRole("link").first().click();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo1.jpg",
  );
  await expect(page.locator("#ilb-close-button")).toBeVisible();
  await page.locator("#ilb-close-button").dispatchEvent("click");
  await expect(page.locator("#ilb-image")).toBeHidden();
});

test("shows a caption", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("caption").getByRole("link").first().click();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo1.jpg",
  );
  await expect(page.getByText("Sunset in Tanzania")).toHaveId("ilb-caption");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo2.jpg",
  );
  await expect(page.locator("#ilb-caption")).toBeHidden();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo3.jpg",
  );
  await expect(page.getByText("Just another sunset in Tanzania")).toHaveId(
    "ilb-caption",
  );
});

test("can be triggered manually", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Click me!" }).click();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo1.jpg",
  );
});

test("can be controlled with image clicks", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("overlay").getByRole("link").first().click();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo1.jpg",
  );
  await page.locator("#ilb-image").click({ position: { x: 200, y: 32 } });
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo2.jpg",
  );
  await page.locator("#ilb-image").click({ position: { x: 200, y: 32 } });
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo3.jpg",
  );
  await page.locator("#ilb-image").click({ position: { x: 20, y: 32 } });
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo2.jpg",
  );
});

test("can be controlled with arrows", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("arrows").getByRole("link").first().click();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo1.jpg",
  );
  await page.locator("#ilb-arrow-right").click();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo2.jpg",
  );
  await page.locator("#ilb-arrow-right").click();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo3.jpg",
  );
  await page.locator("#ilb-arrow-left").click();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo2.jpg",
  );
});

test("can be controlled with keyboard", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("fullscreen").getByRole("link").first().click();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo1.jpg",
  );
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo2.jpg",
  );
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo3.jpg",
  );
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo2.jpg",
  );
  await page.keyboard.press("Tab");
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo2.jpg",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("#ilb-image")).toBeHidden();
});

test("can add images dynamically", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add another image" }).click();
  await expect(
    page.getByTestId("dynamic").getByRole("link").nth(3),
  ).toBeVisible();
  await page.getByTestId("dynamic").getByRole("link").nth(3).click();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo4.jpg",
  );
});

test("has a working history", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("history").getByRole("link").first().click();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo1.jpg",
  );
  await page.locator("#ilb-arrow-right").click();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo2.jpg",
  );
  await page.locator("#ilb-overlay").dispatchEvent("click");
  await expect(page.locator("#ilb-image")).toBeHidden();
  await page.goBack();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo2.jpg",
  );
  await page.goBack();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo1.jpg",
  );
  await page.goBack();
  await expect(page.locator("#ilb-image")).toBeHidden();
});

test("can open history links", async ({ page }) => {
  await page.goto("/?imageLightboxIndex=2&imageLightboxSet=j");
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo3.jpg",
  );
});

test.describe("doesn't break on invalid history links", () => {
  test("invalid index", async ({ page }) => {
    await page.goto("/?imageLightboxIndex=42&imageLightboxSet=j");
    await expect(page.locator("#ilb-image")).toBeHidden();
  });
  test("no index", async ({ page }) => {
    await page.goto("/?imageLightboxSet=j");
    await expect(page.locator("#ilb-image")).toBeHidden();
  });
  test("invalid set", async ({ page }) => {
    await page.goto("/?imageLightboxIndex=2&imageLightboxSet=asdf");
    await expect(page.locator("#ilb-image")).toBeHidden();
  });
});

test("has a working history with IDs", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("history-ids").getByRole("link").first().click();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo1.jpg",
  );
  await page.locator("#ilb-arrow-right").click();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo2.jpg",
  );
  await page.locator("#ilb-overlay").dispatchEvent("click");
  await expect(page.locator("#ilb-image")).toBeHidden();
  await page.goBack();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo2.jpg",
  );
  await page.goBack();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo1.jpg",
  );
  await page.goBack();
  await expect(page.locator("#ilb-image")).toBeHidden();
});

test("can open history links with IDs", async ({ page }) => {
  await page.goto("/?imageLightboxIndex=2&imageLightboxSet=k");
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo3.jpg",
  );
});

test("has a working navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("navigation").getByRole("link").first().click();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo1.jpg",
  );
  await expect(page.locator(".ilb-navigation a").first()).toBeVisible();
  await expect(page.locator(".ilb-navigation a").nth(1)).toBeVisible();
  await expect(page.locator(".ilb-navigation a").nth(2)).toBeVisible();
  await page.locator(".ilb-navigation a").nth(2).click();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo3.jpg",
  );
  await page.locator(".ilb-navigation a").nth(1).click();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo2.jpg",
  );
  await page.locator(".ilb-navigation a").nth(1).click();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo2.jpg",
  );
});

test("quits on end", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("quit").getByRole("link").first().click();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo1.jpg",
  );
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo2.jpg",
  );
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo3.jpg",
  );
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#ilb-image")).toBeHidden();
  await page.getByTestId("quit").getByRole("link").first().click();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo1.jpg",
  );
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#ilb-image")).toBeHidden();
});

test("quits on image click", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("quit").getByRole("link").first().click();
  await expect(page.locator("#ilb-image")).toBeVisible();
  await expect(page.locator("#ilb-image")).toHaveAttribute(
    "src",
    "images/demo1.jpg",
  );
  await page.locator("#ilb-image").click();
  await expect(page.locator("#ilb-image")).toBeHidden();
});
