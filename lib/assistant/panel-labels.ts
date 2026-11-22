import type { AssistantLanguageCode } from "./languages"
export const PANEL_LABELS: Record<AssistantLanguageCode, { chat: string; actions: string; settings: string }> = {
  en: { chat: "Chat", actions: "Actions", settings: "Settings" }, hi: { chat: "बातचीत", actions: "विकल्प", settings: "सेटिंग" },
  mr: { chat: "संवाद", actions: "पर्याय", settings: "सेटिंग" }, bn: { chat: "কথোপকথন", actions: "বিকল্প", settings: "সেটিংস" },
  te: { chat: "సంభాషణ", actions: "ఎంపికలు", settings: "సెట్టింగ్‌లు" }, ta: { chat: "உரையாடல்", actions: "விருப்பங்கள்", settings: "அமைப்புகள்" },
  gu: { chat: "વાતચીત", actions: "વિકલ્પો", settings: "સેટિંગ" }, kn: { chat: "ಸಂಭಾಷಣೆ", actions: "ಆಯ್ಕೆಗಳು", settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು" },
  pa: { chat: "ਗੱਲਬਾਤ", actions: "ਵਿਕਲਪ", settings: "ਸੈਟਿੰਗਾਂ" }, or: { chat: "କଥାବାର୍ତ୍ତା", actions: "ବିକଳ୍ପ", settings: "ସେଟିଂ" },
  ml: { chat: "സംഭാഷണം", actions: "ഓപ്ഷനുകൾ", settings: "ക്രമീകരണങ്ങൾ" }, as: { chat: "কথোপকথন", actions: "বিকল্প", settings: "ছেটিংছ" },
  ur: { chat: "گفتگو", actions: "اختیارات", settings: "ترتیبات" },
}
