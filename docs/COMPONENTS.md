# Current component and module reference

Updated 23 November 2026. [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) provides the folder map; [SOURCE_INVENTORY.json](reports/SOURCE_INVENTORY.json) provides generated counts. Props are owned by the current source interfaces/context; historical prop examples are not API contracts.

| Area | Modules and responsibility |
|---|---|
| Root providers | app/layout.tsx, components/FloatingChatClient.tsx and components/providers: auth/language/session lifetime and persistent assistant mount |
| Avatar UI | components/voice-assistant: Chat/Actions panels, choice cards, footer, settings, speech session and guided workflows |
| Control router | lib/assistant/page-controls.ts, registered-controls.json and catalogs: first-party source registration, current scope/fingerprint checks, selection and non-secret fields |
| Accessibility | Shared assistant accessibility state and toolbar: font/contrast, bounded consent-based page reading, rate and reset; no competing English-only speech engine |
| Speech lifecycle | useVoiceSession.ts, lib/voice recorder and speech-fallback.ts: turn/resource ownership, native/owned failures, hidden/meeting stops and explicit activation |
| Owned proxy | lib/services/voice-config.ts, voice-response.ts and assistant-voice.service.ts: private config, redirect/type/body limits and sanitized capabilities |
| Pinned model host | services/voice installer, model_manifest.py, model_runtime.py and server.py: immutable snapshots, integrity checks and authenticated v1 execution |
| Facility maps | MapView and location feature components: effect-owned Leaflet instance, public-data search, contextual nearest filters, zoom/pan/recenter |
| Appointments | consultation-portal and appointment services: provider identity, valid slots, signed guided drafts and truthful receipt acknowledgment |
| Meetings | JitsiMeeting and authorized room services: first-party SDK controls, event-owned mute state and explicit device handoffs |
| Emergency | components/emergency and clinical rules: local guidance/beacon lifecycle; assistant yields speech/microphone ownership |
| Offline | app/sw.ts and lib/offline: public caching, owned queue, cleanup/quarantine, atomic replay and acknowledged removal |
| Security | middleware, lib/security, logger, auth guard and server services: exact-origin, role checks, redaction and client/server boundary |
| Admin/claims | Existing management UI/server operations; browser-local demo claim references disabled in production and never authoritative |

The component checker enforces valid imports/exports, hooks/lint/type correctness and ≤400 LOC module/page limits with lean API handlers <150 LOC. Pure data/UI exclusions follow the checker source. The source control registry verifies first-party stamped JSX; it does not introspect or execute third-party widget DOM. Read [HANDS_FREE_IMPLEMENTATION.md](HANDS_FREE_IMPLEMENTATION.md) before changing control dispositions, task ownership or acknowledgment semantics.

Current browser evidence uses mocked audio; dynamic role/page states, device controls, every native language and real disability usage remain release checks. See [FINAL_AUDIT.md](FINAL_AUDIT.md).
