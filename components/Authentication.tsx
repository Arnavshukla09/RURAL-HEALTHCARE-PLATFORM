"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Alert, AlertDescription } from "./ui/alert"
import { Eye, EyeOff, User, Mail, Phone, Loader2, Chrome, Heart } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AuthenticationProps {
  setUser: (user: any) => void
  setCurrentPage: (page: string) => void
  language: string
}

export function Authentication({ setUser, setCurrentPage, language }: AuthenticationProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<string[]>([])
  const [successMsg, setSuccessMsg] = useState("")

  const en = language === "en"

  const t = {
    title: en ? "Welcome to RuralHealth" : "ग्रामीण स्वास्थ्य में आपका स्वागत है",
    subtitle: en ? "Quality healthcare for everyone" : "सभी के लिए गुणवत्तापूर्ण स्वास्थ्य सेवा",
    login: en ? "Login" : "लॉगिन",
    register: en ? "Register" : "पंजीकरण",
    name: en ? "Full Name" : "पूरा नाम",
    email: en ? "Email Address" : "ईमेल पता",
    phone: en ? "Phone Number" : "फोन नंबर",
    password: en ? "Password" : "पासवर्ड",
    confirmPassword: en ? "Confirm Password" : "पासवर्ड पुष्टि",
    loginBtn: en ? "Sign In" : "साइन इन करें",
    registerBtn: en ? "Create Account" : "खाता बनाएं",
    forgotPassword: en ? "Forgot Password?" : "पासवर्ड भूल गए?",
    forgotSent: en ? "Reset link sent! Check your email." : "रीसेट लिंक भेजा गया! अपनी ईमेल जांचें।",
    orContinueWith: en ? "or continue with" : "या जारी रखें",
    guestAccess: en ? "Continue as Guest" : "अतिथि के रूप में जारी रखें",
    emailConfirm: en ? "Check your email to confirm your account!" : "अपना खाता पुष्टि करने के लिए अपनी ईमेल जांचें!",
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors([])
    setSuccessMsg("")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email.trim() || !formData.password.trim()) {
      setErrors([en ? "Email and password are required" : "ईमेल और पासवर्ड आवश्यक है"])
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) { setErrors([error.message]); setIsLoading(false); return }

      // Fetch role + phone from patients table
      const { data: patient } = await supabase
        .from("patients")
        .select("role, first_name, last_name, phone")
        .eq("user_id", data.user.id)
        .single()

      setUser({
        id: data.user.id,
        name: patient?.first_name || data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User",
        email: data.user.email,
        role: patient?.role || "patient",
        phone: patient?.phone || "",
      })
      setCurrentPage("dashboard")
    } catch {
      setErrors([en ? "Login failed. Try again." : "लॉगिन विफल। पुनः प्रयास करें।"])
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
    if (formData.password !== formData.confirmPassword) errs.push(en ? "Passwords do not match" : "पासवर्ड मेल नहीं खाते")
    if (errs.length > 0) { setErrors(errs); return }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}`,
          data: { first_name: formData.name, role: "patient" },
        },
      })

      if (error) { setErrors([error.message]); setIsLoading(false); return }

      // Create patient profile
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
      setErrors([en ? "Sign up failed. Try again." : "साइन अप विफल।"])
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}` },
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
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    setIsLoading(false)
    if (!error) { setForgotSent(true); setErrors([]) }
    else setErrors([error.message])
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
                      {errors.map((err, i) => <li key={i} className="text-sm">{err}</li>)}
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

              {/* ── LOGIN TAB ── */}
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t.email}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="login-email" type="email" className="pl-10"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="your@email.com" disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="login-password">{t.password}</Label>
                    <div className="relative">
                      <Input id="login-password" type={showPassword ? "text" : "password"} className="pr-10"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        placeholder="Enter your password" disabled={isLoading} />
                      <Button type="button" variant="ghost" size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Forgot password */}
                  <div className="flex justify-end mt-2">
                    <button type="button" onClick={handleForgotPassword}
                      className="text-xs text-teal-600 hover:text-teal-800 underline-offset-2 hover:underline" disabled={isLoading}>
                      {t.forgotPassword}
                    </button>
                  </div>

                  <Button type="submit" className="w-full mt-5 gradient-primary text-white" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.loginBtn}</> : t.loginBtn}
                  </Button>
                </form>
              </TabsContent>

              {/* ── REGISTER TAB ── */}
              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleSignUp}>
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">{t.name}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="reg-name" className="pl-10"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder={en ? "Your full name" : "आपका पूरा नाम"} disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-2 mt-3">
                    <Label htmlFor="reg-email">{t.email}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="reg-email" type="email" className="pl-10"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="your@email.com" disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-2 mt-3">
                    <Label htmlFor="reg-phone">{t.phone}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="reg-phone" type="tel" className="pl-10"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+91 9876543210" disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-2 mt-3">
                    <Label htmlFor="reg-password">{t.password}</Label>
                    <div className="relative">
                      <Input id="reg-password" type={showPassword ? "text" : "password"} className="pr-10"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        placeholder={en ? "Create a password" : "पासवर्ड बनाएं"} disabled={isLoading} />
                      <Button type="button" variant="ghost" size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 mt-3">
                    <Label htmlFor="reg-confirm">{t.confirmPassword}</Label>
                    <Input id="reg-confirm" type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      placeholder={en ? "Confirm your password" : "पासवर्ड पुष्टि करें"} disabled={isLoading} />
                  </div>

                  <Button type="submit" className="w-full mt-5 gradient-primary text-white" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.registerBtn}</> : t.registerBtn}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* OAuth + Guest */}
            <div className="mt-5 pt-4 border-t border-border space-y-3">
              <p className="text-xs text-center text-muted-foreground">{t.orContinueWith}</p>
              <Button variant="outline" onClick={handleGoogleLogin} className="w-full" disabled={isLoading}>
                <Chrome className="h-4 w-4 mr-2" />
                Google
              </Button>
              <Button variant="ghost" onClick={handleGuestAccess} className="w-full text-muted-foreground text-sm" disabled={isLoading}>
                {t.guestAccess}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
