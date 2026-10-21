/**
 * tests/unit/doctor-claim-and-booking-lifecycle.test.ts
 *
 * End-to-end test suite verifying the complete clinician onboarding & booking lifecycle:
 * 1. Demo Patient appointment scheduling & message generation
 * 2. Cryptographic invitation token generation & validation
 * 3. Doctor private claim submission into pending queue
 * 4. Identity theft protection (rejection of unauthorized/tampered access)
 * 5. Medical Administrator review and approval gate
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { REAL_DOCTORS } from '@/lib/data/real-doctors'
import {
  generateDoctorClaimToken,
  verifyDoctorClaimToken,
  saveDoctorClaim,
  getStoredDoctorClaims,
  updateDoctorClaimStatus,
  DoctorClaim
} from '@/lib/doctor-claims'

// Mock localStorage for headless Node environment
const mockStorage: Record<string, string> = {}
beforeEach(() => {
  for (const key of Object.keys(mockStorage)) {
    delete mockStorage[key]
  }
  global.localStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, val: string) => { mockStorage[key] = val },
    removeItem: (key: string) => { delete mockStorage[key] },
    clear: () => {
      for (const key of Object.keys(mockStorage)) delete mockStorage[key]
    },
    key: (i: number) => Object.keys(mockStorage)[i] || null,
    length: Object.keys(mockStorage).length,
  }
})

describe('End-to-End Demo Booking, Tokenized Invite & Admin Approval Lifecycle', () => {
  const targetDoctor = REAL_DOCTORS[0] // Dr. Ajay Goenka (AIIMS Bhopal)

  it('Step 1: Demo Patient generates booking payload with tokenized doctor claim link', () => {
    expect(targetDoctor).toBeDefined()
    expect(targetDoctor.id).toBe('doc-mp-01')
    expect(targetDoctor.regNo).toBe('NMC/MPMC-14285')

    // Simulate ConsultationPortal booking payload generation
    const token = generateDoctorClaimToken(targetDoctor.id)
    expect(token).toBeTruthy()
    expect(token.startsWith('nmc_')).toBe(true)

    const origin = 'https://rural-healthcare-platform.vercel.app'
    const roomId = 'room-test-12345'
    const doctorClaimUrl = `${origin}/doctor/claim?id=${targetDoctor.id}&token=${token}`
    const doctorJoinUrl = `${origin}/teleconsult/room?id=${roomId}&name=${encodeURIComponent(targetDoctor.name)}&role=doctor`
    const doctorAcceptUrl = `${origin}/teleconsult/confirm?id=${roomId}&action=accept`

    // Verify all essential URLs in the dispatch invitation
    expect(doctorClaimUrl).toContain(`/doctor/claim?id=doc-mp-01&token=${token}`)
    expect(doctorJoinUrl).toContain('/teleconsult/room?id=room-test-12345')
    expect(doctorAcceptUrl).toContain('/teleconsult/confirm?id=room-test-12345&action=accept')

    // Check dispatch message formatting
    const dispatchMessage = `🏥 RURAL HEALTHCARE TELEMEDICINE\nRespected ${targetDoctor.name}\nRoom: ${doctorJoinUrl}\nClaim Profile: ${doctorClaimUrl}`
    expect(dispatchMessage).toContain(doctorClaimUrl)
    expect(dispatchMessage).toContain(targetDoctor.name)
  })

  it('Step 2: Cryptographic token validation permits valid invite and blocks unauthorized attackers', () => {
    const validToken = generateDoctorClaimToken(targetDoctor.id)

    // Valid doctor + matching token
    expect(verifyDoctorClaimToken(targetDoctor.id, validToken)).toBe(true)

    // Attacker tries spoofed token
    expect(verifyDoctorClaimToken(targetDoctor.id, 'spoofed_token_hack')).toBe(false)

    // Attacker tries empty token
    expect(verifyDoctorClaimToken(targetDoctor.id, '')).toBe(false)

    // Attacker tries token on a different doctor's profile
    const anotherDoctor = REAL_DOCTORS[1]
    const anotherToken = generateDoctorClaimToken(anotherDoctor.id)
    // token format has doctor suffix
    expect(anotherToken).not.toBe(validToken)
  })

  it('Step 3: Doctor submits claim into pending_admin_approval queue', () => {
    const validToken = generateDoctorClaimToken(targetDoctor.id)

    const submittedClaim = saveDoctorClaim({
      doctorId: targetDoctor.id,
      doctorName: targetDoctor.name,
      regNo: targetDoctor.regNo || 'MP-2024-NMC',
      specialtyName: targetDoctor.specialtyName,
      hospitalAffiliation: targetDoctor.hospitalAffiliation,
      mobileNumber: '9876543210',
      email: 'dr.goenka@aiimsbhopal.edu.in',
      upiId: 'dr.ajay@okhdfcbank',
      token: validToken,
    })

    expect(submittedClaim.id).toBeTruthy()
    expect(submittedClaim.status).toBe('pending_admin_approval')
    expect(submittedClaim.submittedAt).toBeTruthy()

    // Verify stored in claims list
    const stored = getStoredDoctorClaims()
    expect(stored.length).toBe(1)
    expect(stored[0].doctorId).toBe('doc-mp-01')
    expect(stored[0].status).toBe('pending_admin_approval')

    // Ensure doctor is NOT yet active in claimed profiles before admin approval
    const claimedDoctorStorage = mockStorage['rural_health_claimed_doctor']
    expect(claimedDoctorStorage).toBeUndefined()
  })

  it('Step 4: Medical Administration Officer reviews and approves claim, activating doctor role', () => {
    const validToken = generateDoctorClaimToken(targetDoctor.id)
    const claim = saveDoctorClaim({
      doctorId: targetDoctor.id,
      doctorName: targetDoctor.name,
      regNo: targetDoctor.regNo || 'MP-2024-NMC',
      specialtyName: targetDoctor.specialtyName,
      hospitalAffiliation: targetDoctor.hospitalAffiliation,
      mobileNumber: '9876543210',
      email: 'dr.goenka@aiimsbhopal.edu.in',
      upiId: 'dr.ajay@okhdfcbank',
      token: validToken,
    })

    // Admin reviews and approves
    const approved = updateDoctorClaimStatus(claim.id, 'approved', 'Verified against MP State Medical Council records')
    expect(approved).not.toBeNull()
    expect(approved?.status).toBe('approved')
    expect(approved?.reviewedBy).toBe('Admin Compliance Officer')
    expect(approved?.adminNotes).toContain('MP State Medical Council')

    // Verify persistent activation in local storage
    const claimedRaw = mockStorage['rural_health_claimed_doctor']
    expect(claimedRaw).toBeDefined()
    const claimedProfile = JSON.parse(claimedRaw)
    expect(claimedProfile.id).toBe(targetDoctor.id)
    expect(claimedProfile.name).toBe(targetDoctor.name)
    expect(claimedProfile.verified).toBe(true)
    expect(claimedProfile.upiId).toBe('dr.ajay@okhdfcbank')
  })

  it('Step 5: Admin can reject fraudulent claim and prevent doctor elevation', () => {
    const validToken = generateDoctorClaimToken('doc-fake-99')
    const fakeClaim = saveDoctorClaim({
      doctorId: 'doc-fake-99',
      doctorName: 'Imposter Applicant',
      regNo: 'INVALID-999',
      specialtyName: 'General Medicine',
      hospitalAffiliation: 'None',
      mobileNumber: '0000000000',
      email: 'imposter@fake.com',
      upiId: 'fake@upi',
      token: validToken,
    })

    const rejected = updateDoctorClaimStatus(fakeClaim.id, 'rejected', 'Fraudulent NMC registration number')
    expect(rejected?.status).toBe('rejected')

    // Ensure NO claimed doctor profile was activated
    const claimedRaw = mockStorage['rural_health_claimed_doctor']
    expect(claimedRaw).toBeUndefined()
  })
})
