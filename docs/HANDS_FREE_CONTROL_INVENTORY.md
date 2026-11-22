# Hands-free control inventory

Source commit: `23768473b5ada99204f50a667bf49f0c93a63392`. Generated 22 November 2026.

**Implemented source registration inventory, not device or end-to-end coverage certification.** These are static JSX templates; one facility-card template may render many buttons. A reachable template can be hidden or disabled at runtime. Dispositions include executable controls, containers, avatar-owned controls and explicit handoffs. Role permissions must be evaluated by the server and active UI state.

Scanned 28 page entries, 499 reachable control templates in 100 source files, including 104 shared/global templates.

The inventory excludes input values, credentials and conversation data. Handler names and label expressions are source references. Native dialogs and third-party widget controls need separate adapters/exclusions. File/line/column IDs identify audit candidates, not future stable runtime action IDs. The JSON companion preserves these IDs and route associations.

## Global controls

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/LanguageSuggestionBanner.tsx:110 | button | Switch to {meta.nativeName} | handleAccept | ui.acab67c248fc4ab4 / confirm |
| components/LanguageSuggestionBanner.tsx:117 | button | Keep {language === "hi" ? "हिन्दी" : "English"} | handleDismiss | ui.45c346c083948b8a / confirm |
| components/LanguageSuggestionBanner.tsx:123 | button | Dismiss language suggestion | handleDismiss | ui.a34b98fc0dab5184 / confirm |
| components/voice-assistant/index.tsx:167 | button | {t("welcome")} | openAssistant | ui.a22bf1e71c1028f5 / assistant |
| components/voice-assistant/AssistantPanel.tsx:55 | button | {controller.prompt("accessibility")} | no direct handler: inspect wiring | ui.69cdcd9ecaa9d407 / assistant |
| components/voice-assistant/AssistantPanel.tsx:56 | button | {labels.settings} | setSettingsOpen | ui.8325c9a5a93fd6d8 / assistant |
| components/voice-assistant/AssistantPanel.tsx:57 | button | {t("close")} | no direct handler: inspect wiring | ui.990a6c99cc1af3ff / assistant |
| components/voice-assistant/AssistantPanel.tsx:60 | select | {t("chooseLanguage")} | props.setLanguage | ui.8b80606d3332eb6d / assistant |
| components/voice-assistant/AssistantPanel.tsx:63 | button | {t("downloadOffline")} | no direct handler: inspect wiring | ui.2780b6939ae9ab96 / assistant |
| components/voice-assistant/AssistantPanel.tsx:66 | button | {labels[value]} {value === "actions" && hasActions && <span className="ms-2 inline-block h-2 w-2 rounded-full bg-teal-600"/>} | setPane | ui.6e797b6f58a9e21e / assistant |
| components/voice-assistant/AssistantPanel.tsx:77 | button | {option.label} | controller.select | ui.88bc1f0893e2717b / assistant |
| components/voice-assistant/AssistantPanel.tsx:78 | button | {choice.label} {choice.detail && <span className="block text-xs font-normal text-gray-500">{choice.detail}</span>} | workflow.select, workflow.say, t | ui.58626b9cb2ade380 / assistant |
| components/voice-assistant/AssistantPanel.tsx:79 | button | {t("yesNo")} | workflow.confirm | ui.658a6b18f7f0c944 / assistant |
| components/voice-assistant/AssistantPanel.tsx:79 | button | {t("cancel")} | workflow.confirm | ui.361a4716ee08ea42 / assistant |
| components/voice-assistant/AssistantPanel.tsx:80 | button | {t(key)} | setPane, props.onRun | ui.942e30c956f9b2f3 / assistant |
| components/voice-assistant/AssistantPanel.tsx:81 | button | {controller.prompt(controller.menu.length > 0 ? "more" : "options")} | voice.interrupt, workflow.cancelTask, controller.list | ui.3aff41b469e06540 / assistant |
| components/voice-assistant/AssistantPanel.tsx:84 | a | {t("emergencyCall")} | link navigation | ui.fb8d78ae84c95c3f / assistant |
| components/voice-assistant/AssistantPanel.tsx:85 | form | → | event.preventDefault, props.onSend | ui.9d1aaab16b8150af / assistant |
| components/voice-assistant/AssistantPanel.tsx:85 | input | {t("textInput")} | props.setInput | ui.33b2694ab5005c31 / assistant |
| components/voice-assistant/AssistantPanel.tsx:85 | button | {t("send")} | parent form submission | ui.41d797e82355b2ef / assistant |
| components/voice-assistant/AssistantPanel.tsx:86 | button | {t("listen")} | no direct handler: inspect wiring | ui.43d3b9d44db0c9b7 / assistant |
| components/voice-assistant/AssistantPanel.tsx:86 | button | {t("replay")} | voice.enable, voice.speakReply | ui.18cbf23cb6405eaf / assistant |
| components/voice-assistant/AssistantPanel.tsx:86 | button | {t("stop")} | no direct handler: inspect wiring | ui.f88049b789a89920 / assistant |
| components/voice-assistant/AssistantPanel.tsx:87 | button | {controller.prompt("cancelTask")} | cancel | ui.6bf10c81f8905fba / assistant |
| components/voice-assistant/AssistantPanel.tsx:87 | button | {t("emergency")} | props.onRun | ui.41f7f8e77eec6464 / assistant |
| components/PwaUpdaterAndInstaller.tsx:149 | Button | {en ? "Reload" : "रीलोड"} | handleApplyUpdate | ui.34a17ca82a3edff6 / confirm |
| components/PwaUpdaterAndInstaller.tsx:176 | Button | {en ? "Install" : "इंस्टॉल"} | handleInstallClick | ui.f163facae17b696d / confirm |
| components/PwaUpdaterAndInstaller.tsx:183 | button | Dismiss | handleDismissBanner | ui.742887fa1b993e93 / confirm |
| components/PwaUpdaterAndInstaller.tsx:206 | button | Dismiss | handleDismissBanner | ui.758767d4d33a9612 / confirm |
| components/BottomTabBar.tsx:27 | button | {tab.icon} {tab.label} | router.push | ui.039bcbecd6113073 / local |
| components/AccessibilityBar.tsx:15 | Button | {t.accessibility} | setAccessibility | ui.5e657ef31f4d5b07 / local |
| components/AccessibilityBar.tsx:17 | Button | {t.back} | setAccessibility | ui.a5f9c09110aa5540 / local |
| components/AccessibilityBar.tsx:19 | Button | {t.decreaseFont} | setAccessibility | ui.01b20ed72eea17d5 / local |
| components/AccessibilityBar.tsx:19 | Button | {t.increaseFont} | setAccessibility | ui.6616468571682297 / local |
| components/AccessibilityBar.tsx:20 | Button | {state.highContrast ? t.contrastOff : t.contrastOn} | setAccessibility | ui.6f0808e8adb11d66 / local |
| components/AccessibilityBar.tsx:21 | Button | {t.readPage} | requestPageReading | ui.14df208a3de96489 / confirm |
| components/AccessibilityBar.tsx:22 | Button | {t.stopReading} | requestAudioStop | ui.cf6ec693b2cd441d / confirm |
| components/AccessibilityBar.tsx:23 | Button | {t.resetAccessibility} | requestAudioStop, setAccessibility | ui.89b79bd04184b5ca / local |
| components/Footer.tsx:125 | button | {language === 'en' ? 'Home' : 'होम'} | router.push | ui.afacba94da980dcb / local |
| components/Footer.tsx:131 | button | {language === 'en' ? 'Directory' : 'निर्देशिका'} | router.push | ui.44751042f49f9812 / local |
| components/Footer.tsx:137 | button | {language === 'en' ? 'Campaigns' : 'अभियान'} | router.push | ui.a40b1fdabf7f265b / local |
| components/Footer.tsx:143 | button | {language === 'en' ? 'Consultation' : 'परामर्श'} | router.push | ui.46702260116d4b71 / local |
| components/Footer.tsx:158 | button | {t[key]} {expandedSection === key ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />} | toggleSection | ui.29c8c51497c45eb3 / local |
| components/Footer.tsx:172 | a | {t.feedback} | link navigation | ui.33b2e8bf683bddae / link |
| components/Footer.tsx:185 | a | GitHub | link navigation | ui.06caae6ac8914183 / link |
| components/Footer.tsx:186 | Button | GitHub | no direct handler: inspect wiring | ui.31fc52b1e64536ec / confirm |
| components/Footer.tsx:190 | a | LinkedIn | link navigation | ui.b68f0f516a7ab484 / link |
| components/Footer.tsx:191 | Button | LinkedIn | no direct handler: inspect wiring | ui.19995574bc8e084b / confirm |
| components/Footer.tsx:195 | a | Email | link navigation | ui.971189deea086038 / link |
| components/Footer.tsx:196 | Button | Email | no direct handler: inspect wiring | ui.747f44182cd4fa25 / confirm |
| components/header/index.tsx:110 | div | {en ? "RuralHealth" : "ग्रामीण स्वास्थ्य"} [dynamic content] | go | ui.97c3a73eeb7cfd62 / confirm |
| components/header/parts/MobileMenu.tsx:62 | button | {item.label} | onGo | ui.56fb054a105d7f1b / local |
| components/header/parts/MobileMenu.tsx:72 | button | {en ? "Emergency" : "आपातकाल"} | onGo | ui.bc0c7b4455f5572d / local |
| components/header/parts/MobileMenu.tsx:87 | button | {item.label} | onGo | ui.0cbe5463fc60f759 / local |
| components/header/parts/MobileMenu.tsx:104 | button | {item.label} | onGo | ui.c912ae6b42347bb1 / local |
| components/header/parts/MobileMenu.tsx:126 | button | {item.label} | onGo | ui.ce0e7d4f08ede2d0 / local |
| components/header/parts/MobileMenu.tsx:141 | button | {en ? "Emergency" : "आपातकाल"} | onGo | ui.ca79dd067c0f02d9 / local |
| components/header/parts/MobileMenu.tsx:158 | button | {l.nativeName} | setLanguage, setMobileMenuOpen | ui.9bc49ff927622cfc / local |
| components/header/parts/MobileMenu.tsx:175 | button | {en ? "Logout" : "लॉगआउट"} | onLogout | ui.b644278e54304d80 / confirm |
| components/header/parts/MobileMenu.tsx:183 | Link | {en ? "Login / Register" : "लॉगिन / पंजीकरण"} | setMobileMenuOpen | ui.4f0c1a9dc3b76beb / link |
| components/header/parts/MobileMenu.tsx:188 | Button | {en ? "Login / Register" : "लॉगिन / पंजीकरण"} | no direct handler: inspect wiring | ui.9e2b6c402ae34d33 / confirm |
| components/header/parts/UserMenu.tsx:76 | button | Select language | setLangDropOpen | ui.0fc8b60655e6d8dd / local |
| components/header/parts/UserMenu.tsx:99 | button | {l.nativeName} {l.name} {language === l.code && <Check className="h-3.5 w-3.5 text-teal-600" />} | setLanguage, setLangDropOpen | ui.6b905cd00f040aee / local |
| components/header/parts/UserMenu.tsx:127 | button | {user.name} | setUserDropOpen | ui.b676390641cad373 / local |
| components/header/parts/UserMenu.tsx:160 | button | {en ? "Dashboard" : "डैशबोर्ड"} | onGo | ui.e026c45828ae746a / local |
| components/header/parts/UserMenu.tsx:168 | button | {en ? "Patient Records" : "मरीज़ रिकॉर्ड"} | onGo | ui.7b956c377b82c0b5 / local |
| components/header/parts/UserMenu.tsx:174 | button | {en ? "Appointment Requests" : "नई अनुरोध"} | onGo | ui.dc96e66960c96c7c / local |
| components/header/parts/UserMenu.tsx:180 | button | {en ? "Appointments" : "अपॉइंटमेंट"} | onGo | ui.dcfb72b70dbe4560 / local |
| components/header/parts/UserMenu.tsx:186 | button | {en ? "Find Doctors" : "डॉक्टर खोजें"} | onGo | ui.b53120ce220a3363 / local |
| components/header/parts/UserMenu.tsx:192 | button | {en ? "Hospitals" : "अस्पताल"} | onGo | ui.bd4209cb75b3e89a / local |
| components/header/parts/UserMenu.tsx:202 | button | {en ? "Manage Users" : "उपयोगकर्ता प्रबंधन"} | onGo | ui.58c47c0a0e56e69e / local |
| components/header/parts/UserMenu.tsx:208 | button | {en ? "Campaigns" : "अभियान"} | onGo | ui.2bbf473ee899f2ea / local |
| components/header/parts/UserMenu.tsx:214 | button | {en ? "Appointments" : "अपॉइंटमेंट"} | onGo | ui.619f066a13f32c6a / local |
| components/header/parts/UserMenu.tsx:220 | button | {en ? "Records" : "रिकॉर्ड"} | onGo | ui.1de631a95db634df / local |
| components/header/parts/UserMenu.tsx:226 | button | {en ? "Find Doctors" : "डॉक्टर खोजें"} | onGo | ui.c586a27c38836477 / local |
| components/header/parts/UserMenu.tsx:232 | button | {en ? "Hospitals" : "अस्पताल"} | onGo | ui.c3a9069f64125cfc / local |
| components/header/parts/UserMenu.tsx:238 | button | {en ? "Send Notifications" : "सूचनाएं भेजें"} | onGo | ui.ad890ba90b0c9548 / local |
| components/header/parts/UserMenu.tsx:247 | button | {en ? "Logout" : "लॉगआउट"} | onLogout | ui.291ffead52c10327 / confirm |
| components/header/parts/UserMenu.tsx:260 | Button | {en ? "Login" : "लॉगिन"} | no direct handler: inspect wiring | ui.9a7558a5f5884bfd / confirm |
| components/header/parts/UserMenu.tsx:267 | Button | {en ? "Emergency SOS" : "आपातकालीन एसओएस"} | onGo | ui.c6977dd8ab9d9977 / local |
| components/header/parts/UserMenu.tsx:278 | Button | {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />} | setMobileMenuOpen | ui.14efcc2bd8643201 / local |
| components/OfflineSyncBadge.tsx:112 | button | [dynamic content] {failedCount > 0 ? `${failedCount} ${en ? "failed" : "विफल"}` : `${totalWaiting} ${en ? "waiting" : "प्रतीक्षारत"}`} | setIsOpen | ui.a1f655071d82ee92 / local |
| components/OfflineSyncBadge.tsx:154 | button | [unlabelled/dynamic] | setIsOpen | ui.4229017daab1f56d / local |
| components/OfflineSyncBadge.tsx:248 | button | {en ? "Discard" : "हटाएं"} | handleDiscard | ui.487b61bd8ce05d50 / confirm |
| components/OfflineSyncBadge.tsx:255 | button | {en ? "Retry" : "पुनः प्रयास"} | handleRetry | ui.57b232830f0da393 / confirm |
| components/OfflineSyncBadge.tsx:281 | button | {en ? "Close" : "बंद करें"} | setIsOpen | ui.e26236cf3fec49ae / local |
| components/OfflineSyncBadge.tsx:288 | button | [dynamic content] | handleManualSync | ui.5d845e5dc3359b63 / confirm |
| components/notification-bell/index.tsx:318 | button | Notifications | handleOpen | ui.1f851802caaf2ec7 / confirm |
| components/notification-bell/index.tsx:341 | div | [unlabelled/dynamic] | setOpen | ui.ed3858c2824d6d6e / local |
| components/notification-bell/parts/NotificationPanel.tsx:77 | button | {en ? "Mark all read" : "सभी पढ़े"} | markAllRead | ui.4a849a075599620a / confirm |
| components/notification-bell/parts/NotificationPanel.tsx:84 | button | Close | onClose | ui.77012b1327a82b95 / local |
| components/notification-bell/parts/NotificationPanel.tsx:115 | NotificationItem | [unlabelled/dynamic] | onNotificationClick | ui.3e497e1d43bc4f62 / container |
| components/notification-bell/parts/NotificationPanel.tsx:126 | button | {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} {en ? "Load more" : "और देखें"} | onLoadMore | ui.c17fd2c52660d197 / confirm |
| components/notification-bell/parts/NotificationItem.tsx:38 | div | {n.title} {!n.is_read && ( <span className="h-2 w-2 bg-blue-600 rounded-full shrink-0" /> )} {n.message} {timeStr} [dynamic content] | onClick | ui.04868b6821c23a0f / confirm |
| components/notification-bell/parts/NotificationTabs.tsx:29 | button | {en ? "All" : "सभी"} ( {totalCount} ) | setActiveTab | ui.df1b990275b3d5fb / local |
| components/notification-bell/parts/NotificationTabs.tsx:39 | button | {en ? "Appointments" : "अपॉइंटमेंट"} | setActiveTab | ui.80a86e57911b8c0b / local |
| components/notification-bell/parts/NotificationTabs.tsx:50 | button | {en ? "Alerts" : "अलर्ट"} | setActiveTab | ui.dbf16f98fa000dc6 / local |
| components/header/parts/DesktopNav.tsx:53 | button | {item.label} | onGo | ui.66bf882d0b762e2d / local |
| components/header/parts/DesktopNav.tsx:67 | button | {en ? "Emergency" : "आपातकाल"} | onGo | ui.cb0a106bf21b19f5 / local |
| components/header/parts/DesktopNav.tsx:83 | button | {item.label} | onGo | ui.ee8b44ed9023f131 / local |
| components/header/parts/DesktopNav.tsx:106 | button | {item.label} | onGo | ui.c05fb82c293da213 / local |
| components/header/parts/DesktopNav.tsx:124 | button | {en ? "My Care" : "मेरी देखभाल"} | setCareDropOpen | ui.5c92ea08ca8091ad / local |
| components/header/parts/DesktopNav.tsx:142 | button | {item.label} | onGo | ui.554a327d8d147076 / local |
| components/header/parts/DesktopNav.tsx:159 | button | {en ? "Emergency" : "आपातकाल"} | onGo | ui.e40b072bb6b47cb6 / local |

