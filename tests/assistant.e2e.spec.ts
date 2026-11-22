import { test, expect, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  // Isolate speech plumbing; these tests do not certify microphone/model accuracy.
  await page.addInitScript(() => {
    const codes = ["en", "hi", "mr", "bn", "te", "ta", "gu", "kn", "pa", "or", "ml", "as", "ur"]
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      getVoices: () => codes.map(code => ({ lang: `${code}-IN`, localService: true, name: code, default: code === "en", voiceURI: code })),
      speak: (utterance: SpeechSynthesisUtterance) => { (window as any).__speechCalls = ((window as any).__speechCalls || 0) + 1; if (!(window as any).__holdSpeech) setTimeout(() => utterance.onend?.({} as SpeechSynthesisEvent), 10) },
      cancel: () => {}, addEventListener: () => {}, removeEventListener: () => {},
    } })
    // Fake voice records cannot be assigned to a real native utterance.voice setter.
    // Mock both sides of synthesis; otherwise TypeError prevents any speech turn.
    class Utterance { constructor(public text: string) {} }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: Utterance })
    class Recognition {
      static available() { (window as any).__localRecognitionChecks = ((window as any).__localRecognitionChecks || 0) + 1; return Promise.resolve("available") }
      onstart?: () => void
      start() { (window as any).__activeRecognition = this; this.onstart?.() }
      abort() {}
      stop() {}
    }
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: Recognition })
    ;(window as any).__localRecognitionChecks = 0
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

test("probes offline recognition only after the user activates offline voice", async ({ page, context }) => {
  const guide = await openGuide(page)
  expect(await page.evaluate(() => (window as any).__localRecognitionChecks)).toBe(0)
  await guide.getByRole("button", { name: "Stop", exact: true }).click()
  await context.setOffline(true)
  await guide.getByRole("button", { name: "Speak", exact: true }).click()
  await expect.poll(() => page.evaluate(() => (window as any).__localRecognitionChecks)).toBeGreaterThan(0)
})

test("font and contrast commands share toolbar state without trapping an ongoing task", async ({ page }) => {
  const guide = await openGuide(page)
  await send(page, "check symptoms")
  await send(page, "Increase the font size.")
  await expect(page.locator("html")).toHaveCSS("font-size", "18px")
  await send(page, "accessibility options")
  await expect(page.getByTestId("accessibility-font-size")).toHaveText("18px")
  await page.getByTestId("accessibility-toolbar").getByRole("button", { name: "Increase font size", exact: true }).click()
  await expect(page.locator("html")).toHaveCSS("font-size", "20px")
  await send(page, "high contrast on")
  await expect(page.locator("html")).toHaveAttribute("data-high-contrast", "")
  await send(page, "30")
  await expect(guide).toContainText("how many days")
  await send(page, "correct last answer")
  await expect(guide.locator("p").filter({ hasText: "How old" }).last()).toBeVisible()
  await send(page, "31")
  await expect(guide).toContainText("how many days")
  await send(page, "new request health information")
  await expect(page).toHaveURL(/health-info/)
  await expect(guide).toBeVisible()
  await send(page, "reset accessibility")
  await expect(page.locator("html")).toHaveCSS("font-size", "16px")
  await expect(page.locator("html")).not.toHaveAttribute("data-high-contrast")
})

test("all thirteen native accessibility commands change actual root settings", async ({ page }) => {
  await openGuide(page)
  const { CONTROL_PROMPTS } = await import("../lib/assistant/control-catalog")
  for (const [code, catalog] of Object.entries(CONTROL_PROMPTS)) {
    await page.getByRole("dialog", { name: "RuralHealth", exact: true }).getByRole("combobox").selectOption(code)
    const input = page.getByTestId("voice-assistant").locator('input')
    await input.fill(catalog.resetAccessibility); await input.press("Enter")
    await input.fill(catalog.increaseFont); await input.press("Enter")
    await expect(page.locator("html")).toHaveCSS("font-size", "18px")
    await input.fill(catalog.contrastOn); await input.press("Enter")
    await expect(page.locator("html")).toHaveAttribute("data-high-contrast", "")
  }
})

