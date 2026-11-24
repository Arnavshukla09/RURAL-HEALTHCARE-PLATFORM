# Project structure

Updated 24 November 2026. This map describes the repository's source layout; dependencies, generated builds, local credentials and downloaded models are excluded. Existing application feature paths are preserved by the latest maintenance pass.

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
│   ├── security/                Origin and log/publication boundaries
│   ├── services/                Server authorization and validated business actions
│   └── ai/, clinical/, symptoms/ Existing model adapters and clinical rules
├── services/voice/              Optional owned Python inference service
│   ├── install_models.py        Explicit installation and repair at locked revisions
│   ├── model_manifest.py        Independent manifest and snapshot integrity checks
│   ├── model_runtime.py         Offline-only snapshot loading
│   ├── server.py                Fixed v1 speech/conversation protocol
│   └── tests/                   Dependency-free installation/access contracts
├── public/                      Public PWA assets
│   ├── avatar/                  Lightweight SVG artwork
│   └── data/assistant/          13 generated language packs and checksum manifest
├── supabase/                    Local database config and sealed forward migrations
├── tests/                       Unit, localhost database and Playwright suites
├── scripts/                     CI gates, migration seals and data/pack generators
│   ├── ci/check_components.mjs  Quality-check orchestration (existing command entry point)
│   ├── ci/component-checks.mjs  Parsed source imports/exports and module-size analysis
│   ├── db/                     Migration integrity and guarded database tools
│   └── data/                   Facility, doctor, icon, pack and registry generators
├── .github/workflows/           Quality, local-database and browser CI
├── CONTRIBUTING.md             Shared engineering/security rules and contribution workflow
├── README.md                    Project overview, setup, status and documentation index
├── docs/                        Architecture, study guide, evidence, rollout and audit records
└── loadtest/                    Existing guarded staging-only harness
```

The avatar is mounted through `app/layout.tsx` and `components/FloatingChatClient.tsx`. It calls same-origin application endpoints; model output cannot bypass the action controller. The optional Python process is separate from Next.js and is not started on a serverless deployment automatically. `.env.local`, `.voice-venv/`, `services/voice/.models/`, `node_modules/`, `.next/` and browser recordings are ignored local artifacts.

Feature directories own state and orchestration in `index.tsx`, focused rendering in `parts/`, and hooks/types/helpers where useful. Top-level compatibility exports are intentional import contracts, not disposable duplicate components. Server services own validated business behavior; route handlers remain lean. See [the component reference](COMPONENTS.md), [contributor rules](../CONTRIBUTING.md) and [repository maintenance](REPOSITORY_MAINTENANCE.md).

Source tooling and product logic are separate: the modular checker never imports the application at runtime. Local editor/coding-tool folders are ignored, while the implemented assistant, model adapters and public offline packs remain published application source/assets. The [study guide](STUDY_GUIDE.md) provides an ordered tour of these boundaries. See [Assistant release checklist](ASSISTANT_RELEASE_CHECKLIST.md) for setup and audits.
