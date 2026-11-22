# Website options and proposed voice-action map

Date: 22 November 2026. Source: `c45aa0cf2953300c4f02f3861bb7ff1502d3b735`. Status: **source control bindings implemented with explicit handoffs; live/device certification remains open**.

The updated source inventory contains 28 page entries and 499 interactive-control candidates across 100 source files, including 104 shared/global candidates. The wider registration gate covers 509 templates including error/loading surfaces. Forms, interactive containers, buttons, links, inputs and repeated-card templates are included. These are not 476 simultaneously visible buttons. Shared components appear on multiple routes, conditional authentication forms may be hidden, and a single result-card template can produce many controls. Native browser dialogs and Leaflet/Jitsi internals are outside this static count.

See [the per-control inventory](HANDS_FREE_CONTROL_INVENTORY.md) and [machine-readable source references](HANDS_FREE_CONTROL_INVENTORY.json). Audit IDs use file/line/column. Future runtime action IDs must be semantic and stable, rather than line numbers, translated captions or CSS selectors.

See [HANDS_FREE_IMPLEMENTATION.md](HANDS_FREE_IMPLEMENTATION.md) for current behavior. The tables below preserve the complete route-level design target. Every source candidate has a registered disposition; an entry described as needing a workflow audit is not thereby certified for voice writes. Native browser/OS handoffs and native/device review remain release work.

## Main spoken menu

Offer small groups, normally five choices followed by “more options.” Every eligible option remains discoverable through “what can I do here?” A user does not have to scroll the website or chatbot to discover a control.

| Group | Options to offer |
|---|---|
| Medical care | Check symptoms; find/book a doctor; choose audio/video/chat; appointments; join a consultation |
| Find nearby services | Hospitals; doctors; health posts/PHCs; clinics; pharmacies; labs; location/district; search/filter; nearest result; call/directions |
| My care | Dashboard; my records; attachments; profile; saved camp information; notifications |
| Learn and programmes | First aid; diseases; vaccines; awareness; ASHA child/maternal guidance; camps/campaigns; government schemes |
| Emergency | Emergency guidance; published helplines; phone dialler; nearby hospitals; beacon controls; emergency profile; contact-message preparation |
| Settings and help | Language; voice readiness; offline preparation; accessibility; account/login/logout; help/FAQ; current-page options |
| Professional work | Only the verified doctor's or administrator's permitted work, when that authenticated role is active |

## Shared controls

| Surface | Voice options to add | Important handling |
|---|---|---|
| Header, mobile menu and bottom tabs | Open/close navigation; Symptoms; Find Doctors; Find Hospitals; My Care; Emergency; account menu | Use internal route IDs; preserve the mounted avatar |
| Avatar | Open/collapse/close; speak; stop; repeat; send typed input; language; offline preparation; all task cards | Keep audio stop distinct from cancelling the current task; current assistant already implements part of this |
| Accessibility | Increase/decrease/reset text size; contrast on/off; read page; stop reading | Share one audio coordinator with avatar/emergency/conference output |
| Notifications | Open/close; choose existing tabs; read an item; mark read/all read; show more | Scope private content to the authenticated account; confirm actual acknowledgment |
| User/account menu | Dashboard; appointments; records; camps/schemes; eligible professional pages; logout | Obtain authoritative role/session state; cached “guest” is not an authenticated patient |
| Footer | Home; directory; campaigns; consultation; expand About/FAQ/Privacy/Contact; feedback/social links | Bind existing `toggleSection`; mail/social destinations are external handoffs |
| Language suggestion | Accept/dismiss suggested language; choose another language | Native assistant catalog is separate from online DOM translation |
| PWA/offline status | Install when supported; prepare/check saved guidance; inspect/retry/discard queued requests; apply available app update | Install prompts need browser/OS interaction; queued is not confirmed |
| Global navigation | Back; home; current options; more options; next/previous result; scroll/top/bottom | Resolve against the active page/modal; do not interpret these words inside ordinary dictation without command mode |

## Route map

“Existing guided” means some assistant workflows exist. It does not mean every listed page control already works by voice. The per-page count excludes the shared/global inventory and includes conditional/reused templates.

