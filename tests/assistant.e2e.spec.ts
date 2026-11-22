import { test, expect, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  // Isolate speech plumbing; these tests do not certify microphone/model accuracy.
  await page.addInitScript(() => {
    const codes = ["en", "hi", "mr", "bn", "te", "ta", "gu", "kn", "pa", "or", "ml", "as", "ur"]
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      getVoices: () => codes.map(code => ({ lang: `${code}-IN`, localService: true, name: code, default: code === "en", voiceURI: code })),
      speak: (utterance: SpeechSynthesisUtterance) => { setTimeout(() => utterance.onend?.({} as SpeechSynthesisEvent), 10) },
      cancel: () => {}, addEventListener: () => {}, removeEventListener: () => {},
    } })
    class Recognition {
      static available() { return Promise.resolve("available") }
      onstart?: () => void
      start() { this.onstart?.() }
      abort() {}
      stop() {}
    }
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: Recognition })
  })
  await page.route("https://translate.google.com/**", route => route.abort())
  await page.route("https://translate.googleapis.com/**", route => route.abort())
  await page.route("**/api/assistant/voice", route => route.fulfill({ json: { available: false, asrLanguages: [], ttsLanguages: [] } }))
})

async function openGuide(page: Page) {
  await page.goto("/")
  await page.getByTestId("assistant-open").click()
  return page.getByRole("dialog", { name: "RuralHealth", exact: true })
}
async function send(page: Page, text: string) {
  const input = page.getByRole("textbox", { name: "Type instead", exact: true })
  await input.fill(text)
  await input.press("Enter")
}

test("guides a non-reader through symptom intake with explicit units", async ({ page }) => {
  const guide = await openGuide(page)
  await send(page, "check symptoms")
  await expect(guide).toContainText("How old")
  await send(page, "6 months")
  await expect(guide).toContainText(/how many days/i)
  await send(page, "1")
  await send(page, "mild")
  await expect(guide).toContainText("temperature")
  await send(page, "100")
  await expect(guide.getByRole("button", { name: "1. °C", exact: true })).toBeVisible()
  await guide.getByRole("button", { name: "2. °F", exact: true }).click()
  await send(page, "cough")
  await expect(guide).toContainText("health centre")
})

test("emergency guidance interrupts intake and works after network loss", async ({ page, context }) => {
  const guide = await openGuide(page)
  await context.setOffline(true)
  await send(page, "book an appointment and I have chest pain")
  await expect(guide.getByRole("link", { name: "Call 108", exact: true })).toHaveAttribute("href", "tel:108")
  await expect(guide).toContainText("Do not wait")
})

test("all13 language options include Assamese and Urdu direction", async ({ page }) => {
  const guide = await openGuide(page)
  const selector = guide.getByRole("combobox")
  await expect(selector.locator("option")).toHaveCount(13)
  await selector.selectOption("as")
  await expect(guide).toContainText("স্বাস্থ্য")
  await selector.selectOption("ur")
  await expect(page.getByTestId("voice-assistant")).toHaveAttribute("dir", "rtl")
})

test("arbitrary URL identity cannot enter a consultation", async ({ page }) => {
  await page.goto("/teleconsult/room?id=unverified-room&role=doctor&name=Fake")
  await expect(page.locator("iframe")).toHaveCount(0)
  await expect(page.getByRole("heading", { name: "Unable to join consultation" })).toBeVisible()
  await expect(page.getByRole("alert").filter({ hasText: "Open a valid appointment link to join" })).toBeVisible()
})

test("denied appointment authorization cannot initialize a conference", async ({ page }) => {
  await page.route("**/api/teleconsult/room", route => route.fulfill({ status: 403, json: { error: "Consultation access denied" } }))
  await page.goto("/teleconsult/room?appointmentId=55555555-5555-4555-8555-555555555555&role=doctor&name=Fake")
  await expect(page.getByRole("alert").filter({ hasText: "Consultation access denied" })).toBeVisible()
  await expect(page.locator("iframe")).toHaveCount(0)
})
