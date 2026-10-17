import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppProvider } from "@/components/providers/AppProvider"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { AccessibilityBar } from "@/components/AccessibilityBar"
import { BottomTabBar } from "@/components/BottomTabBar"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/react"
import { PwaUpdaterAndInstaller } from "@/components/PwaUpdaterAndInstaller"
import { FloatingChatClient } from "@/components/FloatingChatClient"
import { LanguageSuggestionBanner } from "@/components/LanguageSuggestionBanner"
import { TranslationRouteObserver } from "@/components/TranslationRouteObserver"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "RuralHealth — Quality Healthcare for Everyone",
  description: "AI-powered rural healthcare platform with specialist consultations, symptom checking, health information, and facility locator for rural India.",
  keywords: "rural healthcare, telemedicine, AI health, India healthcare, symptom checker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RuralHealth",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  authors: [{ name: "Arnav Shukla", url: "https://github.com/Arnavshukla09" }],
  creator: "Arnav Shukla",
}


export const viewport = {
  themeColor: "#0ea5e9",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Sync html lang attribute, translation cookies, and crash guard before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var l = localStorage.getItem("rhcp_language");
                if (l) {
                  document.documentElement.lang = l;
                  if (l !== "en") {
                    var host = window.location.hostname;
                    document.cookie = "googtrans=/auto/" + l + "; path=/;";
                    document.cookie = "googtrans=/auto/" + l + "; path=/; domain=" + host + ";";
                    document.cookie = "googtrans=/en/" + l + "; path=/;";
                    document.cookie = "googtrans=/en/" + l + "; path=/; domain=" + host + ";";
                  }
                }
              } catch(e) {}
              try {
                if (typeof Node !== 'undefined' && Node.prototype) {
                  var origRemoveChild = Node.prototype.removeChild;
                  Node.prototype.removeChild = function(c) {
                    if (c.parentNode !== this) {
                      if (c.parentNode) return c.parentNode.removeChild(c);
                      return c;
                    }
                    return origRemoveChild.call(this, c);
                  };
                  var origInsertBefore = Node.prototype.insertBefore;
                  Node.prototype.insertBefore = function(n, r) {
                    if (r && r.parentNode !== this) {
                      return origInsertBefore.call(this, n, null);
                    }
                    return origInsertBefore.call(this, n, r);
                  };
                }
              } catch(e) {}
              // Continuous early suppression of Google Translate banner to ensure navbar is never covered
              try {
                var cleanBanner = function() {
                  var frames = document.querySelectorAll('iframe.skiptranslate, .goog-te-banner-frame, iframe[id*=":1.container"], iframe[id*=":2.container"], [class*="VIpgJd-ZVi9od"]');
                  for (var i = 0; i < frames.length; i++) {
                    frames[i].style.setProperty('display', 'none', 'important');
                    frames[i].style.setProperty('visibility', 'hidden', 'important');
                    frames[i].style.setProperty('height', '0px', 'important');
                    frames[i].style.setProperty('top', '-9999px', 'important');
                  }
                  if (document.body) {
                    if (document.body.style.top && document.body.style.top !== '0px') {
                      document.body.style.setProperty('top', '0px', 'important');
                    }
                    if (document.body.style.position && document.body.style.position !== 'static') {
                      document.body.style.setProperty('position', 'static', 'important');
                    }
                    if (document.body.style.marginTop && document.body.style.marginTop !== '0px') {
                      document.body.style.setProperty('margin-top', '0px', 'important');
                    }
                  }
                };
                if (typeof MutationObserver !== 'undefined') {
                  var obs = new MutationObserver(cleanBanner);
                  obs.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['style', 'class']
                  });
                }
              } catch(e) {}
              // Pre-hydration route navigation patch: ensures page transitions in regional languages cleanly load translated DOM
              try {
                if (typeof window !== 'undefined' && window.history && !window.history.__rhcp_translate_patched) {
                  var origPush = window.history.pushState;
                  window.history.__rhcp_translate_patched = true;
                  window.history.pushState = function(state, title, url) {
                    if (url) {
                      try {
                        var curLang = localStorage.getItem("rhcp_language");
                        if (curLang && curLang !== "en") {
                          var target = new URL(url.toString(), window.location.origin);
                          if (target.origin === window.location.origin && target.pathname !== window.location.pathname) {
                            window.location.href = target.href;
                            return;
                          }
                        }
                      } catch(e) {}
                    }
                    return origPush.apply(this, arguments);
                  };
                }
              } catch(e) {}
              window.googleTranslateElementInit = function() {
                try {
                  if (window.google && window.google.translate) {
                    new window.google.translate.TranslateElement({
                      pageLanguage: 'en',
                      includedLanguages: 'en,hi,mr,bn,te,ta,gu,kn,pa,or,ml,as,ur',
                      autoDisplay: false
                    }, 'google_translate_element');
                  }
                } catch(e) {}
              };
            `,
          }}
        />
        {/* Preconnect to critical third-party origins to improve LCP */}
        <link rel="preconnect" href="https://boyzdmlvzvcplzolenef.supabase.co" />
        <link rel="preconnect" href="https://translate.google.com" />
        <link rel="dns-prefetch" href="https://translate.google.com" />
        <link rel="dns-prefetch" href="https://generativelanguage.googleapis.com" />
        <link rel="dns-prefetch" href="https://a.basemaps.cartocdn.com" />
      </head>
      <body className={`${inter.className} min-h-screen bg-gray-50 flex flex-col`}>
        <div id="google_translate_element" className="hidden" style={{ display: "none" }} aria-hidden="true" />
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
        <AppProvider>
          <TranslationRouteObserver />
          <LanguageSuggestionBanner />
          <AccessibilityBar />
          <Header />
          <main className="flex-1 pb-16 md:pb-0">
            {children}
          </main>
          <Footer />
          <BottomTabBar />
          <FloatingChatClient />
          <Toaster />
          <PwaUpdaterAndInstaller />
          <Analytics />
        </AppProvider>
      </body>
    </html>
  )
}