test("a new task interrupts a slow question and late replies cannot resurrect it", async ({ page }) => {
  let release: (() => void) | undefined
  let requested = false
  await page.route("**/api/assistant/voice", async route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { available: false, conversationAvailable: true, asrLanguages: [], ttsLanguages: [] } })
    requested = true
    await new Promise<void>(resolve => { release = resolve })
    await route.fulfill({ json: { reply: "STALE QUESTION REPLY" } }).catch(() => {})
  })
  const guide = await openGuide(page)
  await send(page, "Explain drinking water")
  await expect.poll(() => requested).toBe(true)
  await expect(guide.getByRole("textbox", { name: "Type instead", exact: true })).toBeEnabled()
  await send(page, "check symptoms")
  await expect(guide).toContainText("How old")
  release?.()
  await send(page, "30")
  await expect(guide).toContainText("how many days")
  await expect(guide).not.toContainText("STALE QUESTION REPLY")
  await guide.getByRole("button", { name: "Cancel task", exact: true }).click()
  await send(page, "health information")
  await expect(page).toHaveURL(/health-info/)
})

test("wake-prefixed barge-in replaces a spoken reply without waiting for playback", async ({ page }) => {
  await page.addInitScript(() => { (window as any).__holdSpeech = true })
  const guide = await openGuide(page)
  await guide.getByRole("button", { name: "Listen again", exact: true }).click()
  await expect.poll(() => page.evaluate(() => Boolean((window as any).__activeRecognition?.continuous))).toBe(true)
  await page.evaluate(() => {
    const recognition = (window as any).__activeRecognition
    recognition.onresult({ resultIndex: 0, results: [{ 0: { transcript: "RuralHealth new request health information", confidence: 1 }, isFinal: true }] })
  })
  await expect(page).toHaveURL(/health-info/)
})

test("page options invoke registered navigation and refuse stale selections", async ({ page }) => {
  const guide = await openGuide(page)
  await send(page, "page options")
  await expect(guide.getByTestId("page-voice-options").getByRole("button")).toHaveCount(5)
  await send(page, "more options")
  await expect(guide.getByTestId("page-voice-options")).toBeVisible()
  await send(page, "select Symptoms")
  await expect(page).toHaveURL(/symptom-checker/)
  await send(page, "page options")
  await expect(guide.getByTestId("page-voice-options")).toBeVisible()
  await send(page, "cancel task")
  await expect(guide.getByTestId("page-voice-options")).toHaveCount(0)
  await expect(guide).toContainText("Task cancelled")
})

test("changed or disabled control targets cannot execute an old numbered option", async ({ page }) => {
  const guide = await openGuide(page)
  await send(page, "page options")
  const control = page.locator('nav [data-voice-control]').filter({ hasText: "Symptoms" }).first()
  await control.evaluate(element => element.setAttribute("disabled", ""))
  await send(page, "select 3")
  await expect(page).toHaveURL("/")
  await expect(guide).toContainText("page or options changed")
})

test("registered form fields update React state and secure fields stay outside chat", async ({ page }) => {
  await page.goto("/login")
  await page.getByTestId("assistant-open").click()
  const guide = page.getByRole("dialog", { name: "RuralHealth", exact: true })
  await send(page, "select Email Address")
  await expect(guide).toContainText("Enter a value")
  await send(page, "voice-test@example.test")
  await expect(page.locator("#login-email")).toHaveValue("voice-test@example.test")
  await expect(guide).not.toContainText("voice-test@example.test")
  await send(page, "cancel task")
  await send(page, "select Password")
  await expect(guide).toContainText("secure device input")
  await expect(page.locator("#login-password")).toHaveValue("")
})

test("accessibility remains available on the emergency page", async ({ page }) => {
  await page.goto("/emergency")
  await page.getByTestId("assistant-open").click()
  await send(page, "increase font size")
  await expect(page.locator("html")).toHaveCSS("font-size", "18px")
  await send(page, "accessibility options")
  await expect(page.getByTestId("accessibility-font-size")).toHaveText("18px")
  await send(page, "new request decrease font size")
  await expect(page.locator("html")).toHaveCSS("font-size", "16px")
  await send(page, "close assistant")
  await expect(page.getByTestId("assistant-open")).toBeVisible()
})
