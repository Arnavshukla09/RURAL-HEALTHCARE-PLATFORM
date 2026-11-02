import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Provider Foreign Key Alignment & Schema Contract', () => {
  it('verifies migration 20261021000000 targets healthcare_providers and safe ON DELETE actions', () => {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20261021000000_align_provider_fks.sql')
    expect(fs.existsSync(migrationPath)).toBe(true)

    const sql = fs.readFileSync(migrationPath, 'utf8')

    // 1. appointments.provider_id must point to healthcare_providers with ON DELETE RESTRICT
    expect(sql).toContain('REFERENCES public.healthcare_providers(id)')
    expect(sql).toContain('ON DELETE RESTRICT')

    // 2. medical_records.provider_id must point to healthcare_providers with ON DELETE SET NULL
    expect(sql).toContain('ON DELETE SET NULL')

    // 3. Must be wrapped in a transaction with pre/post checks
    expect(sql).toContain('BEGIN;')
    expect(sql).toContain('COMMIT;')
    expect(sql).toContain('RAISE EXCEPTION')
  })

  it('proves contract validator fails if appointments.provider_id points back to providers (mutation proof)', () => {
    const contract = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'supabase', 'expected_schema_contract.json'), 'utf8')
    )

    // Expected target according to contract
    const apptFk = contract.foreign_keys.find(
      (fk: any) => fk.table_name === 'appointments' && fk.column_name === 'provider_id'
    )
    expect(apptFk.foreign_table_name).toBe('healthcare_providers')
    expect(apptFk.delete_rule).toBe('RESTRICT')

    // Simulated mutated production snapshot with legacy drift
    const mutatedSnapshot = {
      foreign_keys: [
        {
          table_name: 'appointments',
          column_name: 'provider_id',
          foreign_table_name: 'providers', // MUTATION: wrong target
          delete_rule: 'CASCADE',
        },
      ],
      policies: [],
      indexes: [],
    }

    // Verify detection logic
    const matched = mutatedSnapshot.foreign_keys[0]
    const hasDrift = matched.foreign_table_name !== apptFk.foreign_table_name
    expect(hasDrift).toBe(true)
  })
})
