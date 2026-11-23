# Current HTTP surface

Generated from exported route handlers, 23 November 2026. Public paths are necessary for the website; their names are not credentials. Internal voice service origins and secrets remain server-only. See [FINAL_AUDIT.md](FINAL_AUDIT.md) for protection and verification limits.

| Application path | Methods | Source |
|---|---|---|
| `/api/abdm/fhir-export` | GET | `app/api/abdm/fhir-export/route.ts` |
| `/api/admin/doctor-provider-link` | GET, POST | `app/api/admin/doctor-provider-link/route.ts` |
| `/api/admin/erase-record` | POST | `app/api/admin/erase-record/route.ts` |
| `/api/ai-chat` | POST | `app/api/ai-chat/route.ts` |
| `/api/appointments` | GET, POST, PATCH | `app/api/appointments/route.ts` |
| `/api/assistant/actions` | POST | `app/api/assistant/actions/route.ts` |
| `/api/assistant/voice` | GET, POST | `app/api/assistant/voice/route.ts` |
| `/api/auth/ensure-patient` | POST | `app/api/auth/ensure-patient/route.ts` |
| `/api/auth/login` | POST | `app/api/auth/login/route.ts` |
| `/api/auth/profile` | GET, PUT | `app/api/auth/profile/route.ts` |
| `/api/cache-status` | GET, POST | `app/api/cache-status/route.ts` |
| `/api/chat-cache` | POST | `app/api/chat-cache/route.ts` |
| `/api/doctor-requests` | GET, POST, PATCH | `app/api/doctor-requests/route.ts` |
| `/api/facilities/district/[districtCode]` | GET | `app/api/facilities/district/[districtCode]/route.ts` |
| `/api/facilities/nearby` | GET | `app/api/facilities/nearby/route.ts` |
| `/api/health` | GET | `app/api/health/route.ts` |
| `/api/health-data` | GET, POST | `app/api/health-data/route.ts` |
| `/api/medical-records` | GET, POST, DELETE, PATCH | `app/api/medical-records/route.ts` |
| `/api/notifications` | GET, POST, PATCH | `app/api/notifications/route.ts` |
| `/api/offline-sync` | POST | `app/api/offline-sync/route.ts` |
| `/api/providers` | GET | `app/api/providers/route.ts` |
| `/api/ready` | GET | `app/api/ready/route.ts` |
| `/api/symptom-analyze` | POST | `app/api/symptom-analyze/route.ts` |
| `/api/teleconsult/room` | POST | `app/api/teleconsult/room/route.ts` |
