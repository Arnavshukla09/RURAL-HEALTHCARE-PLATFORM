"use client"

/**
 * components/authentication/parts/RegisterForm.tsx
 *
 * Registration form for new patients on Rural Healthcare Platform.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Auth Subsystem
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TabsContent } from "@/components/ui/tabs"
import { Eye, EyeOff, User, Mail, Phone, Loader2 } from "lucide-react"
import type { AuthFormData } from "../types"

interface RegisterFormProps {
  en: boolean
  t: any
  formData: AuthFormData
  onInputChange: (field: string, value: string) => void
  onSignUp: (e: React.FormEvent) => void
  isLoading: boolean
}

export function RegisterForm({
  en,
  t,
  formData,
  onInputChange,
  onSignUp,
  isLoading,
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <TabsContent value="register" className="space-y-4">
      <form onSubmit={onSignUp}>
        <div className="space-y-2">
          <Label htmlFor="reg-name">{t.name}</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="reg-name"
              className="pl-10"
              value={formData.name}
              onChange={(e) => onInputChange("name", e.target.value)}
              placeholder={en ? "Your full name" : "आपका पूरा नाम"}
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="space-y-2 mt-3">
          <Label htmlFor="reg-email">{t.email}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="reg-email"
              type="email"
              className="pl-10"
              value={formData.email}
              onChange={(e) => onInputChange("email", e.target.value)}
              placeholder="your@email.com"
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="space-y-2 mt-3">
          <Label htmlFor="reg-phone">{t.phone}</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="reg-phone"
              type="tel"
              className="pl-10"
              value={formData.phone}
              onChange={(e) => onInputChange("phone", e.target.value)}
              placeholder="+91 9876543210"
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="space-y-2 mt-3">
          <Label htmlFor="reg-password">{t.password}</Label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              className="pr-10"
              value={formData.password}
              onChange={(e) => onInputChange("password", e.target.value)}
              placeholder={en ? "Create a password" : "पासवर्ड बनाएं"}
              disabled={isLoading}
            />
            <Button
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
        <div className="space-y-2 mt-3">
          <Label htmlFor="reg-confirm">{t.confirmPassword}</Label>
          <Input
            id="reg-confirm"
            type={showPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => onInputChange("confirmPassword", e.target.value)}
            placeholder={en ? "Confirm your password" : "पासवर्ड पुष्टि करें"}
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          className="w-full mt-5 gradient-primary text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t.registerBtn}
            </>
          ) : (
            t.registerBtn
          )}
        </Button>
      </form>
    </TabsContent>
  )
}
