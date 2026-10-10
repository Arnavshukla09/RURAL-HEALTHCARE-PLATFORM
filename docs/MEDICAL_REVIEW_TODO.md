# Medical Review To-Do List (Doctor / Clinical Sign-Off)

This file tracks all clinical and medical guidance statements introduced in the Rural Healthcare Platform marked as `draft`.
Every item below must be reviewed and signed off by a licensed medical practitioner (e.g. PHC Medical Officer or clinical advisor) before final clinical certification.

| ID | Location | Text / Rule Description | Status | Doctor Sign-off / Notes |
|----|----------|-------------------------|--------|-------------------------|
| `REV-001` | `lib/offline/offline-ai.ts` (Line 29) | Chest pain protocol: "If previously prescribed by a doctor, chew an aspirin. Otherwise do not self-medicate." | Draft | Pending cardiologist / physician review on rural emergency aspirin protocols. |
| `REV-002` | `lib/ai/medical-brain.ts` (Entry `diet-spicy-food`) | Dietary restriction on capsaicin/chili during diarrhea and acute gastroenteritis. | Draft | Recommended clinical consensus. |
| `REV-003` | `lib/ai/medical-brain.ts` (Entry `diet-fiber-food`) | Insoluble vs soluble fiber distinction during active diarrheal episodes. | Draft | Recommended clinical consensus. |
| `REV-004` | `lib/ai/medical-brain.ts` (Entry `diet-dairy-milk`) | Temporary secondary lactose intolerance advice during gut infection. | Draft | Recommended clinical consensus. |
| `REV-005` | `lib/ai/medical-brain.ts` (Entry `diet-ors-hydration`) | Home-prepared ORS ratio: 6 level teaspoons sugar + 1/2 teaspoon salt in 1 litre boiled water. | Draft | Matches standard WHO / UNICEF oral rehydration guidelines. |
| `REV-006` | `lib/symptoms/rules.ts` | Severity escalation rules: Escalating infants (<1y) and elders (>=60y) by one severity tier automatically. | Draft | Clinical safety buffer for high-risk demographics. |
