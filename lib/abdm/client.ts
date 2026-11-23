/**
 * lib/abdm/client.ts
 *
 * ABDM Sandbox Gateway Client Stub & Live Client.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Information Systems
 */

import { validateAbhaAddress, validateAbhaNumber } from "./validation"

/**
 * ABDM Sandbox Gateway Client Stub
 * Local format-checking stub. Does not contact NHA or verify identity.
 */
export class AbdmGatewayClient {
  // No national gateway request is implemented. Credentials cannot enable a stub.
  get isLive(): boolean {
    return false
  }

  /**
   * Verify an ABHA number or address
   */
  async verifyAbha(abhaInput: string): Promise<{
    verified: boolean
    mode: "live" | "simulated"
    abhaNumber?: string
    abhaAddress?: string
    message: string
  }> {
    if (abhaInput.includes("@")) {
      const v = validateAbhaAddress(abhaInput)
      if (!v.isValid) {
        return { verified: false, mode: "simulated", message: v.error || "Invalid" }
      }
      return {
        verified: true,
        mode: "simulated",
        abhaAddress: v.normalized,
        message: "ABHA Address format valid; identity not verified",
      }
    } else {
      const v = validateAbhaNumber(abhaInput)
      if (!v.isValid) {
        return { verified: false, mode: "simulated", message: v.error || "Invalid" }
      }
      return {
        verified: true,
        mode: "simulated",
        abhaNumber: v.normalized,
        message: "ABHA Number format valid; identity not verified",
      }
    }
  }
}

export const abdmGateway = new AbdmGatewayClient()
