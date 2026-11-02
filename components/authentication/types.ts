/**
 * components/authentication/types.ts
 *
 * Types and localization strings for Authentication.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Auth Subsystem
 */

import type { UserProfile } from "@/types"

export interface AuthenticationProps {
  setUser: (user: UserProfile) => void
  setCurrentPage: (page: string) => void
  language: string
}

export interface AuthFormData {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

export function getAuthTranslations(en: boolean) {
  return {
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
}
