import { afterEach, describe, expect, it, vi } from "vitest"
import fs from "node:fs"
import vm from "node:vm"
import { hideGoogleTranslateBanner } from "@/lib/i18n/google-translate"

function environment() {
  const values = new Map<string, string>()
  const priorities = new Map<string, string>()
  const attributes = new Map<string, string>()
  const style = {
    getPropertyValue: (name: string) => values.get(name) || "",
    getPropertyPriority: (name: string) => priorities.get(name) || "",
    setProperty: vi.fn((name: string, value: string, priority: string) => { values.set(name, value); priorities.set(name, priority) }),
  }
  const banner = { style, getAttribute: (name: string) => attributes.get(name), setAttribute: vi.fn((name: string, value: string) => attributes.set(name, value)) }
  return { banner, document: { querySelectorAll: () => [banner], body: { style: {} } } }
}
afterEach(() => vi.unstubAllGlobals())
describe("Translation banner observer stability", () => {
  it("settles after hiding a banner instead of generating new style mutations forever", () => {
    const state = environment(); vi.stubGlobal("document", state.document)
    hideGoogleTranslateBanner()
    const writes = state.banner.style.setProperty.mock.calls.length
    expect(writes).toBeGreaterThan(0)
    for (let index = 0; index < 10; index++) hideGoogleTranslateBanner()
    expect(state.banner.style.setProperty).toHaveBeenCalledTimes(writes)
    expect(state.banner.setAttribute).toHaveBeenCalledOnce()
  })
  it("keeps the early inline observer and client cleanup stable when both see the same banner", () => {
    const source = fs.readFileSync("app/layout.tsx", "utf8").replace(/\r\n/g, "\n")
    const match = source.match(/var cleanBanner = (function\(\) \{[\s\S]*?\n\s*\});\n\s*if \(typeof MutationObserver/)
    expect(match).not.toBeNull()
    const state = environment(); vi.stubGlobal("document", state.document)
    const clean = vm.runInNewContext("(" + match![1] + ")", { document: state.document })
    clean(); hideGoogleTranslateBanner()
    const writes = state.banner.style.setProperty.mock.calls.length
    for (let index = 0; index < 10; index++) { clean(); hideGoogleTranslateBanner() }
    expect(state.banner.style.setProperty).toHaveBeenCalledTimes(writes)
  })
  it("does not wrap patched DOM methods again when early initialization is repeated", () => {
    const source = fs.readFileSync("app/layout.tsx", "utf8")
    const boot = source.match(/__html:\s*`([\s\S]*?)`/)
    expect(boot).not.toBeNull()
    const nativeInsert = vi.fn(function (_node: unknown, _reference: unknown) { return _node })
    const nativeRemove = vi.fn(function (_node: unknown) { return _node })
    class TestNode {}
    Object.assign(TestNode.prototype, { insertBefore: nativeInsert, removeChild: nativeRemove })
    const observe = vi.fn()
    const state = environment()
    const context = vm.createContext({ Node: TestNode, window: {}, document: { ...state.document, documentElement: {} }, localStorage: { getItem: () => null }, MutationObserver: class { observe = observe } })
    vm.runInContext(boot![1], context)
    const first = (TestNode.prototype as any).insertBefore
    vm.runInContext(boot![1], context)
    expect((TestNode.prototype as any).insertBefore).toBe(first)
    expect((TestNode.prototype as any).insertBefore.call({}, {}, null)).toBeTruthy()
    expect(nativeInsert).toHaveBeenCalledOnce()
    expect(observe).toHaveBeenCalledOnce()
  })
})
