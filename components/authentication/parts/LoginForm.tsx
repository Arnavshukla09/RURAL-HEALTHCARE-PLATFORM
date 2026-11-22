"use client"

/**
 * components/authentication/parts/LoginForm.tsx
 *
 * Login form with 1-tap demo credentials and password recovery trigger.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Auth Subsystem
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TabsContent } from "@/components/ui/tabs"
import { Eye, EyeOff, Mail, Loader2 } from "lucide-react"
import type { AuthFormData } from "../types"

interface LoginFormProps {
  en: boolean
  t: any
  formData: AuthFormData
  onInputChange: (field: string, value: string) => void
  onFillDemo: (type: "patient" | "doctor" | "admin") => void
  onLogin: (e: React.FormEvent) => void
  onForgotPassword: () => void
  isLoading: boolean
}

export function LoginForm({
  en,
  t,
  formData,
  onInputChange,
  onFillDemo,
  onLogin,
  onForgotPassword,
  isLoading,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <TabsContent value="login" className="space-y-4">
      {/* Quick 1-Tap Demo Accounts */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700">
            {en ? "Demo Accounts (1-Tap Fill):" : "डेमो खाते (1-क्लिक):"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button data-voice-control="ui.24af5b1ecc313961"
            type="button"
            onClick={() => onFillDemo("patient")}
            className="px-2 py-1.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 font-medium transition-colors text-center text-xs"
            disabled={isLoading}
          >
            👤 Patient
          </button>
          <button data-voice-control="ui.8ad31c0f71393a33"
            type="button"
            onClick={() => onFillDemo("doctor")}
            className="px-2 py-1.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 font-medium transition-colors text-center text-xs"
            disabled={isLoading}
          >
            🩺 Doctor
          </button>
          <button data-voice-control="ui.c731f57581a85bc3"
            type="button"
            onClick={() => onFillDemo("admin")}
            className="px-2 py-1.5 rounded-md bg-purple-50 border border-purple-200 text-purple-800 hover:bg-purple-100 font-medium transition-colors text-center text-xs"
            disabled={isLoading}
          >
            ⚡ Admin
          </button>
        </div>
      </div>

      <form data-voice-control="ui.fb32904e0489e274" onSubmit={onLogin}>
        <div className="space-y-2">
          <Label htmlFor="login-email">{t.email}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input data-voice-control="ui.d9a05694116d6a6e"
              id="login-email"
              type="email"
              className="pl-10"
              value={formData.email}
              onChange={(e) => onInputChange("email", e.target.value)}
              placeholder="your@email.com"
              disabled={isLoading} aria-label={[t.email].join(' ')}
            />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Label htmlFor="login-password">{t.password}</Label>
          <div className="relative">
            <Input data-voice-control="ui.371c706ce4e0df90"
              id="login-password"
              type={showPassword ? "text" : "password"}
              className="pr-10"
              value={formData.password}
              onChange={(e) => onInputChange("password", e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading} aria-label={[t.password].join(' ')}
            />
            <Button data-voice-control="ui.84a30ff88dc37f7c"
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Forgot password */}
        <div className="flex justify-end mt-2">
          <button data-voice-control="ui.35a8a6a989dfaa6f"
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-teal-600 hover:text-teal-800 underline-offset-2 hover:underline"
            disabled={isLoading}
          >
            {t.forgotPassword}
          </button>
        </div>

        <Button data-voice-control="ui.96145683862410ac"
          type="submit"
          className="w-full mt-5 gradient-primary text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t.loginBtn}
            </>
          ) : (
            t.loginBtn
          )}
        </Button>
      </form>
    </TabsContent>
  )
}