| Route | Local candidates | Website options to expose through registered actions | Present assistant coverage / work needed |
|---|---:|---|---|
| `/` | 10 | Get started/login; consultation; SOS; symptom checker; facilities map; doctor directory; records; campaigns | Some task navigation exists; bind every card/link and offer the complete main menu |
| `/login` | 21 | Login/register tabs; name/email/phone fields; secure credential entry; password visibility; submit; password recovery; Google login; guest access | Navigation only. Secure fields must bypass conversation logs/models; OAuth and password-manager dialogs need an OS/browser handoff. Demo role autofill must never become role authorization |
| `/dashboard` | 34 | My Care overview; quick navigation; appointments; records; registered camps; schemes; relevant role dashboard | Navigation is partial; register the actual cards and authenticated state, including login fallback |
| `/directory` | 29 | Search/clear; specialties; location/filter menu; GPS; state/district; radius; reset location/filters; result pages; clinician/facility details; call; directions; available booking links | Full page-control bindings missing; distinguish “find a doctor” from “book a doctor” |
| `/locations` | 29 | State/district; facility search; GPS; All/Hospital/Health Post/Clinic/Pharmacy/Lab/Doctors; 10/25/50/100 km; expand/compact map; results; previous/next; select a result; call; route; clear route; navigation app; eligible clinician booking | Existing guide performs a separate limited GPS lookup. Bind `useFacilityDiscovery` and its real results/filters. “Nearest” is a new semantic selection action, not an existing button |
| `/consultation` | 46 | Mode selection; provider selection; form fields; date/time/notes; next/back; booking confirmation; acknowledged result; authorized join/copy-link actions | Guided booking exists. Connect page form state and controls to the same validated workflow/receipts |
| `/appointments` | 33 | Upcoming/past; booking form; provider/date/time/notes; cancel form; create; cancel an appointment; join; load more | Guided list/book/cancel/join exists. Page filters/forms/paging need bindings; retain signed confirmations and server receipts |
| `/records` | 44 | Read/filter records; select/view attachment; load more; manual entry/upload mode; record type/content; save/cancel/delete; edit height/weight/blood group/chronic information; read vitals | Assistant can read a small record set after consent. Full forms/filters missing. `VitalsCard` is read-only; a new vitals-entry feature must be labelled as a separate extension |
| `/symptom-checker` | 21 | Patient information; body-part choices; symptom selections/search; severity/duration/temperature where present; next/back; analyze; results/chat; relevant health information | Native guided intake exists separately. Share its state with the page and retain deterministic urgency safeguards |
| `/emergency` | 40 | 108 and directory helplines; SOS/contact preparation; first aid; nearby hospital; beacon/siren/torch/voice/vibration controls where supported; emergency profile fields/save; select contacts; test mode; SMS/WhatsApp/share preparation | Emergency-first guidance exists. Most page actions are not voice-bound. Beacon stop/voice command coexistence requires audio testing. Composers/diallers do not prove dispatch or delivery |
| `/health-info` | 19 | First aid; vaccines; diseases; awareness; ASHA tab; search; child IMCI/maternal ANC mode; existing assessment fields; relevant hospital/108 links | Navigation only. Add native page/action labels and guided form bindings; qualified clinical review remains required |
| `/health-info/schemes` | 19 | All/national/state scope; state picker; category; search/clear/reset; previous/next/page; read scheme information; phone/web contact | Navigation only. Official application sites are external; the app cannot claim benefit enrollment from opening a link |
| `/camps` | 13 | Search; state/district/category; reset; select/read camp; call/copy number; share; directions; save camp to records; doctor/consultation navigation | Navigation only. Existing “register” saves camp information as a medical record; it is not proof the organiser reserved a seat |
| `/campaigns` | 13 | Same camp/campaign controls as `/camps`, with the actual current dataset/filter state | Reused screen; avoid a second independent voice data source |
| `/offline` | 3 | Saved public pages; retry connection; emergency/health-advice dial links | Native offline page exists. Offline data/voice readiness must be reported separately; grouped menu templates render multiple links |
| `/teleconsult/confirm` | 2 | Read confirmation/session guidance; return to appointments; eligible join link | Existing acknowledged booking links; legacy URL parameters cannot confirm/reschedule care |
| `/teleconsult/room` | 26 | Authorized room entry; leave; copy/share link; audio-only controls where present; record/prescription modal fields; save; print; close/back; SDK microphone/camera/chat/raise-hand/tile view where supported | Authorized entry/record binding exists. Current avatar voice is paused in meetings. Conference commands need a validated SDK/media adapter; sharing/fullscreen/device/print dialogs may need OS control |
| `/doctor/claim` | 14 | Read invite/profile status; invitation URL entry; council registration/contact fields; submit for review; home/login/dashboard navigation | Navigation/form guidance only until legacy invitation and provisioning controls pass server-side security review. Spoken claims cannot grant a role |
| `/doctor/dashboard` | 4 | Assigned consultations; join; complete; load more; professional quick links | Bind exact provider-owned data; recheck eligibility on server |
| `/doctor/requests` | 8 | Pending/completed/all; search; expand an appointment; join; complete/cancel; reschedule control; load more | Needs page bindings. Audit reschedule/reopen semantics: changing status alone is not a new date or permission to bypass terminal-state guards |
| `/doctor/patients` | 3 | Search assigned patients; expand/collapse records; read eligible content; open attachment | Care-relationship access must be enforced; private output requires consent/context safeguards |
| `/admin/dashboard` | 1 | Eligible administrative navigation cards | Dynamic repeated template; administrator role from the server only |
| `/admin/appointments` | 7 | Search; status; expand; complete/cancel/reopen controls; load more | Audit actual transition rules before exposing all writes; no privilege gain from voice |
| `/admin/campaigns` | 24 | New/edit campaign; existing fields/category/date/status/capacity/contact/map URL; save/cancel; delete confirmation; call/map links | Bind server-validated administrative actions; direct client database writes require security/acknowledgment review |
| `/admin/notifications` | 12 | Compose/sent; audience/user selection; category; title/body; review/send; delete; load more | Explicit final recipient/content confirmation; validate role and actual send result |
| `/admin/users` | 16 | Search/filter users; inspect permitted metadata; role changes/removal; doctor claim/invite tabs; select provider; copy invite; SMS/WhatsApp composer | Provisioning/removal flows need authoritative services. Audit legacy local claim approvals; profile removal is not necessarily auth-account erasure |
| `/admin/records` | 3 | Allowed record metadata; select user; audited erasure workflow | Current screen uses general record endpoints. Review/fix this before voice enabling; preserve the prohibition on admin clinical-content reads and use the purpose-built erasure process |
| `/admin/chat-review` | 3 | Refresh; inspect eligible proposed knowledge; approve/reject | Administrative and clinical editorial review; no automatic learning from private patient conversations |

