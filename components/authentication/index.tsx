"use client"

/**
 * components/authentication/index.tsx
 *
 * Modularized Authentication component for Rural Healthcare Platform.
 * Supports email/password authentication, demo account autofill, OAuth sign-in,
 * patient profile bootstrapping, and guest mode fallback.
 *
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Auth Subsystem
 */

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Heart } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { AuthenticationProps, AuthFormData } from "./types"
import { getAuthTranslations } from "./types"
import { LoginForm } from "./parts/LoginForm"
import { RegisterForm } from "./parts/RegisterForm"
import { OAuthGuestFooter } from "./parts/OAuthGuestFooter"

export function Authentication({ setUser, setCurrentPage, language }: AuthenticationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [formData, setFormData] = useState<AuthFormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<string[]>([])
  const [successMsg, setSuccessMsg] = useState("")
  const { toast } = useToast()

  const en = language === "en"
  const t = getAuthTranslations(en)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors([])
    setSuccessMsg("")
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const error = params.get("error")
      const errorDesc = params.get("error_description")

      if (error || errorDesc) {
        let msg = en
          ? "Sign-in was interrupted. Please try again or use email/password."
          : "साइन इन विफल रहा। कृपया पुनः प्रयास करें या ईमेल/पासवर्ड का उपयोग करें।"

        if (errorDesc?.includes("exchange external code")) {
          msg = en
            ? "Google OAuth configuration error: Check Client Secret and Redirect URIs in Supabase Dashboard."
            : "Google साइन-इन त्रुटि: कृपया Supabase में Google क्रेडेंशियल्स की जांच करें।"
        }

        setErrors([msg])
        toast({
          title: en ? "Sign-in Notice" : "साइन-इन सूचना",
          description: msg,
          variant: "destructive",
        })

        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [en, toast])

  const fillDemo = (demoType: "patient" | "doctor" | "admin") => {
    if (demoType === "patient") {
      setFormData({
        name: "Priya Sharma",
        email: "patient@ruralhealth.demo",
        phone: "+91 9876543210",
        password: "Patient@123",
        confirmPassword: "Patient@123",
      })
    } else if (demoType === "doctor") {
      setFormData({
        name: "Dr. Arjun",
        email: "doctor@ruralhealth.demo",
        phone: "+91 9876543211",
        password: "Doctor@123",
        confirmPassword: "Doctor@123",
      })
    } else if (demoType === "admin") {
      setFormData({
        name: "Admin User",
        email: "admin@ruralhealth.demo",
        phone: "+91 9876543212",
        password: "Admin@123",
        confirmPassword: "Admin@123",
      })
    }
    setErrors([])
    setSuccessMsg("")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email.trim() || !formData.password.trim()) {
      const msg = en ? "Email and password are required" : "ईमेल और पासवर्ड आवश्यक है"
      setErrors([msg])
      toast({ title: "Validation Error", description: msg, variant: "destructive" })
      return
    }

    setIsLoading(true)
    setErrors([])
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        const errorMsg =
          result.error ||
          (en ? "Authentication failed. Check your password." : "प्रमाणीकरण विफल। पासवर्ड जांचें।")
        setErrors([errorMsg])
        toast({ title: "Authentication Failed", description: errorMsg, variant: "destructive" })
        setIsLoading(false)
        return
      }

      if (!result.user) {
        throw new Error(en ? "Sign-in failed. Please try again." : "साइन-इन विफल। पुनः प्रयास करें।")
      }

      setUser(result.user)

      try {
        const supabase = createClient()
        await supabase.auth.refreshSession()
      } catch {}

      toast({
        title: en ? "Welcome Back!" : "स्वागत है!",
        description: en
          ? `Logged in as ${result.user.name}`
          : `${result.user.name} के रूप में लॉगिन किया गया`,
      })

      if (result.user.role === "admin") {
        setCurrentPage("admin/dashboard")
      } else if (result.user.role === "doctor") {
        setCurrentPage("doctor/dashboard")
      } else {
        setCurrentPage("dashboard")
      }
    } catch (err: any) {
      const msg = err?.message || (en ? "Login failed. Try again." : "लॉगिन विफल। पुनः प्रयास करें।")
      setErrors([msg])
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: string[] = []
    if (!formData.name.trim()) errs.push(en ? "Name is required" : "नाम आवश्यक है")
    if (!formData.email.trim()) errs.push(en ? "Email is required" : "ईमेल आवश्यक है")
    if (!formData.phone.trim()) errs.push(en ? "Phone is required" : "फोन आवश्यक है")
    if (!formData.password.trim()) errs.push(en ? "Password is required" : "पासवर्ड आवश्यक है")
    if (formData.password !== formData.confirmPassword) {
      errs.push(en ? "Passwords do not match" : "पासवर्ड मेल नहीं खाते")
    }
    if (errs.length > 0) {
      setErrors(errs)
      toast({ title: "Validation Error", description: errs[0], variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}`,
          data: { first_name: formData.name },
        },
      })

      if (error) {
        setErrors([error.message])
        toast({ title: "Sign up Failed", description: error.message, variant: "destructive" })
        setIsLoading(false)
        return
      }

      if (data.user) {
        await fetch("/api/auth/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileType: "patient",
            first_name: formData.name,
            phone: formData.phone,
          }),
        })
      }

      setSuccessMsg(t.emailConfirm)
      setErrors([])
    } catch {
      const msg = en ? "Sign up failed. Try again." : "साइन अप विफल।"
      setErrors([msg])
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      setErrors([en ? "Enter your email address first" : "पहले अपना ईमेल पता दर्ज करें"])
      return
    }
    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    setIsLoading(false)
    if (!error) {
      setForgotSent(true)
      setErrors([])
      toast({ title: "Success", description: t.forgotSent })
    } else {
      setErrors([error.message])
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleGuestAccess = () => {
    setUser({ id: "guest", name: en ? "Guest User" : "अतिथि", email: "", role: "patient", phone: "" })
    setCurrentPage("dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.subtitle}</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="pt-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">{t.login}</TabsTrigger>
                <TabsTrigger value="register">{t.register}</TabsTrigger>
              </TabsList>

              {/* Error/Success alerts */}
              {errors.length > 0 && (
                <Alert className="mb-4 border-destructive">
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((err, i) => (
                        <li key={i} className="text-sm">
                          {err}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              {successMsg && (
                <Alert className="mb-4 border-green-200 bg-green-50">
                  <AlertDescription className="text-green-700 text-sm">{successMsg}</AlertDescription>
                </Alert>
              )}
              {forgotSent && (
                <Alert className="mb-4 border-blue-200 bg-blue-50">
                  <AlertDescription className="text-blue-700 text-sm">{t.forgotSent}</AlertDescription>
                </Alert>
              )}

              <LoginForm
                en={en}
                t={t}
                formData={formData}
                onInputChange={handleInputChange}
                onFillDemo={fillDemo}
                onLogin={handleLogin}
                onForgotPassword={handleForgotPassword}
                isLoading={isLoading}
              />

              <RegisterForm
                en={en}
                t={t}
                formData={formData}
                onInputChange={handleInputChange}
                onSignUp={handleSignUp}
                isLoading={isLoading}
              />
            </Tabs>

            <OAuthGuestFooter
              t={t}
              onGoogleLogin={handleGoogleLogin}
              onGuestAccess={handleGuestAccess}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Authentication
