import type { VoiceStatus } from "./types"
export function AvatarFace({ state, small = false }: { state: VoiceStatus; small?: boolean }) {
  return <svg viewBox="0 0 96 96" width={small ? 38 : 60} height={small ? 38 : 60} aria-hidden="true" className={`rural-avatar rural-avatar--${state}`}>
    <defs><linearGradient id={small ? "avatar-small" : "avatar-large"} x2="1" y2="1"><stop stopColor="#0f766e"/><stop offset="1" stopColor="#34d399"/></linearGradient></defs>
    <circle cx="48" cy="48" r="46" fill={`url(#${small ? "avatar-small" : "avatar-large"})`}/>
    <path d="M17 84c2-17 14-26 31-26s29 9 31 26" fill="#f8fafc"/>
    <path d="M35 65l13 12 13-12" fill="#ccfbf1"/>
    <ellipse cx="48" cy="39" rx="25" ry="29" fill="#f0c8a0"/>
    <path d="M23 37c-4-20 6-30 25-30 19 0 28 13 25 30-8-4-12-12-13-17-8 10-23 14-37 17" fill="#253c3c"/>
    <g className="rural-avatar-eyes"><ellipse cx="38" cy="41" rx="2.8" ry="3.2" fill="#253c3c"/><ellipse cx="58" cy="41" rx="2.8" ry="3.2" fill="#253c3c"/></g>
    <path d="M45 45l-1 7h6" fill="none" stroke="#bd8f74" strokeWidth="2" strokeLinecap="round"/>
    <ellipse className="rural-avatar-mouth" cx="48" cy="58" rx="7" ry={state === "speaking" ? 4 : 2} fill="#9b4949"/>
    <circle cx="72" cy="76" r="12" fill="#0f766e" stroke="white" strokeWidth="2"/><path d="M72 69v14m-7-7h14" stroke="white" strokeWidth="4"/>
  </svg>
}
