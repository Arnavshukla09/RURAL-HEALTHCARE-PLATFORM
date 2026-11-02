"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ShieldCheck,
  Lock,
  KeyRound,
  AlertCircle,
} from "lucide-react"

interface NoInviteCardProps {
  manualToken: string
  setManualToken: (val: string) => void
  tokenInputError: string
  onManualTokenSubmit: (e: React.FormEvent) => void
  onReturnHome: () => void
  onDoctorLogin: () => void
}

export function NoInviteCard({
  manualToken,
  setManualToken,
  tokenInputError,
  onManualTokenSubmit,
  onReturnHome,
  onDoctorLogin,
}: NoInviteCardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <Card className="max-w-xl w-full border-2 border-indigo-700/60 shadow-2xl rounded-3xl bg-slate-950/90 text-white overflow-hidden backdrop-blur-md">
        {/* Locked Security Header */}
        <div className="bg-gradient-to-b from-rose-900/40 to-slate-950 p-6 sm:p-8 text-center border-b border-indigo-800/40">
          <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="h-8 w-8 text-rose-400" />
          </div>
          <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold mb-2">
            Identity Theft Protection Active
          </Badge>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Restricted Clinician Invitation Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
            Open public claiming of doctors has been disabled to prevent identity theft and protect NMC credentials. Access is strictly granted via <strong>private tokenized invitation links</strong>.
          </p>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Explanation of Security Gating */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 space-y-2.5 text-xs text-slate-300">
            <h3 className="font-bold text-indigo-300 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>How Clinicians Receive Private Access:</span>
            </h3>
            <ul className="space-y-1.5 list-disc list-inside text-slate-400 text-[11px] leading-relaxed">
              <li>
                <strong className="text-slate-200">Patient Appointment Request:</strong> When a patient books an appointment, an encrypted private link with your secret token is sent directly to your phone/WhatsApp.
              </li>
              <li>
                <strong className="text-slate-200">Administrator Direct Invitation:</strong> Platform medical officers can dispatch an invitation link from the Administrator Console.
              </li>
              <li>
                <strong className="text-slate-200">Admin Approval Gate:</strong> All submissions must be reviewed and verified against NMC state registries before dashboard activation.
              </li>
            </ul>
          </div>

          {/* Paste Invitation Link Form */}
          <form onSubmit={onManualTokenSubmit} className="space-y-3">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-indigo-400" />
              <span>Have a Private Invite Link from SMS or WhatsApp?</span>
            </label>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Paste your private invitation URL here..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="bg-slate-900 border-indigo-700/60 text-white placeholder:text-slate-500 text-xs rounded-xl h-10"
              />
              {tokenInputError && (
                <p className="text-rose-400 text-[11px] flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{tokenInputError}</span>
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 rounded-xl shadow-xs"
            >
              Verify & Open Invitation
            </Button>
          </form>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReturnHome}
              className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
            >
              ← Return to Home
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDoctorLogin}
              className="text-indigo-400 hover:text-indigo-300 text-xs"
            >
              Doctor Login →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