## /admin/appointments

Entry: `app/admin/appointments/page.tsx`. Local reachable templates: 7. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/AdminAppointments.tsx:158 | input | {en ? "Search by patient name, email, notes..." : "नाम, ईमेल, नोट से खोजें..."} | setSearch | ui.7cdba78128834d17 / field |
| components/AdminAppointments.tsx:164 | button | {s} | setStatusFilter | ui.8db650195092f69f / local |
| components/AdminAppointments.tsx:211 | button | {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />} | setExpanded | ui.c4351c5563876ff9 / local |
| components/AdminAppointments.tsx:227 | Button | {updating === appt.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />} {en ? "Mark Completed" : "पूर्ण करें" | updateStatus | ui.f147eeba7fa8a320 / confirm |
| components/AdminAppointments.tsx:232 | Button | {en ? "Cancel" : "रद्द"} | updateStatus | ui.0f8d6f48dde89dca / confirm |
| components/AdminAppointments.tsx:239 | Button | {en ? "Re-open" : "पुनः खोलें"} | updateStatus | ui.16a46a9d9040ddc1 / confirm |
| components/AdminAppointments.tsx:252 | Button | {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} {en ? "Load more" : "और देखें"} | handleLoadMore | ui.e0474ab8f06ab548 / local |

## /admin/campaigns

Entry: `app/admin/campaigns/page.tsx`. Local reachable templates: 24. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/admin-campaign-manager/index.tsx:153 | Button | [dynamic content] | setShowForm, setEditing, setForm, emptyForm | ui.993e8b0292eb1de7 / local |
| components/admin-campaign-manager/parts/CampaignCard.tsx:60 | Button | {en ? "Yes, Delete" : "हां, हटाएं"} | onDelete | ui.a865916de6954231 / confirm |
| components/admin-campaign-manager/parts/CampaignCard.tsx:67 | Button | {en ? "Cancel" : "रद्द"} | onSetDeleteConfirm | ui.94cabbfe50d40a80 / confirm |
| components/admin-campaign-manager/parts/CampaignCard.tsx:116 | button | [unlabelled/dynamic] | onStartEdit | ui.047e7a600798af60 / confirm |
| components/admin-campaign-manager/parts/CampaignCard.tsx:122 | button | [unlabelled/dynamic] | onSetDeleteConfirm | ui.a877352628b65f58 / confirm |
| components/admin-campaign-manager/parts/CampaignCard.tsx:186 | a | {c.phone} | link navigation | ui.274241554811cf47 / link |
| components/admin-campaign-manager/parts/CampaignCard.tsx:199 | a | {en ? "Call Camp" : "कॉल करें"} | link navigation | ui.7fdd8c537463ef73 / link |
| components/admin-campaign-manager/parts/CampaignCard.tsx:208 | a | {en ? "Get Directions" : "दिशा पाएं"} | link navigation | ui.bec87d64eb365c19 / link |
| components/admin-campaign-manager/parts/CampaignCard.tsx:219 | a | {en ? "View on Map" : "मैप पर देखें"} | link navigation | ui.49ad82253e2dadea / link |
| components/admin-campaign-manager/parts/CampaignForm.tsx:55 | input | {[en ? "Campaign Title *" : "अभियान शीर्षक *"].join(' ')} | f | ui.3dec55e9561d423d / field |
| components/admin-campaign-manager/parts/CampaignForm.tsx:66 | select | {[en ? "Category" : "श्रेणी"].join(' ')} | f | ui.1aa2dc2b465decd9 / field |
| components/admin-campaign-manager/parts/CampaignForm.tsx:85 | textarea | {[en ? "Description" : "विवरण"].join(' ')} | f | ui.6db78d897e87809d / field |
| components/admin-campaign-manager/parts/CampaignForm.tsx:100 | input | {[en ? "Venue Name *" : "स्थान नाम *"].join(' ')} | f | ui.22bf3471d98db5e9 / field |
| components/admin-campaign-manager/parts/CampaignForm.tsx:111 | input | {[en ? "Address / Landmark" : "पता / लैंडमार्क"].join(' ')} | f | ui.0a717e00faea4c35 / field |
| components/admin-campaign-manager/parts/CampaignForm.tsx:126 | input | {[en ? "Start Date" : "शुरू तिथि"].join(' ')} | f | ui.62a9468012434c48 / field |
| components/admin-campaign-manager/parts/CampaignForm.tsx:137 | input | {[en ? "Time" : "समय"].join(' ')} | f | ui.7740b86a67ec1a43 / field |
| components/admin-campaign-manager/parts/CampaignForm.tsx:148 | input | {[en ? "End Date" : "समाप्त तिथि"].join(' ')} | f | ui.c4b3fb6ee216f869 / field |
| components/admin-campaign-manager/parts/CampaignForm.tsx:159 | select | {[en ? "Status" : "स्थिति"].join(' ')} | f | ui.b0612c86075bc180 / field |
| components/admin-campaign-manager/parts/CampaignForm.tsx:177 | input | {[en ? "Expected Participants" : "प्रतिभागी"].join(' ')} | f, parseInt | ui.cb9c5e2bbef96e7d / field |
| components/admin-campaign-manager/parts/CampaignForm.tsx:192 | input | {[en ? "Contact Phone" : "संपर्क फ़ोन"].join(' ')} | f | ui.1e0f27cf6bec58a2 / field |
| components/admin-campaign-manager/parts/CampaignForm.tsx:203 | input | {[en ? "Google Maps URL" : "मैप लिंक"].join(' ')} | f | ui.5415f2c8c24bab2b / field |
| components/admin-campaign-manager/parts/CampaignForm.tsx:214 | input | [unlabelled/dynamic] | f | ui.8a0dca025ac6f7cc / field |
| components/admin-campaign-manager/parts/CampaignForm.tsx:226 | Button | [dynamic content] [dynamic content] | onSave | ui.94de833dd11e0205 / confirm |
| components/admin-campaign-manager/parts/CampaignForm.tsx:244 | Button | {en ? "Cancel" : "रद्द"} | onCancel | ui.a6aa4fb1f0a6f54f / confirm |

## /admin/chat-review

Entry: `app/admin/chat-review/page.tsx`. Local reachable templates: 3. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| app/admin/chat-review/page.tsx:84 | Button | Refresh | fetchPending | ui.536209c6db9e0cdb / confirm |
| app/admin/chat-review/page.tsx:129 | Button | Reject | handleUpdate | ui.7248a25a6d885bfb / confirm |
| app/admin/chat-review/page.tsx:139 | Button | Approve | handleUpdate | ui.63a8ea338dac3229 / confirm |

## /admin/dashboard

Entry: `app/admin/dashboard/page.tsx`. Local reachable templates: 1. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/AdminDashboard.tsx:208 | button | {action.label} | router.push | ui.3aab5316d245d0b0 / local |

## /admin/notifications

Entry: `app/admin/notifications/page.tsx`. Local reachable templates: 12. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/AdminNotifications.tsx:154 | button | {en ? "Compose" : "लिखें"} | setTab | ui.df7eb4a04d09ba2d / local |
| components/AdminNotifications.tsx:158 | button | {en ? "Sent" : "भेजे गए"} ( {sent.length} ) | setTab | ui.3efc0c6c846c93d7 / local |
| components/AdminNotifications.tsx:187 | button | {opt.label} | setForm | ui.88338ab6f6913c45 / handoff |
| components/AdminNotifications.tsx:203 | select | {[en ? "Role" : "भूमिका"].join(' ')} | setForm | ui.b9be07855876e2f7 / field |
| components/AdminNotifications.tsx:219 | input | {[en ? "Select User" : "उपयोगकर्ता चुनें", selectedUser && <span className="ml-2 text-purple-600 font-medium">✓ {selectedUser.first_name} {selectedUse | setUserSearch | ui.5c40684931b4c910 / field |
| components/AdminNotifications.tsx:225 | button | {u.first_name} {u.last_name} {u.email} {u.role} | setForm | ui.be0ada96adb10d40 / local |
| components/AdminNotifications.tsx:247 | button | {v.label} | setForm | ui.1c6845b487b1b6c8 / local |
| components/AdminNotifications.tsx:262 | input | {[en ? "Title *" : "शीर्षक *"].join(' ')} | setForm | ui.eabb7feeaa4cb05b / field |
| components/AdminNotifications.tsx:270 | textarea | {[en ? "Message *" : "संदेश *"].join(' ')} | setForm | ui.c935d02324ed0d47 / field |
| components/AdminNotifications.tsx:275 | Button | {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} [dynamic content] | handleSend | ui.eac9756be1413603 / confirm |
| components/AdminNotifications.tsx:356 | button | [unlabelled/dynamic] | deleteNotif | ui.b3cac656160ccc91 / confirm |
| components/AdminNotifications.tsx:366 | Button | {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} {en ? "Load more" : "और देखें"} | handleLoadMoreSent | ui.46f434722274fa07 / local |

## /admin/records

Entry: `app/admin/records/page.tsx`. Local reachable templates: 3. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/AdminRecords.tsx:156 | input | {en ? "Search by name, email, role..." : "नाम, ईमेल, भूमिका से खोजें..."} | setSearch | ui.291f0677f3e4701e / field |
| components/AdminRecords.tsx:191 | button | {isLoadingThis ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} {en ? "Inspect Metadata" : "मेटाडेटा देखें"} {!isLoa | loadRecords | ui.9c567af1de2ed33e / confirm |
| components/AdminRecords.tsx:232 | Button | [dynamic content] | handleDelete | ui.5bbd849564782f18 / handoff |

## /admin/users

Entry: `app/admin/users/page.tsx`. Local reachable templates: 16. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/admin-user-management/index.tsx:186 | button | {en ? "Users" : "उपयोगकर्ता"} ( {users.length} ) | setActiveTab | ui.48f9465b4d6b5fab / local |
| components/admin-user-management/index.tsx:199 | button | {en ? "Doctor Claims & Invites" : "डॉक्टर क्लेम एवं आमंत्रण"} [dynamic content] | setActiveTab | ui.124aedddd0064172 / handoff |
| components/admin-user-management/parts/DoctorClaimsTab.tsx:153 | Button | Reject Claim | onRejectClaim | ui.a25f9946bba9f424 / handoff |
| components/admin-user-management/parts/DoctorClaimsTab.tsx:161 | Button | Approve Claim & Grant Doctor Role | onApproveClaim | ui.679d3890df0fe500 / handoff |
| components/admin-user-management/parts/DoctorClaimsTab.tsx:208 | Input | {[en ? "Search Doctor by Name, Hospital, or NMC Number:" : "नाम, अस्पताल या एनएमसी नंबर से खोजें:"].join(' ')} | setInviteSearch, setSelectedInviteDoctor | ui.319eee542512f93f / field |
| components/admin-user-management/parts/DoctorClaimsTab.tsx:232 | div | {doc.name} {doc.specialtyName} • {doc.hospitalAffiliation} Reg: {doc.regNo} • {doc.districtName} , {doc.stateName} Select | setSelectedInviteDoctor | ui.d500908a706b0211 / handoff |
| components/admin-user-management/parts/DoctorClaimsTab.tsx:246 | Button | Select | no direct handler: inspect wiring | ui.9321c8e90d839e7d / confirm |
| components/admin-user-management/parts/DoctorClaimsTab.tsx:276 | Button | [dynamic content] {copiedInvite ? "Copied!" : "Copy Link"} | navigator.clipboard.writeText, setCopiedInvite, setTimeout | ui.e90bea3ea73592df / handoff |
| components/admin-user-management/parts/DoctorClaimsTab.tsx:298 | Button | Dispatch via WhatsApp | window.open, encodeURIComponent | ui.52878405b4d05f08 / handoff |
| components/admin-user-management/parts/DoctorClaimsTab.tsx:312 | Button | Dispatch via SMS | encodeURIComponent | ui.2b9e8e610816b49a / handoff |
| components/admin-user-management/parts/UsersTab.tsx:61 | input | {en ? "Search by name, email..." : "नाम, ईमेल से खोजें..."} | setSearch | ui.9e82ed7e2d7a45d6 / field |
| components/admin-user-management/parts/UsersTab.tsx:70 | button | {r === "all" ? (en ? "All" : "सभी") : r} | setRoleFilter | ui.a93662e09a48c889 / handoff |
| components/admin-user-management/parts/UsersTab.tsx:117 | Button | [dynamic content] | onRemoveUser, setDeleteConfirm | ui.9537168bf53df1d1 / handoff |
| components/admin-user-management/parts/UsersTab.tsx:134 | Button | {en ? "Cancel" : "रद्द"} | setDeleteConfirm | ui.3d8211165689b32a / handoff |
| components/admin-user-management/parts/UsersTab.tsx:175 | select | [dynamic content] | onUpdateRole | ui.d750d871e31a47fc / handoff |
| components/admin-user-management/parts/UsersTab.tsx:197 | Button | {en ? "Remove" : "हटाएं"} | setDeleteConfirm | ui.e9da3102394dc0f7 / handoff |

## /appointments

Entry: `app/appointments/page.tsx`. Local reachable templates: 33. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/authentication/index.tsx:284 | TabsTrigger | {t.login} | no direct handler: inspect wiring | ui.b37082e1a2e79366 / local |
| components/authentication/index.tsx:285 | TabsTrigger | {t.register} | no direct handler: inspect wiring | ui.6b6d2044ca4035ea / local |
| components/authentication/parts/OAuthGuestFooter.tsx:30 | Button | Google | onGoogleLogin | ui.01445b0eb8c7c8af / confirm |
| components/authentication/parts/OAuthGuestFooter.tsx:39 | Button | {t.guestAccess} | onGuestAccess | ui.69cca8e8d37db13b / confirm |
| components/authentication/parts/RegisterForm.tsx:40 | form | {t.name} {t.email} {t.phone} {t.password} {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {t.confirmPassword} [dynamic c | onSignUp | ui.f6c490fdc964eb46 / container |
| components/authentication/parts/RegisterForm.tsx:45 | Input | {[t.name].join(' ')} | onInputChange | ui.c45dcc54e3ac137c / field |
| components/authentication/parts/RegisterForm.tsx:59 | Input | {[t.email].join(' ')} | onInputChange | ui.787cfe7404c21895 / field |
| components/authentication/parts/RegisterForm.tsx:74 | Input | {[t.phone].join(' ')} | onInputChange | ui.c6310f820364f32a / field |
| components/authentication/parts/RegisterForm.tsx:88 | Input (secure) | {[t.password].join(' ')} | onInputChange | ui.255dd7fc86b738cf / handoff |
| components/authentication/parts/RegisterForm.tsx:97 | Button | {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} | setShowPassword | ui.ed8b8f12b057c6c9 / handoff |
| components/authentication/parts/RegisterForm.tsx:110 | Input (secure) | {[t.confirmPassword].join(' ')} | onInputChange | ui.f772e9808fef15e6 / handoff |
| components/authentication/parts/RegisterForm.tsx:120 | Button | [dynamic content] | parent form submission | ui.64ff192a95953ffb / confirm |
| components/authentication/parts/LoginForm.tsx:52 | button | 👤 Patient | onFillDemo | ui.24af5b1ecc313961 / confirm |
| components/authentication/parts/LoginForm.tsx:60 | button | 🩺 Doctor | onFillDemo | ui.8ad31c0f71393a33 / confirm |
| components/authentication/parts/LoginForm.tsx:68 | button | ⚡ Admin | onFillDemo | ui.c731f57581a85bc3 / confirm |
| components/authentication/parts/LoginForm.tsx:79 | form | {t.email} {t.password} {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {t.forgotPassword} [dynamic content] | onLogin | ui.fb32904e0489e274 / container |
| components/authentication/parts/LoginForm.tsx:84 | Input | {[t.email].join(' ')} | onInputChange | ui.d9a05694116d6a6e / field |
| components/authentication/parts/LoginForm.tsx:98 | Input (secure) | {[t.password].join(' ')} | onInputChange | ui.371c706ce4e0df90 / handoff |
| components/authentication/parts/LoginForm.tsx:107 | Button | {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} | setShowPassword | ui.84a30ff88dc37f7c / handoff |
| components/authentication/parts/LoginForm.tsx:121 | button | {t.forgotPassword} | onForgotPassword | ui.35a8a6a989dfaa6f / handoff |
| components/authentication/parts/LoginForm.tsx:131 | Button | [dynamic content] | parent form submission | ui.96145683862410ac / confirm |
| components/AppointmentManager.tsx:185 | Button | {en ? "Upcoming" : "आगामी"} ( {upcoming.length} ) | setActiveTab | ui.0baaebb23e5b51a6 / local |
| components/AppointmentManager.tsx:188 | Button | {en ? "Past" : "पिछले"} ( {past.length} ) | setActiveTab | ui.0b58acb0c6432692 / local |
| components/AppointmentManager.tsx:206 | select | {[en ? "Select Doctor" : "डॉक्टर चुनें"].join(' ')} | setBookingForm | ui.bc507ee429be5563 / field |
| components/AppointmentManager.tsx:219 | Input | {[en ? "Date" : "तारीख"].join(' ')} | setBookingForm | ui.d65d2a2e76be7d28 / field |
| components/AppointmentManager.tsx:220 | Input | {[en ? "Time" : "समय"].join(' ')} | setBookingForm | ui.83ac28abde539522 / field |
| components/AppointmentManager.tsx:224 | Input | {[en ? "Notes (optional)" : "नोट्स (वैकल्पिक)"].join(' ')} | setBookingForm | ui.bcc2aa22c53ecf72 / field |
| components/AppointmentManager.tsx:230 | Button | {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />} {en ? "Confirm Booking" : "बुकिंग कन्फ | handleBookAppointment | ui.5daa2eff69998e7d / confirm |
| components/AppointmentManager.tsx:234 | Button | {en ? "Cancel" : "रद्द करें"} | setShowBooking, setBookingError | ui.809cc21e54702815 / confirm |
| components/AppointmentManager.tsx:268 | Button | {en ? "Join" : "जुड़ें"} | joinCall | ui.22b5e7ac4e480bc8 / confirm |
| components/AppointmentManager.tsx:273 | Button | {en ? "Cancel" : "रद्द करें"} | handleCancelAppointment | ui.32574086fc7d6c20 / confirm |
| components/AppointmentManager.tsx:290 | Button | {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} {en ? "Load more" : "और देखें"} | handleLoadMore | ui.4ddcb3ed46d76b6f / local |
| components/AppointmentManager.tsx:303 | Button | {en ? "Book New Appointment" : "नया अपॉइंटमेंट बुक करें"} | router.push | ui.6ab1ff691cb2d7b7 / local |

## /campaigns

Entry: `app/campaigns/page.tsx`. Local reachable templates: 13. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/camp-locations/index.tsx:323 | Button | {t.resetFilters} | resetAllFilters | ui.6281d64510ffa9dd / local |
| components/camp-locations/index.tsx:359 | Button | {en ? "Doctor Directory" : "चिकित्सक निर्देशिका"} | router.push | ui.d285353b4802a165 / local |
| components/camp-locations/index.tsx:368 | Button | {en ? "Teleconsultation" : "टेलीकंसल्टेशन"} | router.push | ui.dd61827482e17ef7 / local |
| components/camp-locations/parts/CampSearchFilters.tsx:79 | Input | {t.searchPlaceholder} | setSearchQuery | ui.a4d50693c423c2b5 / field |
| components/camp-locations/parts/CampSearchFilters.tsx:87 | Button | {t.resetFilters} | resetAllFilters | ui.ceeda1b6d5e1ded9 / local |
| components/camp-locations/parts/CampSearchFilters.tsx:106 | select | {t.allStates} [dynamic content] | setSelectedStateCode, setSelectedDistrictName | ui.2f46dbd86890c5db / field |
| components/camp-locations/parts/CampSearchFilters.tsx:128 | select | {t.allDistricts} [dynamic content] | setSelectedDistrictName | ui.bdcbce9362e5d4d4 / field |
| components/camp-locations/parts/CampSearchFilters.tsx:153 | button | {getCategoryIcon(cat.key)} {en ? cat.labelEn : cat.labelHi} | setSelectedCategory | ui.b33a6c403a09cc88 / local |
| components/camp-locations/parts/CampCard.tsx:189 | Button | {language === "en" ? "Helpline:" : "हेल्पलाइन:"} {camp.contact} | onCall | ui.356cef4a34f39efd / confirm |
| components/camp-locations/parts/CampCard.tsx:201 | Button | {language === "en" ? "Copy" : "कॉपी"} | onCopyNumber | ui.1ffc1b5829ecc50c / confirm |
| components/camp-locations/parts/CampCard.tsx:212 | Button | [unlabelled/dynamic] | onShare | ui.2808abf04980a4e3 / confirm |
| components/camp-locations/parts/CampCard.tsx:223 | Button | {language === "en" ? "Route" : "मार्ग"} | window.open, encodeURIComponent | ui.6c400021b6050090 / confirm |
| components/camp-locations/parts/CampCard.tsx:244 | Button | [dynamic content] | onRegister | ui.b543bbcf5692b747 / confirm |

## /camps

Entry: `app/camps/page.tsx`. Local reachable templates: 13. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/camp-locations/index.tsx:323 | Button | {t.resetFilters} | resetAllFilters | ui.6281d64510ffa9dd / local |
| components/camp-locations/index.tsx:359 | Button | {en ? "Doctor Directory" : "चिकित्सक निर्देशिका"} | router.push | ui.d285353b4802a165 / local |
| components/camp-locations/index.tsx:368 | Button | {en ? "Teleconsultation" : "टेलीकंसल्टेशन"} | router.push | ui.dd61827482e17ef7 / local |
| components/camp-locations/parts/CampSearchFilters.tsx:79 | Input | {t.searchPlaceholder} | setSearchQuery | ui.a4d50693c423c2b5 / field |
| components/camp-locations/parts/CampSearchFilters.tsx:87 | Button | {t.resetFilters} | resetAllFilters | ui.ceeda1b6d5e1ded9 / local |
| components/camp-locations/parts/CampSearchFilters.tsx:106 | select | {t.allStates} [dynamic content] | setSelectedStateCode, setSelectedDistrictName | ui.2f46dbd86890c5db / field |
| components/camp-locations/parts/CampSearchFilters.tsx:128 | select | {t.allDistricts} [dynamic content] | setSelectedDistrictName | ui.bdcbce9362e5d4d4 / field |
| components/camp-locations/parts/CampSearchFilters.tsx:153 | button | {getCategoryIcon(cat.key)} {en ? cat.labelEn : cat.labelHi} | setSelectedCategory | ui.b33a6c403a09cc88 / local |
| components/camp-locations/parts/CampCard.tsx:189 | Button | {language === "en" ? "Helpline:" : "हेल्पलाइन:"} {camp.contact} | onCall | ui.356cef4a34f39efd / confirm |
| components/camp-locations/parts/CampCard.tsx:201 | Button | {language === "en" ? "Copy" : "कॉपी"} | onCopyNumber | ui.1ffc1b5829ecc50c / confirm |
| components/camp-locations/parts/CampCard.tsx:212 | Button | [unlabelled/dynamic] | onShare | ui.2808abf04980a4e3 / confirm |
| components/camp-locations/parts/CampCard.tsx:223 | Button | {language === "en" ? "Route" : "मार्ग"} | window.open, encodeURIComponent | ui.6c400021b6050090 / confirm |
| components/camp-locations/parts/CampCard.tsx:244 | Button | [dynamic content] | onRegister | ui.b543bbcf5692b747 / confirm |

## /consultation

Entry: `app/consultation/page.tsx`. Local reachable templates: 46. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/authentication/index.tsx:284 | TabsTrigger | {t.login} | no direct handler: inspect wiring | ui.b37082e1a2e79366 / local |
| components/authentication/index.tsx:285 | TabsTrigger | {t.register} | no direct handler: inspect wiring | ui.6b6d2044ca4035ea / local |
| components/authentication/parts/OAuthGuestFooter.tsx:30 | Button | Google | onGoogleLogin | ui.01445b0eb8c7c8af / confirm |
| components/authentication/parts/OAuthGuestFooter.tsx:39 | Button | {t.guestAccess} | onGuestAccess | ui.69cca8e8d37db13b / confirm |
| components/authentication/parts/RegisterForm.tsx:40 | form | {t.name} {t.email} {t.phone} {t.password} {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {t.confirmPassword} [dynamic c | onSignUp | ui.f6c490fdc964eb46 / container |
| components/authentication/parts/RegisterForm.tsx:45 | Input | {[t.name].join(' ')} | onInputChange | ui.c45dcc54e3ac137c / field |
| components/authentication/parts/RegisterForm.tsx:59 | Input | {[t.email].join(' ')} | onInputChange | ui.787cfe7404c21895 / field |
| components/authentication/parts/RegisterForm.tsx:74 | Input | {[t.phone].join(' ')} | onInputChange | ui.c6310f820364f32a / field |
| components/authentication/parts/RegisterForm.tsx:88 | Input (secure) | {[t.password].join(' ')} | onInputChange | ui.255dd7fc86b738cf / handoff |
| components/authentication/parts/RegisterForm.tsx:97 | Button | {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} | setShowPassword | ui.ed8b8f12b057c6c9 / handoff |
| components/authentication/parts/RegisterForm.tsx:110 | Input (secure) | {[t.confirmPassword].join(' ')} | onInputChange | ui.f772e9808fef15e6 / handoff |
| components/authentication/parts/RegisterForm.tsx:120 | Button | [dynamic content] | parent form submission | ui.64ff192a95953ffb / confirm |
| components/authentication/parts/LoginForm.tsx:52 | button | 👤 Patient | onFillDemo | ui.24af5b1ecc313961 / confirm |
| components/authentication/parts/LoginForm.tsx:60 | button | 🩺 Doctor | onFillDemo | ui.8ad31c0f71393a33 / confirm |
| components/authentication/parts/LoginForm.tsx:68 | button | ⚡ Admin | onFillDemo | ui.c731f57581a85bc3 / confirm |
| components/authentication/parts/LoginForm.tsx:79 | form | {t.email} {t.password} {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {t.forgotPassword} [dynamic content] | onLogin | ui.fb32904e0489e274 / container |
| components/authentication/parts/LoginForm.tsx:84 | Input | {[t.email].join(' ')} | onInputChange | ui.d9a05694116d6a6e / field |
| components/authentication/parts/LoginForm.tsx:98 | Input (secure) | {[t.password].join(' ')} | onInputChange | ui.371c706ce4e0df90 / handoff |
| components/authentication/parts/LoginForm.tsx:107 | Button | {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} | setShowPassword | ui.84a30ff88dc37f7c / handoff |
| components/authentication/parts/LoginForm.tsx:121 | button | {t.forgotPassword} | onForgotPassword | ui.35a8a6a989dfaa6f / handoff |
| components/authentication/parts/LoginForm.tsx:131 | Button | [dynamic content] | parent form submission | ui.96145683862410ac / confirm |
| components/consultation-portal/index.tsx:252 | button | [unlabelled/dynamic] | setError | ui.5ba5ef32556155a0 / local |
| components/consultation-portal/parts/AppointmentConfirmation.tsx:171 | Button | {en ? "Send via WhatsApp" : "व्हाट्सएप पर भेजें"} | window.open, encodeURIComponent | ui.793195ffdbadd79d / confirm |
| components/consultation-portal/parts/AppointmentConfirmation.tsx:182 | Button | {en ? "Send via Direct SMS" : "एसएमएस द्वारा भेजें"} | encodeURIComponent | ui.a73f9e7c7378b3fb / confirm |
| components/consultation-portal/parts/AppointmentConfirmation.tsx:194 | Button | {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} {copiedLink ? (en ? "Link Copied!" : "कॉपी हो गया | navigator.clipboard.writeText, setCopiedLink, setTimeout | ui.97173b2ab64c5534 / local |
| components/consultation-portal/parts/AppointmentConfirmation.tsx:213 | a | {en ? `Call OPD Desk: ${successData.doctor.phone}` : `ओपीडी फोन: ${successData.doctor.phone}`} | link navigation | ui.d12b2ac0fb363b3b / link |
| components/consultation-portal/parts/AppointmentConfirmation.tsx:228 | Button | {en ? "Enter Virtual Clinic Room (Patient)" : "वर्चुअल क्लिनिक रूम में प्रवेश करें (मरीज)"} | router.push | ui.030aa8bbde7510f0 / local |
| components/consultation-portal/parts/AppointmentConfirmation.tsx:242 | Button | {en ? "Go to My Medical Records" : "मेरे मेडिकल रिकॉर्ड पर जाएं"} | router.push | ui.62b026786ee0135f / local |
| components/consultation-portal/parts/AppointmentConfirmation.tsx:252 | Button | {en ? "View in My Appointments" : "मेरी अपॉइंटमेंट सूची देखें"} | router.push | ui.86710f9ef3f712f1 / local |
| components/consultation-portal/parts/AppointmentConfirmation.tsx:262 | Button | {en ? "Book Another Appointment" : "एक और अपॉइंटमेंट बुक करें"} | onReset | ui.5ed40b741ab7604f / confirm |
| components/consultation-portal/parts/BookingFormStep.tsx:103 | button | {weekday} {dayNum} {isSunday && <span className="text-[9px] block text-red-400">Off</span>} | setSelectedDate, setSelectedSlot | ui.2a7c606391ab8d64 / local |
| components/consultation-portal/parts/BookingFormStep.tsx:145 | button | {isBooked ? `${s.time} ✕` : s.time} | setSelectedSlot | ui.171d59e2c4509e5a / local |
| components/consultation-portal/parts/BookingFormStep.tsx:178 | button | {isBooked ? `${s.time} ✕` : s.time} | setSelectedSlot | ui.caaf3eea95e260f8 / local |
| components/consultation-portal/parts/BookingFormStep.tsx:209 | Input | {[en ? "Patient Full Name:" : "मरीज का पूरा नाम:"].join(' ')} | setPatientName | ui.232565c09a08d49f / field |
| components/consultation-portal/parts/BookingFormStep.tsx:221 | Input | {[en ? "Contact Phone Number:" : "संपर्क फोन नंबर:"].join(' ')} | setPatientPhone | ui.e071324bc6cf972d / field |
| components/consultation-portal/parts/BookingFormStep.tsx:235 | textarea | {[en ? "Reason for Consultation / Symptoms:" : "परामर्श का कारण / लक्षण:"].join(' ')} | setNotes | ui.47926fd9eca0a551 / field |
| components/consultation-portal/parts/BookingFormStep.tsx:250 | Button | [dynamic content] | onBook | ui.50e277041615e29c / confirm |
| components/consultation-portal/parts/DoctorSelectionStep.tsx:71 | select | {en ? "All States (Pan-India)" : "सभी राज्य (अखिल भारतीय)"} [dynamic content] | setStateFilter | ui.44ee2df74dfe5798 / field |
| components/consultation-portal/parts/DoctorSelectionStep.tsx:90 | Input | { en ? "Search doctor name, specialty, hospital, city or district..." : "डॉक्टर का नाम, विशेषता, अस्पताल या शहर खोजें..." } | setDoctorSearch | ui.ddac381add197ab6 / field |
| components/consultation-portal/parts/DoctorSelectionStep.tsx:102 | button | ✕ | setDoctorSearch | ui.7979c0d14e6c88a8 / local |
| components/consultation-portal/parts/DoctorSelectionStep.tsx:116 | button | {en ? sp.labelEn : sp.labelHi} | setSpecialtyFilter, setSelectedDoctor | ui.e0c2831d0e706f06 / local |
| components/consultation-portal/parts/DoctorSelectionStep.tsx:145 | div | {getInitials(doc.name)} {doc.name} {en ? "✓ Registered" : "✓ पंजीकृत"} {doc.specialtyName} {doc.hospitalAffiliation} , {doc.districtName} [dynamic con | setSelectedDoctor, setSelectedSlot | ui.6a607eb536f91aca / local |
| components/consultation-portal/parts/DoctorSelectionStep.tsx:195 | button | {isSelected ? (en ? "✓ Selected" : "✓ चयनित") : en ? "Select" : "चुनें"} | no direct handler: inspect wiring | ui.648850fac3484bce / confirm |
| components/consultation-portal/parts/DoctorSelectionStep.tsx:218 | Button | {en ? "Prev" : "पिछला"} | setCurrentPage, Math.max | ui.be91c297003b2cba / local |
| components/consultation-portal/parts/DoctorSelectionStep.tsx:228 | Button | {en ? "Next" : "अगला"} | setCurrentPage, Math.min | ui.66121876aec0b156 / local |
| components/consultation-portal/parts/ConsultationModeStep.tsx:41 | button | {en ? ct.labelEn : ct.labelHi} {en ? ct.badgeEn : ct.badgeHi} | setConsultType | ui.1dd2e63afd38e9cf / local |

## /dashboard

Entry: `app/dashboard/page.tsx`. Local reachable templates: 34. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/AdminDashboard.tsx:208 | button | {action.label} | router.push | ui.3aab5316d245d0b0 / local |
| components/authentication/index.tsx:284 | TabsTrigger | {t.login} | no direct handler: inspect wiring | ui.b37082e1a2e79366 / local |
| components/authentication/index.tsx:285 | TabsTrigger | {t.register} | no direct handler: inspect wiring | ui.6b6d2044ca4035ea / local |
| components/authentication/parts/OAuthGuestFooter.tsx:30 | Button | Google | onGoogleLogin | ui.01445b0eb8c7c8af / confirm |
| components/authentication/parts/OAuthGuestFooter.tsx:39 | Button | {t.guestAccess} | onGuestAccess | ui.69cca8e8d37db13b / confirm |
| components/authentication/parts/RegisterForm.tsx:40 | form | {t.name} {t.email} {t.phone} {t.password} {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {t.confirmPassword} [dynamic c | onSignUp | ui.f6c490fdc964eb46 / container |
| components/authentication/parts/RegisterForm.tsx:45 | Input | {[t.name].join(' ')} | onInputChange | ui.c45dcc54e3ac137c / field |
| components/authentication/parts/RegisterForm.tsx:59 | Input | {[t.email].join(' ')} | onInputChange | ui.787cfe7404c21895 / field |
| components/authentication/parts/RegisterForm.tsx:74 | Input | {[t.phone].join(' ')} | onInputChange | ui.c6310f820364f32a / field |
| components/authentication/parts/RegisterForm.tsx:88 | Input (secure) | {[t.password].join(' ')} | onInputChange | ui.255dd7fc86b738cf / handoff |
| components/authentication/parts/RegisterForm.tsx:97 | Button | {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} | setShowPassword | ui.ed8b8f12b057c6c9 / handoff |
| components/authentication/parts/RegisterForm.tsx:110 | Input (secure) | {[t.confirmPassword].join(' ')} | onInputChange | ui.f772e9808fef15e6 / handoff |
| components/authentication/parts/RegisterForm.tsx:120 | Button | [dynamic content] | parent form submission | ui.64ff192a95953ffb / confirm |
| components/authentication/parts/LoginForm.tsx:52 | button | 👤 Patient | onFillDemo | ui.24af5b1ecc313961 / confirm |
| components/authentication/parts/LoginForm.tsx:60 | button | 🩺 Doctor | onFillDemo | ui.8ad31c0f71393a33 / confirm |
| components/authentication/parts/LoginForm.tsx:68 | button | ⚡ Admin | onFillDemo | ui.c731f57581a85bc3 / confirm |
| components/authentication/parts/LoginForm.tsx:79 | form | {t.email} {t.password} {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {t.forgotPassword} [dynamic content] | onLogin | ui.fb32904e0489e274 / container |
| components/authentication/parts/LoginForm.tsx:84 | Input | {[t.email].join(' ')} | onInputChange | ui.d9a05694116d6a6e / field |
| components/authentication/parts/LoginForm.tsx:98 | Input (secure) | {[t.password].join(' ')} | onInputChange | ui.371c706ce4e0df90 / handoff |
| components/authentication/parts/LoginForm.tsx:107 | Button | {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} | setShowPassword | ui.84a30ff88dc37f7c / handoff |
| components/authentication/parts/LoginForm.tsx:121 | button | {t.forgotPassword} | onForgotPassword | ui.35a8a6a989dfaa6f / handoff |
| components/authentication/parts/LoginForm.tsx:131 | Button | [dynamic content] | parent form submission | ui.96145683862410ac / confirm |
| components/DoctorDashboard.tsx:186 | Button | {btnLabel} | joinCall | ui.1a11de9ec80769f1 / confirm |
| components/DoctorDashboard.tsx:191 | Button | {en ? "Done" : "पूर्ण"} | markDone | ui.c59e9bd3c90987a9 / confirm |
| components/DoctorDashboard.tsx:200 | Button | {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} {en ? "Load more" : "और देखें"} | handleLoadMoreAppointments | ui.eccd70e342877b58 / local |
| components/DoctorDashboard.tsx:268 | button | {action.label} | router.push | ui.791db3e2546a70f2 / local |
| components/dashboard/parts/RegisteredCampsList.tsx:37 | Button | {viewAllText} | router.push | ui.123f736a3af53e3d / local |
| components/dashboard/parts/SchemesPreview.tsx:70 | Button | {language === "en" ? "View All Government Schemes" : "सभी सरकारी योजनाएं देखें"} | router.push | ui.6a5334ac1a920371 / local |
| components/dashboard/parts/QuickActions.tsx:32 | Button | {t.bookConsultation} | router.push | ui.d0f2f1c91c47efd3 / local |
| components/dashboard/parts/QuickActions.tsx:40 | Button | {t.viewDirectory} | router.push | ui.eda17bec2841fd0b / local |
| components/dashboard/parts/QuickActions.tsx:49 | Button | {t.joinCampaign} | router.push | ui.794dffe4dda2a42f / local |
| components/dashboard/parts/QuickActions.tsx:58 | Button | [dynamic content] | router.push | ui.4e2e0c541cda2275 / local |
| components/dashboard/parts/QuickActions.tsx:79 | Button | {t.emergencyContact} | router.push | ui.29de197c11886f09 / local |
| components/dashboard/parts/WelcomeHeader.tsx:85 | Button | {language === "en" ? "Emergency SOS" : "आपातकालीन SOS"} | router.push | ui.5faa3be960bd4221 / local |

## /directory

Entry: `app/directory/page.tsx`. Local reachable templates: 29. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/directory/index.tsx:231 | Input | { language === "hi" ? "डॉक्टर, विशेषता, अस्पताल, शहर या ज़िला खोजें (जैसे डॉ. शर्मा, हृदय रोग, एम्स, भोपाल)..." : "Search doctor, specialty, hospital, | setSearchQuery | ui.5c67444981886e4f / field |
| components/directory/index.tsx:243 | button | [unlabelled/dynamic] | setSearchQuery | ui.de76451e5bbb8870 / local |
| components/directory/index.tsx:255 | Button | [dynamic content] [dynamic content] | setIsFilterMenuOpen | ui.6dbe0ccd208e7a53 / local |
| components/directory/index.tsx:286 | Button | {t.resetFilters} | resetAllFilters | ui.1d725d7eadeecbf2 / local |
| components/directory/index.tsx:323 | button | {specialty.label} | setSelectedSpecialty | ui.36217303766779fc / local |
| components/directory/parts/DirectoryResults.tsx:117 | Button | {t.resetFilters} | resetAllFilters | ui.51b8dafcd6090008 / local |
| components/directory/parts/DirectoryPagination.tsx:45 | Button | {language === "hi" ? "पिछला" : "Previous"} | handlePageSelect, Math.max | ui.715fde387bb07016 / confirm |
| components/directory/parts/DirectoryPagination.tsx:63 | button | {p} | handlePageSelect | ui.e3c723eb0f640841 / confirm |
| components/directory/parts/DirectoryPagination.tsx:78 | Button | {language === "hi" ? "अगला" : "Next"} | handlePageSelect, Math.min | ui.a2bbf6b413eba652 / confirm |
| components/directory/parts/DoctorCard.tsx:231 | Button | {t.callNow} | window.open | ui.4784354a0fcb8ec8 / confirm |
| components/directory/parts/DoctorCard.tsx:240 | Button | {language === "hi" ? "असूचीबद्ध" : "Unlisted"} | no direct handler: inspect wiring | ui.c670b906ec638770 / confirm |
| components/directory/parts/DoctorCard.tsx:252 | Button | {language === "hi" ? "मार्ग" : "Route"} | window.open | ui.e79ec33277810e6a / confirm |
| components/directory/parts/DoctorCard.tsx:269 | Button | {t.bookAppointment} | router.push | ui.9f138415ecad26a2 / local |
| components/directory/parts/DirectoryHeader.tsx:58 | Button | {language === "hi" ? "सुविधा मानचित्र खोलें" : "Open Facility Map"} | router.push | ui.0773508feaa931fb / local |
| components/directory/parts/LocationFiltersPanel.tsx:73 | Button | {language === "hi" ? "राज्य फ़िल्टर हटाएं" : "Clear State to Use GPS"} | setSelectedStateCode, setSelectedDistrictName | ui.1fec09a6bd800167 / local |
| components/directory/parts/LocationFiltersPanel.tsx:98 | button | {language === "hi" ? "GPS हटाएं" : "Clear GPS"} | setUserCoords, setLocationStatus | ui.4ca74873a167b204 / local |
| components/directory/parts/LocationFiltersPanel.tsx:105 | Button | [dynamic content] | handleDetectLocation | ui.2af606da584a597a / confirm |
| components/directory/parts/LocationFiltersPanel.tsx:132 | button | {rad} km | setSelectedRadius | ui.24c0018c38bb9ad7 / local |
| components/directory/parts/LocationFiltersPanel.tsx:166 | Button | {language === "hi" ? "GPS बंद करें" : "Clear GPS to Select State"} | setUserCoords, setLocationStatus | ui.0e634383b3197287 / local |
| components/directory/parts/LocationFiltersPanel.tsx:188 | button | {language === "hi" ? "हटाएं" : "Clear State"} | setSelectedStateCode, setSelectedDistrictName | ui.1e39cee4517b1b48 / local |
| components/directory/parts/LocationFiltersPanel.tsx:198 | SearchableDropdown | {t.stateFilter} | setSelectedStateCode, setSelectedDistrictName | ui.7bbfbeada2fead7b / container |
| components/directory/parts/LocationFiltersPanel.tsx:211 | SearchableDropdown | {t.districtFilter} | setSelectedDistrictName | ui.9894b6eb5dd891d8 / container |
| components/directory/parts/SearchableDropdown.tsx:82 | button | {displayName} | setIsOpen | ui.8ee3b5c404063e66 / local |
| components/directory/parts/SearchableDropdown.tsx:109 | input | {[label].join(' ')} | setSearchTerm | ui.48f3d4467e7ebd0a / field |
| components/directory/parts/SearchableDropdown.tsx:121 | button | {allOptionLabel} {selectedCode === "all" && ( <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 ml-1.5" /> )} | onSelect, setIsOpen | ui.7b277f096a74672a / local |
| components/directory/parts/SearchableDropdown.tsx:148 | button | {language === "hi" && item.nameHi ? item.nameHi : item.nameEn} {isSelected && ( <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 ml-1.5" /> )} | onSelect, setIsOpen | ui.3252d467a73c2346 / local |
| components/directory/parts/LocationGuardPrompt.tsx:50 | Button | {isLocating ? t.detectingLocation : "📍 Use My GPS Location"} | onDetectLocation | ui.2d7931406d15fdef / confirm |
| components/directory/parts/LocationGuardPrompt.tsx:58 | Button | {language === "hi" ? "राज्य एवं ज़िला चुनें" : "Select State & District"} | onOpenFilterMenu | ui.fa99c1f5fef9d59a / confirm |
| components/directory/parts/LocationGuardPrompt.tsx:82 | button | {s.name} | onSelectState | ui.b7ee4b55b6b0be50 / local |

## /doctor/claim

Entry: `app/doctor/claim/page.tsx`. Local reachable templates: 14. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| app/doctor/claim/page.tsx:211 | Button | Go to Doctor Dashboard → | router.push | ui.fe9c8f5071bfb386 / local |
| app/doctor/claim/page.tsx:238 | Button | Return to Healthcare Home | router.push | ui.30100d792ef2da4b / local |
| app/doctor/claim/page.tsx:249 | form | {targetDoctor.name.slice(0, 2).toUpperCase()} {targetDoctor.name} NMC Verified {targetDoctor.qualifications} {targetDoctor.hospitalAffiliation} Reg No | handleClaimSubmit | ui.fa34a0eeff711d5d / handoff |
| app/doctor/claim/page.tsx:279 | Input | {["NMC / State Medical Council Reg No:"].join(' ')} | setCouncilRegInput | ui.0047ee6b17d18e88 / field |
| app/doctor/claim/page.tsx:291 | Input | {["Doctor Mobile Phone (for OTP & Alerts):"].join(' ')} | setMobileNumber | ui.ac40c9d7f6e9fe92 / field |
| app/doctor/claim/page.tsx:304 | Input | {["Professional / Hospital Email Address:"].join(' ')} | setEmailAddress | ui.19576ca010dca3ec / field |
| app/doctor/claim/page.tsx:318 | Input | e.g. dr.name@okhdfcbank or 9826012345@upi | setCustomUpi | ui.95f089103b99f8e3 / field |
| app/doctor/claim/page.tsx:337 | Button | {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Submit Profile Claim for Admin Verification | parent form submission | ui.1da2c088f24572ec / handoff |
| app/doctor/claim/page.tsx:354 | Button | ← Return to Healthcare Home | router.push | ui.66ef0e9c540b29f1 / local |
| app/doctor/claim/no-invite-card.tsx:71 | form | Have a Private Invite Link from SMS or WhatsApp? [dynamic content] Verify & Open Invitation | onManualTokenSubmit | ui.0361bd8b1d954a6e / handoff |
| app/doctor/claim/no-invite-card.tsx:77 | Input | Paste your private invitation URL here... | setManualToken | ui.ff37b2f8c67e49b3 / handoff |
| app/doctor/claim/no-invite-card.tsx:91 | Button | Verify & Open Invitation | parent form submission | ui.ad0574c43e4d32e2 / handoff |
| app/doctor/claim/no-invite-card.tsx:100 | Button | ← Return to Home | onReturnHome | ui.8ec77e2a49bdbbdd / confirm |
| app/doctor/claim/no-invite-card.tsx:108 | Button | Doctor Login → | onDoctorLogin | ui.1c10498caf65ee9c / confirm |

## /doctor/dashboard

Entry: `app/doctor/dashboard/page.tsx`. Local reachable templates: 4. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/DoctorDashboard.tsx:186 | Button | {btnLabel} | joinCall | ui.1a11de9ec80769f1 / confirm |
| components/DoctorDashboard.tsx:191 | Button | {en ? "Done" : "पूर्ण"} | markDone | ui.c59e9bd3c90987a9 / confirm |
| components/DoctorDashboard.tsx:200 | Button | {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} {en ? "Load more" : "और देखें"} | handleLoadMoreAppointments | ui.eccd70e342877b58 / local |
| components/DoctorDashboard.tsx:268 | button | {action.label} | router.push | ui.791db3e2546a70f2 / local |

## /doctor/patients

Entry: `app/doctor/patients/page.tsx`. Local reachable templates: 3. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/doctor-patients/index.tsx:246 | input | {en ? "Search patients by name, email, phone..." : "नाम, ईमेल, फ़ोन से खोजें..."} | setSearch | ui.e2651c25a4d74e35 / field |
| components/doctor-patients/parts/PatientCard.tsx:108 | button | [dynamic content] {en ? "Records" : "रिकॉर्ड"} {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} | onToggleRecords | ui.7955839421acfb23 / confirm |
| components/doctor-patients/parts/PatientCard.tsx:169 | a | {en ? "View attached document" : "संलग्न फ़ाइल देखें"} | link navigation | ui.404d0afdcb79e88e / link |

## /doctor/requests

Entry: `app/doctor/requests/page.tsx`. Local reachable templates: 8. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/DoctorAppointmentRequests.tsx:139 | button | {t === "pending" ? (en ? "Pending" : "लंबित") : t === "approved" ? (en ? "Completed" : "पूर्ण") : (en ? "All" : "सभी")} ( [dynamic content] ) | setTab | ui.a0745c0d60dc5ee1 / local |
| components/DoctorAppointmentRequests.tsx:152 | input | {en ? "Search by patient name or notes..." : "मरीज़ या नोट्स से खोजें..."} | setSearch | ui.08ffaa6f90a600ae / field |
| components/DoctorAppointmentRequests.tsx:208 | button | {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />} | setExpanded | ui.6bf9f7eef6480b99 / local |
| components/DoctorAppointmentRequests.tsx:229 | Button | {ct.type === "Video" ? (en ? "Join Video" : "वीडियो जॉइन") : ct.type === "Audio" ? (en ? "Join Call" : "कॉल जॉइन") : (en ? "Chat" : "चैट")} | router.push, encodeURIComponent | ui.e2424bfddc156e77 / local |
| components/DoctorAppointmentRequests.tsx:243 | Button | {updating === appt.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />} {en ? "Mark Completed" : "पूर्ण करें" | updateStatus | ui.46c19da2ee343aeb / confirm |
| components/DoctorAppointmentRequests.tsx:249 | Button | {en ? "Cancel" : "रद्द करें"} | updateStatus | ui.c51bd7b201a28656 / confirm |
| components/DoctorAppointmentRequests.tsx:264 | Button | {en ? "Re-schedule" : "पुनः शेड्यूल"} | updateStatus | ui.703651f2b8ae5f39 / confirm |
| components/DoctorAppointmentRequests.tsx:284 | Button | {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} {en ? "Load more" : "और देखें"} | handleLoadMore | ui.9d00efa97200d8e5 / local |

## /emergency

Entry: `app/emergency/page.tsx`. Local reachable templates: 40. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/emergency/parts/EmergencyVaultSummary.tsx:39 | Button | {t.editVault} | onOpenVault | ui.8fddc4107fa25f5b / confirm |
| components/emergency/parts/EmergencyPrimaryActions.tsx:43 | Button | {t.call108} | no direct handler: inspect wiring | ui.08a2bd20cbeb677c / confirm |
| components/emergency/parts/EmergencyPrimaryActions.tsx:52 | Button | {t.distressBtn} | onTriggerDistressSos | ui.d7805a75f70bcee4 / confirm |
| components/emergency/parts/EmergencyPrimaryActions.tsx:63 | Button | {t.contactBtn} | onOpenContactAlert | ui.16c32bb055f9f667 / confirm |
| components/emergency/parts/EmergencyPrimaryActions.tsx:73 | Button | {t.beaconBtn} {t.beaconBtnSub} | onStartBeacon | ui.6f819cdc5c3baed0 / confirm |
| components/emergency/parts/EmergencyPrimaryActions.tsx:85 | Button | {t.findHospital} | router.push | ui.e3327d947c79f27f / local |
| components/emergency/parts/EmergencyPrimaryActions.tsx:94 | Button | {t.firstAid} {t.firstAidSub} | router.push | ui.3ee19cd7d79e3479 / local |
| components/emergency/parts/ShakeDistressPrompt.tsx:54 | Button | {language === "en" ? "Cancel (Accidental)" : "रद्द करें (गलती से हुआ)"} | onCancel | ui.28f831a44155c263 / confirm |
| components/emergency/parts/ShakeDistressPrompt.tsx:61 | Button | {language === "en" ? "Send Now" : "अभी भेजें"} | onConfirm | ui.e1175e365e38a229 / confirm |
| components/emergency/parts/StrobeBeaconOverlay.tsx:69 | Button | {sirenActive ? <Volume2 className="mr-1.5 h-4 w-4" /> : <VolumeX className="mr-1.5 h-4 w-4" />} {sirenActive ? t.sirenOff : t.sirenOn} | onToggleSiren | ui.2596832a19cdfa1e / confirm |
| components/emergency/parts/StrobeBeaconOverlay.tsx:79 | Button | {torchActive ? t.torchOff : t.torchOn} | onToggleTorch | ui.96e48bb0faf7fbf2 / confirm |
| components/emergency/parts/StrobeBeaconOverlay.tsx:91 | Button | {t.stopBeacon} | onStopAllAlarms | ui.895b87aee2fc4139 / confirm |
| components/emergency/parts/EmergencyContactsModal.tsx:83 | Button | [dynamic content] | setIsTestSmsMode | ui.23fc8723d502f3bc / local |
| components/emergency/parts/EmergencyContactsModal.tsx:108 | button | [dynamic content] | onToggleSelectAll | ui.fde8ca8d2f3c5b9a / confirm |
| components/emergency/parts/EmergencyContactsModal.tsx:125 | div | [dynamic content] {contact.label} {contact.number} {t.waDirect} | onToggleContactSelection | ui.9cffa4558c3d3c60 / confirm |
| components/emergency/parts/EmergencyContactsModal.tsx:146 | button | {t.waDirect} | e.stopPropagation, onSendWhatsApp | ui.cf9f4f1c9f356110 / confirm |
| components/emergency/parts/EmergencyContactsModal.tsx:163 | Button | [dynamic content] | onSendNormalSms | ui.80fc2fdef4f2fee3 / confirm |
| components/emergency/parts/EmergencyContactsModal.tsx:179 | Button | {t.shareWaAll} | onShareViaApps | ui.aaab49b5c5b21a05 / confirm |
| components/emergency/parts/EmergencyVaultModal.tsx:50 | Input | {[t.fullName].join(' ')} | setEditingProfile | ui.455ffb0cc3f05276 / field |
| components/emergency/parts/EmergencyVaultModal.tsx:58 | Input | {[t.age].join(' ')} | setEditingProfile | ui.b8a00763db003eb4 / field |
| components/emergency/parts/EmergencyVaultModal.tsx:68 | select | {[t.bloodGroup].join(' ')} | setEditingProfile | ui.b07915b3f44c96c3 / field |
| components/emergency/parts/EmergencyVaultModal.tsx:87 | Input | {[t.primaryContact].join(' ')} | setEditingProfile | ui.7831528edd712fa6 / field |
| components/emergency/parts/EmergencyVaultModal.tsx:96 | Input | {[t.secondaryContact].join(' ')} | setEditingProfile | ui.1347d9cc5b32c94f / field |
| components/emergency/parts/EmergencyVaultModal.tsx:105 | Input | {[t.tertiaryContact].join(' ')} | setEditingProfile | ui.0280e5f220d6a31d / field |
| components/emergency/parts/EmergencyVaultModal.tsx:115 | Input | {[t.chronicConditions].join(' ')} | setEditingProfile | ui.7bf4e4a593cc9126 / field |
| components/emergency/parts/EmergencyVaultModal.tsx:124 | Input | {[t.allergies].join(' ')} | setEditingProfile | ui.5199db32c0d801fb / field |
| components/emergency/parts/EmergencyVaultModal.tsx:133 | Input | {[t.medications].join(' ')} | setEditingProfile | ui.5549448269c5b427 / field |
| components/emergency/parts/EmergencyVaultModal.tsx:145 | Input | {[t.customVoiceLabel].join(' ')} | setEditingProfile | ui.e2d32d43be081dd2 / field |
| components/emergency/parts/EmergencyVaultModal.tsx:156 | Button | {language === "en" ? "Save Emergency Profile" : "आपातकालीन प्रोफाइल सुरक्षित करें"} | onSave | ui.47eb156de9647f67 / confirm |
| components/helpline-directory/index.tsx:192 | Button | {t.resetFilters} | setSearchQuery, setSelectedCategory | ui.9106b3d5b2a30038 / local |
| components/helpline-directory/parts/HelplineCard.tsx:31 | div | [dynamic content] {en ? theme.en : theme.hi} [dynamic content] [dynamic content] {en ? item.serviceEn : item.serviceHi} {en ? item.descriptionEn : ite | no direct handler: inspect wiring | ui.72d3a62f3a6578ea / confirm |
| components/helpline-directory/parts/HelplineCard.tsx:106 | button | Copy number | onCopy | ui.35f91c0f1e7e05a6 / confirm |
| components/helpline-directory/parts/HelplineCard.tsx:120 | Button | {t.callNow} | e.stopPropagation | ui.673ba271d043f52a / confirm |
| components/helpline-directory/parts/HelplineHeaderControls.tsx:68 | button | {en ? "State View" : "राज्य अनुसार"} | setViewMode | ui.fce8d312a283b484 / local |
| components/helpline-directory/parts/HelplineHeaderControls.tsx:79 | button | {en ? "All-India Directory" : "संपूर्ण देश"} | setViewMode | ui.a207aad07da8223c / local |
| components/helpline-directory/parts/HelplineHeaderControls.tsx:100 | select | [dynamic content] | setSelectedStateCode | ui.e3ec592c439db024 / field |
| components/helpline-directory/parts/HelplineHeaderControls.tsx:113 | Button | {isDetectingLocation ? en ? "Detecting..." : "पहचान रहा है..." : en ? "Detect My State" : "मेरा राज्य पहचानें"} | handleDetectLocation | ui.a132fb6cb0d02fab / confirm |
| components/helpline-directory/parts/HelplineHeaderControls.tsx:133 | Input | { en ? "Search helplines by name, number (e.g. 108, 112, 104), or topic..." : "नाम, नंबर (उदा. 108, 112, 104) या विषय से खोजें..." } | setSearchQuery | ui.5620f88690e201d6 / field |
| components/helpline-directory/parts/HelplineHeaderControls.tsx:152 | button | {en ? theme.en : theme.hi} | setSelectedCategory | ui.1acb4db87f39859d / local |
| components/helpline-directory/parts/CriticalFastDialBar.tsx:51 | a | {item.number} {en ? item.serviceEn : item.serviceHi} {item.category} {t.tollFree} {t.callNow} → | link navigation | ui.de608491033eb524 / link |

## /health-info

Entry: `app/health-info/page.tsx`. Local reachable templates: 19. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/health-info-hub/index.tsx:69 | Button | {t.label} | setTab | ui.00dc9566c3079571 / local |
| components/health-info-hub/index.tsx:85 | Button | {en ? "View Government Health Schemes" : "सरकारी स्वास्थ्य योजनाएं देखें"} | router.push | ui.27b516960d8cf3e0 / local |
| components/health-info-hub/index.tsx:97 | input | {en ? "Search..." : "खोजें..."} | setSearch | ui.0914431bc5187221 / field |
| components/health-info-hub/parts/AshaCopilotTab.tsx:80 | Button | {en ? "Child IMCI (0-5 Yrs)" : "शिशु स्वास्थ्य (0-5 वर्ष)"} | setCopilotMode | ui.ff375ec3db7662d3 / local |
| components/health-info-hub/parts/AshaCopilotTab.tsx:89 | Button | {en ? "Maternal ANC Risk" : "गर्भावस्था जोखिम"} | setCopilotMode | ui.1108a9d6834c335f / local |
| components/health-info-hub/parts/MaternalAncSection.tsx:45 | input | [unlabelled/dynamic] | setAncData | ui.30b27125b9a6b5d5 / field |
| components/health-info-hub/parts/MaternalAncSection.tsx:61 | input | {[en ? "Systolic BP (mmHg)" : "सिस्टोलिक बीपी"].join(' ')} | setAncData, Number | ui.253a7c30eb5600da / field |
| components/health-info-hub/parts/MaternalAncSection.tsx:72 | input | {[en ? "Diastolic BP (mmHg)" : "डायस्टोलिक बीपी"].join(' ')} | setAncData, Number | ui.f67f64136cd6e139 / field |
| components/health-info-hub/parts/MaternalAncSection.tsx:141 | a | {en ? "Call 108 (Obstetric Ambulance)" : "108 एम्बुलेंस बुलाएं"} | link navigation | ui.b3fa2deffa549d2c / link |
| components/health-info-hub/parts/MaternalAncSection.tsx:147 | button | {en ? "Nearest FRU / Hospital" : "निकटतम एफआरयू / अस्पताल"} | router.push | ui.40f5d5e4e4e72c49 / local |
| components/health-info-hub/parts/ChildImciSection.tsx:43 | input | [unlabelled/dynamic] | setImciData | ui.1996505af5cac069 / field |
| components/health-info-hub/parts/ChildImciSection.tsx:60 | input | [unlabelled/dynamic] | setImciData | ui.863bf02ab33b53ff / field |
| components/health-info-hub/parts/ChildImciSection.tsx:73 | input | [unlabelled/dynamic] | setImciData, Number | ui.1c1902b38f874cb8 / field |
| components/health-info-hub/parts/ChildImciSection.tsx:84 | input | [unlabelled/dynamic] | setImciData | ui.b582c9ea14bfc71a / field |
| components/health-info-hub/parts/ChildImciSection.tsx:96 | input | [unlabelled/dynamic] | setImciData | ui.c18faa5a078b4c12 / field |
| components/health-info-hub/parts/ChildImciSection.tsx:108 | input | [unlabelled/dynamic] | setImciData | ui.31e485c643c43342 / field |
| components/health-info-hub/parts/ChildImciSection.tsx:117 | input | [unlabelled/dynamic] | setImciData | ui.da82500fab8f308c / field |
| components/health-info-hub/parts/ChildImciSection.tsx:189 | a | {en ? "Dial 108 Ambulance" : "108 एम्बुलेंस डायल करें"} | link navigation | ui.9db5787575df2487 / link |
| components/health-info-hub/parts/ChildImciSection.tsx:195 | button | {en ? "Find Nearest Hospital" : "निकटतम अस्पताल देखें"} | router.push | ui.903e276b2fa3543a / local |

## /health-info/schemes

Entry: `app/health-info/schemes/page.tsx`. Local reachable templates: 19. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/government-schemes/index.tsx:125 | button | {en ? "Back" : "वापस"} | router.back | ui.badee11319ec974e / local |
| components/government-schemes/index.tsx:226 | Button | {en ? "Reset All Filters" : "सभी फ़िल्टर रीसेट करें"} | resetAllFilters | ui.3634ce04f201e3b4 / local |
| components/government-schemes/parts/SchemePagination.tsx:45 | Button | {en ? "Previous" : "पिछला"} | handleSelectPage, Math.max | ui.648e04fc00d1dd90 / confirm |
| components/government-schemes/parts/SchemePagination.tsx:69 | button | {page} | handleSelectPage | ui.f9a0c6c7643c6926 / confirm |
| components/government-schemes/parts/SchemePagination.tsx:83 | Button | {en ? "Next" : "अगला"} | handleSelectPage, Math.min | ui.8388e908a4456d9e / confirm |
| components/government-schemes/parts/SchemeCard.tsx:132 | Button | {scheme.contactPhone} | window.open, scheme.contactPhone.split | ui.92bd7fa5ec453006 / confirm |
| components/government-schemes/parts/SchemeCard.tsx:143 | Button | {scheme.contactWeb} | window.open | ui.938fe2ebb4dbe47b / confirm |
| components/government-schemes/parts/SchemeFilterControls.tsx:62 | button | {en ? `All Schemes (${totalCount})` : `सभी योजनाएं (${totalCount})`} | setScopeMode | ui.046f0fd9fcff83eb / local |
| components/government-schemes/parts/SchemeFilterControls.tsx:72 | button | {en ? `🇮🇳 National (${nationalCount})` : `🇮🇳 केंद्रीय योजनाएं (${nationalCount})`} | setScopeMode | ui.d1f7ef4e777fa1ee / local |
| components/government-schemes/parts/SchemeFilterControls.tsx:82 | button | {en ? `🏛️ State Schemes (${stateCount})` : `🏛️ राज्य योजनाएं (${stateCount})`} | setScopeMode | ui.3e5c93ec0861b500 / local |
| components/government-schemes/parts/SchemeFilterControls.tsx:100 | SearchableStateSelect | [unlabelled/dynamic] | setSelectedStateCode | ui.b5cb6936669b833d / container |
| components/government-schemes/parts/SchemeFilterControls.tsx:116 | Input | { en ? "Search scheme name, disease (e.g. Cancer, Paralysis, Kidney), benefits, or authority..." : "योजना का नाम, बीमारी (जैसे कैंसर, लकवा, डायलिसिस), | setSearchQuery | ui.83765125f3971297 / field |
| components/government-schemes/parts/SchemeFilterControls.tsx:128 | button | [unlabelled/dynamic] | setSearchQuery | ui.e86496679fcf2ed4 / local |
| components/government-schemes/parts/SchemeFilterControls.tsx:147 | button | {en ? "Reset All" : "रीसेट करें"} | resetAllFilters | ui.d4889df6dd9cda8e / local |
| components/government-schemes/parts/SchemeFilterControls.tsx:161 | button | {getCategoryIcon(cat.key, "h-3.5 w-3.5")} {en ? cat.labelEn : cat.labelHi} | setSelectedCategory | ui.7af85df7d76850e8 / local |
| components/government-schemes/parts/SearchableStateSelect.tsx:83 | button | {displayName} | setIsOpen | ui.3a03981f9d5bd12b / local |
| components/government-schemes/parts/SearchableStateSelect.tsx:105 | input | {language === "hi" ? "राज्य खोजें..." : "Type to filter states..."} | setSearchTerm | ui.6f0bc6ad661e746a / field |
| components/government-schemes/parts/SearchableStateSelect.tsx:116 | button | {language === "hi" ? "सभी राज्य एवं केंद्र शासित प्रदेश" : "All States & UTs"} {selectedStateCode === "all" && ( <Check className="h-3.5 w-3.5 text-bl | onSelect, setIsOpen | ui.7a9cb951ba66fcaf / local |
| components/government-schemes/parts/SearchableStateSelect.tsx:137 | button | {language === "hi" ? item.nameHi : item.nameEn} ( {item.count} ) {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />} | onSelect, setIsOpen | ui.82072eb0c2f1a137 / local |

## /locations

Entry: `app/locations/page.tsx`. Local reachable templates: 29. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/map-view/index.tsx:227 | a | {en ? "Open Navigation App" : "मानचित्र ऐप में खोलें"} | link navigation | ui.5a670490cba71047 / link |
| components/map-view/index.tsx:256 | Button | {en ? "Clear Route" : "मार्ग हटाएं"} | setRouteData | ui.6a00842567934279 / local |
| components/map-view/parts/FacilityListPagination.tsx:35 | Button | {en ? "Previous" : "पिछला"} | onPageChange, Math.max | ui.419103d716d45697 / local |
| components/map-view/parts/FacilityListPagination.tsx:52 | Button | {en ? "Next" : "अगला"} | onPageChange, Math.min | ui.fec27ae58fc72b13 / local |
| components/map-view/parts/FacilityMapControls.tsx:87 | SearchableDropdown | {en ? "State" : "राज्य"} | onStateChange | ui.c409f2cc5d0d8184 / container |
| components/map-view/parts/FacilityMapControls.tsx:99 | SearchableDropdown | {en ? "District" : "जिला"} | onDistrictChange | ui.078e0bff4c22ae48 / container |
| components/map-view/parts/FacilityMapControls.tsx:117 | Input | {[en ? "Search Facility" : "सुविधा खोजें"].join(' ')} | setSearchQuery | ui.aacb7b5278886778 / field |
| components/map-view/parts/FacilityMapControls.tsx:131 | button | [dynamic content] | onFilterChange | ui.0032e5c70cf0d313 / local |
| components/map-view/parts/FacilityMapControls.tsx:152 | Button | {locating ? <Loader2 className="h-4 w-4 animate-spin"/> : <LocateFixed className="h-4 w-4"/>} {en ? "Use My Location" : "मेरा स्थान"} | onUseMyLocation | ui.32ff11f9a954ab08 / confirm |
| components/map-view/parts/FacilityMapControls.tsx:156 | select | {[en ? "Search radius" : "खोज का दायरा"].join(' ')} | onRadiusChange, Number | ui.d000cf7f1414a10b / field |
| components/map-view/parts/FacilityMapControls.tsx:168 | Button | {nearestLabel} | onNearest | ui.460c306d2393970b / local |
| components/map-view/parts/FacilityMapControls.tsx:182 | Button | {isMapExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />} {isMapExpanded ? en ? "Compact map" : "छोटा नक्शा" : e | setIsMapExpanded | ui.b5e235754a451f6e / local |
| components/map-view/parts/SearchableDropdown.tsx:87 | button | {`${label}: ${displayName}`} | setIsOpen | ui.acc86de0a84026ee / local |
| components/map-view/parts/SearchableDropdown.tsx:106 | input | {[label].join(' ')} | setSearchTerm | ui.26b62ad39de50d91 / field |
| components/map-view/parts/SearchableDropdown.tsx:125 | button | {en ? item.nameEn : item.nameHi \|\| item.nameEn} {isSelected && ( <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 ml-1.5" /> )} | onSelect, setIsOpen | ui.202dc0f234e1e46e / local |
| components/map-view/parts/FacilityPopupContent.tsx:143 | a | {f.phone} {en ? "Call" : "कॉल"} | link navigation | ui.284c4c3866dc78af / link |
| components/map-view/parts/FacilityPopupContent.tsx:160 | a | {en ? "Book Consultation" : "परामर्श बुक करें"} | link navigation | ui.534027ed62a120bc / link |
| components/map-view/parts/FacilityPopupContent.tsx:168 | Button | {routingLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Navigation className="h-3 w-3 mr-1" />} [dynamic content] | onShowRoute | ui.5bb33774e8bc69e5 / local |
| components/map-view/parts/FacilityPopupContent.tsx:183 | a | {en ? "Open in Navigation App" : "मानचित्र ऐप में खोलें"} | link navigation | ui.962e568e751796f9 / link |
| components/map-view/parts/FacilityCard.tsx:220 | a | {en ? "Call" : "कॉल"} | link navigation | ui.3f3ede1b01d49393 / link |
| components/map-view/parts/FacilityCard.tsx:235 | a | {en ? "Book" : "बुक"} | link navigation | ui.7fc4b88bf7982c43 / link |
| components/map-view/parts/FacilityCard.tsx:245 | Button | {routingLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />} {en ? "Route" : "मार्ग"} | onShowRoute | ui.0a16e5d6b15178d5 / local |
| components/map-view/parts/MapVoiceControls.tsx:22 | Button | {labels[8]} | event.stopPropagation, map.zoomIn | ui.50cea3883c320ca8 / local |
| components/map-view/parts/MapVoiceControls.tsx:23 | Button | {labels[9]} | event.stopPropagation, map.zoomOut | ui.c638d6dfc806ae51 / local |
| components/map-view/parts/MapVoiceControls.tsx:26 | Button | {mapLabels[1]} | event.stopPropagation, map.panBy | ui.40f28443773b41e8 / local |
| components/map-view/parts/MapVoiceControls.tsx:27 | Button | {labels[10]} | event.stopPropagation, map.panBy | ui.697afaffef7df3d7 / local |
| components/map-view/parts/MapVoiceControls.tsx:28 | Button | {mapLabels[3]} | event.stopPropagation, map.panTo | ui.97b4f5295aa0efcb / local |
| components/map-view/parts/MapVoiceControls.tsx:29 | Button | {labels[11]} | event.stopPropagation, map.panBy | ui.ad00eabeb8adf6fe / local |
| components/map-view/parts/MapVoiceControls.tsx:30 | Button | {mapLabels[2]} | event.stopPropagation, map.panBy | ui.4c159d49da03fc98 / local |

## /login

Entry: `app/login/page.tsx`. Local reachable templates: 21. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/authentication/index.tsx:284 | TabsTrigger | {t.login} | no direct handler: inspect wiring | ui.b37082e1a2e79366 / local |
| components/authentication/index.tsx:285 | TabsTrigger | {t.register} | no direct handler: inspect wiring | ui.6b6d2044ca4035ea / local |
| components/authentication/parts/OAuthGuestFooter.tsx:30 | Button | Google | onGoogleLogin | ui.01445b0eb8c7c8af / confirm |
| components/authentication/parts/OAuthGuestFooter.tsx:39 | Button | {t.guestAccess} | onGuestAccess | ui.69cca8e8d37db13b / confirm |
| components/authentication/parts/RegisterForm.tsx:40 | form | {t.name} {t.email} {t.phone} {t.password} {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {t.confirmPassword} [dynamic c | onSignUp | ui.f6c490fdc964eb46 / container |
| components/authentication/parts/RegisterForm.tsx:45 | Input | {[t.name].join(' ')} | onInputChange | ui.c45dcc54e3ac137c / field |
| components/authentication/parts/RegisterForm.tsx:59 | Input | {[t.email].join(' ')} | onInputChange | ui.787cfe7404c21895 / field |
| components/authentication/parts/RegisterForm.tsx:74 | Input | {[t.phone].join(' ')} | onInputChange | ui.c6310f820364f32a / field |
| components/authentication/parts/RegisterForm.tsx:88 | Input (secure) | {[t.password].join(' ')} | onInputChange | ui.255dd7fc86b738cf / handoff |
| components/authentication/parts/RegisterForm.tsx:97 | Button | {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} | setShowPassword | ui.ed8b8f12b057c6c9 / handoff |
| components/authentication/parts/RegisterForm.tsx:110 | Input (secure) | {[t.confirmPassword].join(' ')} | onInputChange | ui.f772e9808fef15e6 / handoff |
| components/authentication/parts/RegisterForm.tsx:120 | Button | [dynamic content] | parent form submission | ui.64ff192a95953ffb / confirm |
| components/authentication/parts/LoginForm.tsx:52 | button | 👤 Patient | onFillDemo | ui.24af5b1ecc313961 / confirm |
| components/authentication/parts/LoginForm.tsx:60 | button | 🩺 Doctor | onFillDemo | ui.8ad31c0f71393a33 / confirm |
| components/authentication/parts/LoginForm.tsx:68 | button | ⚡ Admin | onFillDemo | ui.c731f57581a85bc3 / confirm |
| components/authentication/parts/LoginForm.tsx:79 | form | {t.email} {t.password} {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {t.forgotPassword} [dynamic content] | onLogin | ui.fb32904e0489e274 / container |
| components/authentication/parts/LoginForm.tsx:84 | Input | {[t.email].join(' ')} | onInputChange | ui.d9a05694116d6a6e / field |
| components/authentication/parts/LoginForm.tsx:98 | Input (secure) | {[t.password].join(' ')} | onInputChange | ui.371c706ce4e0df90 / handoff |
| components/authentication/parts/LoginForm.tsx:107 | Button | {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} | setShowPassword | ui.84a30ff88dc37f7c / handoff |
| components/authentication/parts/LoginForm.tsx:121 | button | {t.forgotPassword} | onForgotPassword | ui.35a8a6a989dfaa6f / handoff |
| components/authentication/parts/LoginForm.tsx:131 | Button | [dynamic content] | parent form submission | ui.96145683862410ac / confirm |

## /offline

Entry: `app/offline/page.tsx`. Local reachable templates: 3. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| app/offline/page.tsx:30 | select | {t("chooseLanguage")} | setLanguage | ui.05b3498bd42fe297 / field |
| app/offline/page.tsx:42 | Button | {t("retryConnection")} | setIsRetrying, window.location.reload | ui.ea69d1812b074d51 / local |
| app/offline/page.tsx:57 | a | {t(contact.key)} {contact.number} | link navigation | ui.1a750c65f310a8c3 / link |

## /

Entry: `app/page.tsx`. Local reachable templates: 10. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/LandingPage.tsx:117 | Button | {t.hero.primaryCTA} | router.push | ui.6f2a99b18f080b6c / local |
| components/LandingPage.tsx:125 | Button | {t.hero.secondaryCTA} | router.push | ui.bec8d013294aceff / local |
| components/LandingPage.tsx:134 | Button | {language === 'en' ? 'Emergency SOS' : 'आपातकालीन SOS'} | router.push | ui.141f698945606c64 / local |
| components/LandingPage.tsx:167 | Card | {language === 'en' ? 'Symptom Checker' : 'लक्षण जांच'} | router.push | ui.fffaca034e130cfb / container |
| components/LandingPage.tsx:176 | Card | {language === 'en' ? 'Book Consultation' : 'परामर्श बुक करें'} | router.push | ui.b21f663d7bdb7212 / container |
| components/LandingPage.tsx:185 | Card | {language === 'en' ? 'Nearest Hospital' : 'निकटतम अस्पताल'} | router.push | ui.7aca5886b762da58 / container |
| components/LandingPage.tsx:194 | Card | {language === 'en' ? 'Emergency Help (SOS)' : 'आपातकालीन सहायता (SOS)'} | router.push | ui.1d97942b39f7edae / container |
| components/LandingPage.tsx:203 | Card | {language === 'en' ? 'Find Doctors' : 'डॉक्टर खोजें'} | router.push | ui.d3c300124e56fbb0 / container |
| components/LandingPage.tsx:212 | Card | {language === 'en' ? 'Health Records' : 'स्वास्थ्य रिकॉर्ड'} | router.push | ui.7963c082035124bf / container |
| components/LandingPage.tsx:252 | Card | {t.features.campaigns.title} {t.features.campaigns.description} | router.push | ui.4e0d975220413561 / container |

## /records

Entry: `app/records/page.tsx`. Local reachable templates: 44. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/authentication/index.tsx:284 | TabsTrigger | {t.login} | no direct handler: inspect wiring | ui.b37082e1a2e79366 / local |
| components/authentication/index.tsx:285 | TabsTrigger | {t.register} | no direct handler: inspect wiring | ui.6b6d2044ca4035ea / local |
| components/authentication/parts/OAuthGuestFooter.tsx:30 | Button | Google | onGoogleLogin | ui.01445b0eb8c7c8af / confirm |
| components/authentication/parts/OAuthGuestFooter.tsx:39 | Button | {t.guestAccess} | onGuestAccess | ui.69cca8e8d37db13b / confirm |
| components/authentication/parts/RegisterForm.tsx:40 | form | {t.name} {t.email} {t.phone} {t.password} {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {t.confirmPassword} [dynamic c | onSignUp | ui.f6c490fdc964eb46 / container |
| components/authentication/parts/RegisterForm.tsx:45 | Input | {[t.name].join(' ')} | onInputChange | ui.c45dcc54e3ac137c / field |
| components/authentication/parts/RegisterForm.tsx:59 | Input | {[t.email].join(' ')} | onInputChange | ui.787cfe7404c21895 / field |
| components/authentication/parts/RegisterForm.tsx:74 | Input | {[t.phone].join(' ')} | onInputChange | ui.c6310f820364f32a / field |
| components/authentication/parts/RegisterForm.tsx:88 | Input (secure) | {[t.password].join(' ')} | onInputChange | ui.255dd7fc86b738cf / handoff |
| components/authentication/parts/RegisterForm.tsx:97 | Button | {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} | setShowPassword | ui.ed8b8f12b057c6c9 / handoff |
| components/authentication/parts/RegisterForm.tsx:110 | Input (secure) | {[t.confirmPassword].join(' ')} | onInputChange | ui.f772e9808fef15e6 / handoff |
| components/authentication/parts/RegisterForm.tsx:120 | Button | [dynamic content] | parent form submission | ui.64ff192a95953ffb / confirm |
| components/authentication/parts/LoginForm.tsx:52 | button | 👤 Patient | onFillDemo | ui.24af5b1ecc313961 / confirm |
| components/authentication/parts/LoginForm.tsx:60 | button | 🩺 Doctor | onFillDemo | ui.8ad31c0f71393a33 / confirm |
| components/authentication/parts/LoginForm.tsx:68 | button | ⚡ Admin | onFillDemo | ui.c731f57581a85bc3 / confirm |
| components/authentication/parts/LoginForm.tsx:79 | form | {t.email} {t.password} {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {t.forgotPassword} [dynamic content] | onLogin | ui.fb32904e0489e274 / container |
| components/authentication/parts/LoginForm.tsx:84 | Input | {[t.email].join(' ')} | onInputChange | ui.d9a05694116d6a6e / field |
| components/authentication/parts/LoginForm.tsx:98 | Input (secure) | {[t.password].join(' ')} | onInputChange | ui.371c706ce4e0df90 / handoff |
| components/authentication/parts/LoginForm.tsx:107 | Button | {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} | setShowPassword | ui.84a30ff88dc37f7c / handoff |
| components/authentication/parts/LoginForm.tsx:121 | button | {t.forgotPassword} | onForgotPassword | ui.35a8a6a989dfaa6f / handoff |
| components/authentication/parts/LoginForm.tsx:131 | Button | [dynamic content] | parent form submission | ui.96145683862410ac / confirm |
| components/patient-records/index.tsx:274 | Button | {t.uploadFile} | setShowAdd, setAddMode | ui.6406b0a9d7a62bc0 / local |
| components/patient-records/index.tsx:280 | Button | {t.addManual} | setShowAdd, setAddMode | ui.c4c92f9226dc10d3 / local |
| components/patient-records/index.tsx:295 | Button | {en ? 'Upload' : 'अपलोड'} | setShowAdd, setAddMode | ui.800c77735fffd0a0 / local |
| components/patient-records/index.tsx:303 | Button | {en ? 'Add Record' : 'रिकॉर्ड जोड़ें'} | setShowAdd, setAddMode | ui.55caf7dd4adbf1b6 / local |
| components/patient-records/index.tsx:375 | Button | {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} {en ? "Load more" : "और देखें"} | handleLoadMoreRecords | ui.6b32fe047d80d784 / local |
| components/patient-records/parts/RecordFilterRow.tsx:38 | button | {en ? tag.labelEn : tag.labelHi} {count} | onSelectTag | ui.ff7375052a69c8b0 / local |
| components/patient-records/parts/RecordItem.tsx:86 | button | {en ? 'Delete' : 'हटाएं'} | onDelete | ui.c274f45f887de900 / confirm |
| components/patient-records/parts/RecordItem.tsx:102 | a | {en ? 'View Attached Report / File' : 'संलग्न फाइल / रिपोर्ट देखें'} | link navigation | ui.aa0cfdd0132b3cba / link |
| components/patient-records/parts/AddRecordCard.tsx:68 | button | [unlabelled/dynamic] | onClose | ui.c7a716c1cd439e70 / local |
| components/patient-records/parts/AddRecordCard.tsx:77 | button | ✏️ {t.addManual} | setAddMode | ui.c864c451c9af467e / local |
| components/patient-records/parts/AddRecordCard.tsx:83 | button | 📎 {t.uploadFile} | setAddMode | ui.9d5ad5e1198a930c / local |
| components/patient-records/parts/AddRecordCard.tsx:97 | button | {rt.icon} {en ? rt.label : rt.labelHi} | setFormData | ui.f0b70d3078a96504 / local |
| components/patient-records/parts/AddRecordCard.tsx:116 | input | [unlabelled/dynamic] | setSelectedFile | ui.c1926ff32efe6cee / handoff |
| components/patient-records/parts/AddRecordCard.tsx:123 | button | [dynamic content] | fileRef.current?.click | ui.47688865157ef1c4 / confirm |
| components/patient-records/parts/AddRecordCard.tsx:146 | textarea | {[t.details].join(' ')} | setFormData | ui.58d6fc928af65cd7 / field |
| components/patient-records/parts/AddRecordCard.tsx:159 | Button | {t.cancel} | onClose | ui.ddb6743170e5dce5 / local |
| components/patient-records/parts/AddRecordCard.tsx:163 | Button | {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />{t.saving}</> : <><Upload className="h-4 w-4" />{t.uploadAndSave}</>} | onUploadAndSave | ui.9d9bde0c757a5edc / confirm |
| components/patient-records/parts/AddRecordCard.tsx:172 | Button | {saving ? <><Loader2 className="h-4 w-4 animate-spin" />{t.saving}</> : <><CheckCircle className="h-4 w-4" />{t.save}</>} | onSaveManual | ui.f03660ba79f1d809 / confirm |
| components/patient-records/parts/MedicalProfileCard.tsx:68 | input | {[en ? "Height (cm)" : "लंबाई (cm)"].join(' ')} | setProfileForm | ui.fc74b6fccefef406 / field |
| components/patient-records/parts/MedicalProfileCard.tsx:78 | input | {[en ? "Weight (kg)" : "वजन (kg)"].join(' ')} | setProfileForm | ui.e91ef6fa4b4f3f0d / field |
| components/patient-records/parts/MedicalProfileCard.tsx:88 | select | {[en ? "Blood Group" : "रक्त समूह"].join(' ')} | setProfileForm | ui.aabc109bbd9f1c9f / field |
| components/patient-records/parts/MedicalProfileCard.tsx:99 | input | {[en ? "Chronic Conditions / Allergies" : "पुरानी बीमारियाँ / एलर्जी"].join(' ')} | setProfileForm | ui.ad235e05eb28177f / field |
| components/patient-records/parts/MedicalProfileCard.tsx:109 | Button | {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />} {en ? "Save Profile" : "प्रोफ़ाइल सेव क | handleSaveProfile | ui.7144b5359770e511 / confirm |

## /symptom-checker

Entry: `app/symptom-checker/page.tsx`. Local reachable templates: 21. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| components/symptom-checker/parts/Step4ResultChat.tsx:144 | button | [dynamic content] | handleToggleMessageLanguage | ui.0e9d21a9bfbb2085 / confirm |
| components/symptom-checker/parts/Step4ResultChat.tsx:175 | Button | {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />} | toggleListen | ui.5fb9c33a2d2d37a9 / local |
| components/symptom-checker/parts/Step4ResultChat.tsx:185 | input | { en ? isListening ? "Listening..." : "Type your question..." : isListening ? "सुन रहा हूँ..." : "अपना प्रश्न टाइप करें..." } | setChatInput | ui.20f34485edfccc1e / field |
| components/symptom-checker/parts/Step4ResultChat.tsx:201 | Button | [unlabelled/dynamic] | handleChat | ui.462fdfd13042c5e7 / confirm |
| components/symptom-checker/parts/Step4ResultChat.tsx:216 | Button | {en ? "Call Emergency 108" : "आपातकाल 108 पर कॉल करें"} | window.open | ui.9910067048b9ae79 / confirm |
| components/symptom-checker/parts/Step4ResultChat.tsx:226 | Button | {en ? "Book Consultation" : "परामर्श बुक करें"} | router.push | ui.ff9e56f547986bd5 / local |
| components/symptom-checker/parts/Step4ResultChat.tsx:234 | Button | {en ? "Find Nearest Hospital" : "निकटतम अस्पताल खोजें"} | router.push | ui.bd5025b133c7cc03 / local |
| components/symptom-checker/parts/Step4ResultChat.tsx:238 | Button | {en ? "Check Again" : "फिर से जांचें"} | onReset | ui.2fa15f0ffb0ba399 / confirm |
| components/symptom-checker/parts/Step3Symptoms.tsx:59 | button | [dynamic content] {label} | toggleSymptom | ui.68defffcfb85ecff / local |
| components/symptom-checker/parts/Step3Symptoms.tsx:82 | Button | {en ? "Back" : "पीछे"} | onBack | ui.a8a1abe5954195f4 / local |
| components/symptom-checker/parts/Step3Symptoms.tsx:86 | Button | [dynamic content] | onAnalyze | ui.45dbe8124b80aaa7 / confirm |
| components/symptom-checker/parts/Step2BodyPart.tsx:42 | button | {en ? part.label : part.labelHi} | setSelectedBodyPart | ui.72d178e51791f44e / local |
| components/symptom-checker/parts/Step2BodyPart.tsx:60 | Button | {en ? "Back" : "पीछे"} | onBack | ui.45c4da96ceb2ef98 / local |
| components/symptom-checker/parts/Step2BodyPart.tsx:64 | Button | {en ? "Next" : "अगला"} | onNext | ui.381a01d37787ccdf / local |
| components/symptom-checker/parts/Step1PatientInfo.tsx:41 | input | {[en ? "Age" : "उम्र"].join(' ')} | Number, setPatientInfo | ui.09c3bf8b9ba0ba8e / field |
| components/symptom-checker/parts/Step1PatientInfo.tsx:58 | select | {[en ? "Gender" : "लिंग"].join(' ')} | setPatientInfo | ui.0bdb63537eb71d2b / field |
| components/symptom-checker/parts/Step1PatientInfo.tsx:75 | button | °C | setPatientInfo | ui.ff28663a878928da / local |
| components/symptom-checker/parts/Step1PatientInfo.tsx:82 | button | °F | setPatientInfo | ui.75ed4c7f9e10f09f / local |
| components/symptom-checker/parts/Step1PatientInfo.tsx:91 | input | { patientInfo.tempUnit === "F" ? en ? "e.g. 101.5" : "जैसे 101.5" : en ? "e.g. 38.5" : "जैसे 38.5" } | Number, setPatientInfo | ui.51657e2a3efda2c9 / field |
| components/symptom-checker/parts/Step1PatientInfo.tsx:114 | select | {[en ? "How many days sick?" : "कितने दिनों से बीमार?"].join(' ')} | setPatientInfo | ui.8dbc5283ca168b6c / field |
| components/symptom-checker/parts/Step1PatientInfo.tsx:129 | Button | {en ? "Next" : "अगला"} | onNext | ui.7cebea74d56dfa48 / local |

## /teleconsult/confirm

Entry: `app/teleconsult/confirm/page.tsx`. Local reachable templates: 2. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| app/teleconsult/confirm/page.tsx:20 | Button | {user ? (en ? "Open appointments" : "अपॉइंटमेंट खोलें") : (en ? "Sign in" : "लॉगिन करें")} | router.push | ui.f7b6bd7964447c1e / local |
| app/teleconsult/confirm/page.tsx:21 | Button | {en ? "Request consultation entry" : "परामर्श प्रवेश जांचें"} | router.push, consultationJoinPath | ui.ebf49bd04affa59f / local |

## /teleconsult/room

Entry: `app/teleconsult/room/page.tsx`. Local reachable templates: 26. Shared controls are listed once above.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
| app/teleconsult/room/page.tsx:78 | Button | {en ? "My Appointments" : "मेरी अपॉइंटमेंट"} | router.push | ui.5afac2630c61a51d / local |
| app/teleconsult/room/page.tsx:87 | Button | {en ? "Exit" : "बाहर"} | setShowRxModal | ui.d90dca3736821a38 / local |
| app/teleconsult/room/page.tsx:93 | Button | {is2GMode ? <WifiOff className="h-4 w-4 mr-1" /> : <Wifi className="h-4 w-4 mr-1" />} {is2GMode ? (en ? "Audio mode" : "आवाज मोड") : (en ? "Use audio" | setIs2GMode | ui.6518dac067db160e / local |
| app/teleconsult/room/page.tsx:94 | Button | {isDoctor ? (en ? "Consultation record" : "परामर्श रिकॉर्ड") : (en ? "My notes" : "मेरे नोट")} | setShowRxModal | ui.be08763567e9dfd9 / local |
| app/teleconsult/room/page.tsx:95 | Button | {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />} {en ? "Copy link" : "लिंक कॉपी"} | copyLink | ui.0b61b53b447eb482 / confirm |
| app/teleconsult/room/page.tsx:96 | Button | WhatsApp | window.open, encodeURIComponent | ui.9b59fb541fe27b46 / confirm |
| app/teleconsult/room/rx-modal.tsx:75 | button | [unlabelled/dynamic] | onClose | ui.5dc15754f719fa5b / local |
| app/teleconsult/room/rx-modal.tsx:99 | Input | {[en ? "Consulting Doctor:" : "डॉक्टर:"].join(' ')} | no direct handler: inspect wiring | ui.c51c88f9104e7278 / field |
| app/teleconsult/room/rx-modal.tsx:107 | Input | {[en ? "NMC Registration No:" : "पंजीकरण संख्या:"].join(' ')} | no direct handler: inspect wiring | ui.e865da80aceff0ee / field |
| app/teleconsult/room/rx-modal.tsx:116 | Input | {[en ? "Patient Name:" : "मरीज का नाम:"].join(' ')} | no direct handler: inspect wiring | ui.c4bd6a0c207a1958 / field |
| app/teleconsult/room/rx-modal.tsx:124 | Input | {[en ? "Clinical Diagnosis:" : "निदान / समस्या:"].join(' ')} | setRxData | ui.f850cf56a2cae9b0 / field |
| app/teleconsult/room/rx-modal.tsx:136 | Textarea | {[clinician ? (en ? "Prescribed medicines and dosage:" : "दवाइयाँ और खुराक:") : (en ? "Medication notes from the consultation:" : "परामर्श की दवा संबं | setRxData | ui.2db43e99d574fde6 / field |
| app/teleconsult/room/rx-modal.tsx:148 | Textarea | {[en ? "Advice & Precautions:" : "सलाह व सावधानियां:"].join(' ')} | setRxData | ui.9defd83df150752c / field |
| app/teleconsult/room/rx-modal.tsx:157 | Button | {en ? "Print / Download PDF" : "प्रिंट / डाउनलोड पीडीएफ"} | onPrint | ui.f213ffd4ceb97f72 / confirm |
| app/teleconsult/room/rx-modal.tsx:167 | Button | {savingRecord ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {en ? "Save to Patient Records" : "मेडिकल रिकॉर्ड में से | onSaveRecord | ui.30d625c54cd21538 / confirm |
| app/teleconsult/room/rx-modal.tsx:176 | Button | {en ? "Close & Exit" : "बंद करें"} | onExit | ui.93c78565c6d15f15 / confirm |
| components/JitsiMeeting.tsx:176 | Button | {t.retry} | window.location.reload | ui.691f2edc6e106166 / confirm |
| components/JitsiMeeting.tsx:201 | Button | {t.leave} | onLeave | ui.e852313112d51e5a / confirm |
| components/voice-assistant/MeetingControls.tsx:9 | Button | {labels[0]} | onCommand | ui.e11ca77cc94ba14e / local |
| components/voice-assistant/MeetingControls.tsx:10 | Button | {labels[1]} | onCommand | ui.6c267fe90208ccb5 / local |
| components/voice-assistant/MeetingControls.tsx:11 | Button | {labels[2]} | onCommand | ui.b77405404fa375c1 / local |
| components/voice-assistant/MeetingControls.tsx:12 | Button | {labels[3]} | onCommand | ui.977bba067f927635 / local |
| components/voice-assistant/MeetingControls.tsx:13 | Button | {labels[4]} | onCommand | ui.dd970638ca2af0c3 / local |
| components/voice-assistant/MeetingControls.tsx:14 | Button | {labels[5]} | onCommand | ui.179dbaf08ecb1d31 / confirm |
| components/voice-assistant/MeetingControls.tsx:15 | Button | {labels[6]} | onCommand | ui.a019fabf3e58266c / handoff |
| components/voice-assistant/MeetingControls.tsx:16 | Button | {labels[7]} | onCommand | ui.bd3bb0cf4d0809ee / handoff |

## Templates with no page import path

These require manual review before promising functionality; they may be unused, mounted through configuration, or intended for future screens.

| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |
|---|---|---|---|---|
