# Project structure

Updated 22 November 2026. This map describes the repository's source layout; dependencies, generated builds, local credentials and downloaded models are excluded.

```text
RURAL-HEALTHCARE-PLATFORM/
├── app/                         Next.js routes, layouts and service worker
│   ├── api/assistant/           Validated actions and owned voice-service proxy
│   ├── offline/                 Native offline guidance
│   └── teleconsult/             Confirmations and authorized consultation entry
├── components/                  Existing modular feature UI
│   ├── voice-assistant/         Persistent avatar, page controller, voice session and workflows
│   ├── consultation-portal/     Booking UI and receipt validation
│   ├── emergency/               Emergency controls and resource lifecycle
│   └── providers/               Authentication and language lifecycle
├── lib/                         Shared application logic
│   ├── assistant/               Source control registry, accessibility, 13-language catalogs and packs
│   ├── voice/                   Browser PCM recording
│   ├── offline/                 Account-owned queues, cleanup and replay executors
│   ├── services/                Server authorization and validated business actions
│   └── ai/, clinical/, symptoms/ Existing model adapters and clinical rules
├── services/voice/              Optional owned Python inference service
│   ├── install_models.py        Explicit installation and repair at locked revisions
│   ├── model_runtime.py         Offline-only snapshot loading
│   ├── server.py                Fixed v1 speech/conversation protocol
│   └── tests/                   Dependency-free installation/access contracts
├── public/                      Public PWA assets
│   ├── avatar/                  Lightweight SVG artwork
│   └── data/assistant/          13 generated language packs and checksum manifest
├── supabase/                    Local database config and sealed forward migrations
├── tests/                       Unit, localhost database and Playwright suites
├── scripts/                     CI gates, migration seals and data/pack generators
├── .github/workflows/           Quality, local-database and browser CI
├── docs/                        Architecture, evidence, rollout and audit records
└── loadtest/                    Existing guarded staging-only harness
```

The avatar is mounted through `app/layout.tsx` and `components/FloatingChatClient.tsx`. It calls same-origin application endpoints; model output cannot bypass the action controller. The optional Python process is separate from Next.js and is not started on a serverless deployment automatically. `.env.local`, `.voice-venv/`, `services/voice/.models/`, `node_modules/`, `.next/` and browser recordings are ignored local artifacts.

Recent commits use `snapshot(scope): description`. The assistant is delivered as one coherent `snapshot(voice-assistant)` commit because its UI, authorization, queues, migration contracts and tests depend on one another. See [Assistant release checklist](ASSISTANT_RELEASE_CHECKLIST.md) for setup and audits.