## Additional controls the source count cannot certify

- **Leaflet:** zoom, pan, recenter, marker/popup selection and fit results. Expose a page-owned map adapter and list alternative, rather than click third-party DOM controls by caption.
- **Jitsi:** current configured toolbar includes microphone, camera, desktop sharing, fullscreen, device selection, hangup, chat, raise hand and tile view. Verify the actual configured SDK/domain's command/event support. The assistant must not navigate or execute room actions without server authorization.
- **Browser/OS:** microphone/location permission, phone dialler, file chooser, camera permission, share sheet, print, fullscreen/screen sharing and OAuth/passkey/password-manager dialogs. A web page cannot grant its own permission or synthesize every trusted gesture. Use a spoken handoff and supported OS accessibility control; a native companion is a separate scope if necessary.

## Canonical action families

Examples of stable IDs for the implementation: `navigation.open`, `page.options.list`, `dialog.close`, `field.focus`, `field.set`, `field.correct`, `facilities.filter.set`, `facilities.radius.set`, `facilities.nearest.select`, `facilities.result.call`, `facilities.result.route`, `appointments.prepare`, `appointments.commit`, `records.prepareSave`, `notifications.markRead`, `emergency.beacon.stop`, `conference.audio.setMuted`.

These IDs are proposals. Each requires a typed parameter schema, native label/aliases, active scope, real enabled-state check, handler binding, role/online rules and a verified result. “All controls mapped” requires a runtime coverage audit after implementation, including hidden/modal/dynamic states and reviewed exclusions.
