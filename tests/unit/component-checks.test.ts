import { describe, expect, it } from "vitest"
import ts from "typescript"
import { hasExport, lineLimit, localImports } from "../../scripts/ci/component-checks.mjs"

const parse = (source: string) => ts.createSourceFile("sample.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

describe("source structure checker", () => {
  it("finds multiline imports, compatibility exports and literal dynamic imports", () => {
    const source = parse(`import {
      Widget
    } from "@/components/Widget"
    export { default } from "./feature/index"
    const lazy = import("../optional")
    import React from "react"
    // import Fake from "./missing"
    const label = 'import Fake from "./also-missing"'
    `)
    expect(localImports(source).map((item: { specifier: string }) => item.specifier)).toEqual([
      "@/components/Widget", "./feature/index", "../optional",
    ])
  })

  it("accepts component and compatibility export forms", () => {
    expect(hasExport(parse("export default function Widget() { return null }"))).toBe(true)
    expect(hasExport(parse('export { default } from "./feature/index"'))).toBe(true)
    expect(hasExport(parse("export type Props = { name: string }"))).toBe(true)
    expect(hasExport(parse("const Widget = () => null"))).toBe(false)
  })

  it("keeps the API ceiling strict and exemptions narrowly scoped", () => {
    expect(lineLimit("app/api/appointments/route.ts")).toBe(149)
    expect(lineLimit("components/doctor-patients/index.tsx")).toBe(400)
    expect(lineLimit("components\\ui\\button.tsx")).toBeNull()
    expect(lineLimit("components/ui-copy/example.tsx")).toBe(400)
    expect(lineLimit("lib/data/real-doctors.ts")).toBeNull()
    expect(lineLimit("lib/data/real-doctors.ts.backup.ts")).toBe(400)
  })
})
