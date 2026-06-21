"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Alert, AlertDescription } from "./ui/alert"
import { Eye, EyeOff, User, Mail, Phone, MapPin, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Chrome } from "lucide-react"

interface AuthenticationProps {
  setUser: (user: any) => void
  setCurrentPage: (page: string) => void
  language: string
}

export function Authentication({ setUser, setCurrentPage, language }: AuthenticationProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "patient",
    location: "",
  })
  const [errors, setErrors] = useState<string[]>([])

  const content = {
    en: {
      title: "Welcome to RuralHealth",
      subtitle: "Access quality healthcare services",
      login: "Login",
      register: "Register",
      forgotPassword: "Forgot Password?",
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      password: "Password",
      confirmPassword: "Confirm Password",
      location: "Location/Village",
      role: "I am a...",
      patient: "Patient/Villager",
      doctor: "Doctor",
      hospital: "Hospital Staff",
      admin: "Administrator",
      loginBtn: "Sign In",
      registerBtn: "Create Account",
      switchToRegister: "Don't have an account? Sign up",
      switchToLogin: "Already have an account? Sign in",
      accessibility: "Accessibility Options",
      guestAccess: "Continue as Guest",
      checkingEmail: "Checking your email confirmation...",
      success: "Account created successfully!",
    },
    hi: {
      title: "ग्रामीण स्वास्थ्य में आपका स्वागत है",
      subtitle: "गुणवत्तापूर्ण स्वास्थ्य सेवाओं तक पहुंच",
      login: "लॉगिन",
      register: "पंजीकरण",
      forgotPassword: "पासवर्ड भूल गए?",
      name: "पूरा नाम",
      email: "ईमेल पता",
      phone: "फोन नंबर",
      password: "पासवर्ड",
      confirmPassword: "पासवर्ड की पुष्टि करें",
      location: "स्थान/गांव",
      role: "मैं हूँ...",
      patient: "मरीज/ग्रामीण",
      doctor: "डॉक्टर",
      hospital: "अस्पताल कर्मचारी",
      admin: "प्रशासक",
      loginBtn: "साइन इन करें",
      registerBtn: "खाता बनाएं",
      switchToRegister: "खाता नहीं है? साइन अप करें",
      switchToLogin: "पहले से खाता है? साइन इन करें",
      accessibility: "पहुंच विकल्प",
      guestAccess: "अतिथि के रूप में जारी रखें",
      checkingEmail: "आपकी ईमेल पुष्टि की जा रही है...",
      success: "खाता सफलतापूर्वक बनाया गया!",
    },
  }

  const t = content[language as keyof typeof content]

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors([])
  }

  const validateForm = (isLogin: boolean) => {
    const newErrors: string[] = []

    if (!isLogin) {
      if (!formData.name.trim()) newErrors.push(language === "en" ? "Name is required" : "नाम आवश्यक है")
      if (!formData.phone.trim()) newErrors.push(language === "en" ? "Phone is required" : "फोन आवश्यक है")
      if (formData.password !== formData.confirmPassword) {
        newErrors.push(language === "en" ? "Passwords do not match" : "पासवर्ड मेल नहीं खाते")
      }
    }

    if (!formData.email.trim()) newErrors.push(language === "en" ? "Email is required" : "ईमेल आवश्यक है")
    if (!formData.password.trim()) newErrors.push(language === "en" ? "Password is required" : "पासवर्ड आवश्यक है")

    return newErrors
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validateForm(true)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        setErrors([error.message])
        setIsLoading(false)
        return
      }

      // Fetch user profile
      const response = await fetch("/api/auth/profile")
      const profile = await response.json()

      const user = {
        id: data.user.id,
        name: profile.patient?.first_name || profile.provider?.first_name || "User",
        email: data.user.email,
        role: profile.patient?.role || "patient",
        ...profile,
      }

      setUser(user)
      setCurrentPage("dashboard")
    } catch (error) {
      setErrors([language === "en" ? "Login failed" : "लॉगिन विफल"])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validateForm(false)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
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
          data: {
            first_name: formData.name,
            role: formData.role,
          },
        },
      })

      if (error) {
        setErrors([error.message])
        setIsLoading(false)
        return
      }

      if (data.user) {
        // Create patient or provider profile
        if (formData.role === "patient") {
          await fetch("/api/auth/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              profileType: "patient",
              first_name: formData.name,
              phone: formData.phone,
              address: formData.location,
            }),
          })
        } else {
          await fetch("/api/auth/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              profileType: "provider",
              first_name: formData.name,
              specialization: formData.role,
            }),
          })
        }

        setErrors([])
        alert(
          language === "en"
            ? "Please confirm your email to complete registration"
            : "पंजीकरण पूरा करने के लिए कृपया अपनी ईमेल की पुष्टि करें",
        )
      }
    } catch (error) {
      setErrors([language === "en" ? "Sign up failed" : "साइन अप विफल"])
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestAccess = () => {
    const guestUser = {
      id: "guest",
      name: language === "en" ? "Guest User" : "अतिथि उपयोगकर्ता",
      email: "guest@example.com",
      role: "patient",
      phone: "",
      location: "",
    }
    setUser(guestUser)
    setCurrentPage("dashboard")
  }
  const handleGoogleLogin = async () => {
  const supabase = createClient()
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}`
    }
  })
}

  const handleDemoLogin = (role: string) => {
    const demos: Record<string, any> = {
      patient: { id: "demo-patient", name: "Priya Sharma", email: "patient@demo.com", role: "patient" },
      doctor: { id: "demo-doctor", name: "Dr. Rajesh Kumar", email: "doctor@demo.com", role: "doctor", specialization: "General Physician" },
      admin: { id: "demo-admin", name: "Admin", email: "admin@demo.com", role: "admin" },
    }
    setUser(demos[role])
    setCurrentPage("dashboard")
  }

return (
  <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 flex items-center justify-center p-4">
    <div className="w-full max-w-md animate-fade-in">
      <div className="text-center mb-8">
        <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
          <User className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>

      <Card className="shadow-xl border-0">
        <CardContent className="pt-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">{t.login}</TabsTrigger>
              <TabsTrigger value="register">{t.register}</TabsTrigger>
            </TabsList>

            {errors.length > 0 && (
              <Alert className="mb-4 border-destructive">
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

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
                <Button type="submit" className="w-full mt-6 gradient-primary text-white" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.loginBtn}</> : t.loginBtn}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleSignUp}>
                <div className="space-y-2">
                  <Label htmlFor="register-name">{t.name}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="register-name" className="pl-10"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Your full name" disabled={isLoading} />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="register-email">{t.email}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="register-email" type="email" className="pl-10"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="your@email.com" disabled={isLoading} />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="register-phone">{t.phone}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="register-phone" type="tel" className="pl-10"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+91 9876543210" disabled={isLoading} />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="register-password">{t.password}</Label>
                  <Input id="register-password" type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Create a password" disabled={isLoading} />
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="register-confirm">{t.confirmPassword}</Label>
                  <Input id="register-confirm" type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    placeholder="Confirm your password" disabled={isLoading} />
                </div>
                <div className="space-y-2 mt-4">
                  <Label>{t.role}</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">{t.patient}</SelectItem>
                      <SelectItem value="doctor">{t.doctor}</SelectItem>
                      <SelectItem value="hospital">{t.hospital}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full mt-6 gradient-primary text-white" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.registerBtn}</> : t.registerBtn}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-4 border-t border-border">
            <Button variant="outline" onClick={handleGoogleLogin} className="w-full mb-3" disabled={isLoading}>
              <Chrome className="h-4 w-4 mr-2" />
              Continue with Google
            </Button>
            <Button variant="outline" onClick={handleGuestAccess} className="w-full bg-transparent" disabled={isLoading}>
              {t.guestAccess}
            </Button>
          </div>

          {/* Demo Login Buttons */}
          <div className="mt-4 pt-4 border-t border-dashed border-border">
            <p className="text-xs text-center text-muted-foreground mb-3">{language === "en" ? "Quick Demo Access" : "त्वरित डेमो एक्सेस"}</p>
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="outline" onClick={() => handleDemoLogin("patient")} className="text-xs h-9 border-teal-200 hover:bg-teal-50 text-teal-700">
                🧑 {language === "en" ? "Patient" : "मरीज"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDemoLogin("doctor")} className="text-xs h-9 border-blue-200 hover:bg-blue-50 text-blue-700">
                👨‍⚕️ {language === "en" ? "Doctor" : "डॉक्टर"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDemoLogin("admin")} className="text-xs h-9 border-purple-200 hover:bg-purple-50 text-purple-700">
                ⚙️ {language === "en" ? "Admin" : "एडमिन"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)
}
