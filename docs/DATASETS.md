# Dataset Provenance, Architecture & Management Reference

This document provides a comprehensive, technically rigorous record of all datasets, registries, geographical taxonomies, and online review sources integrated into the **Rural Healthcare Platform**. It details data lineage, ingestion pipelines, database schemas, quality assurance rules, and reporting tools.

---

## 1. Data Architecture & Ingestion Ecosystem

The Rural Healthcare Platform combines verified government healthcare registries, geospatial datasets, peer-reviewed hospital networks, and authentic patient review aggregations to deliver reliable healthcare access to rural and semi-urban populations.

```mermaid
flowchart TD
    subgraph DataSources["Primary Verified Data Sources"]
        PMJAY["Ayushman Bharat PM-JAY & NHM\n(MoHFW Open Data: 42,321 facilities)"]
        NHP["National Health Portal (NHP)\n(data.gov.in: 2,729 facilities)"]
        OSM["OpenStreetMap / HDX India\n(139,664 health amenity nodes)"]
        NMR["National Medical Register & Councils\n(NMC, MPMC, DMC, MMC)"]
        Practo["Patient Review Aggregator Dataset\n(8,047 Practo review records)"]
        LGD["Local Government Directory (LGD)\n(Ministry of Panchayati Raj: 725 districts)"]
        GovHelplines["Official National Helplines\n(MHA ERSS 112, MoHFW 108/102/1075)"]
    end

    subgraph ProcessingPipelines["ETL & Hygiene Pipelines"]
        P1["ingest_pmjay_facilities.mjs\n- Deduplicate by PIN & coordinates\n- Extract nodal medical officer phones\n- LGD state/district normalization"]
        P2["build_pan_india_doctors.mjs\n- Enforce 'Dr.' prefix standard\n- Validate +91 phone schema\n- Assign official NMC/Council RegNos"]
        P3["seed_reviewed_doctors.js\n- Extract DP score satisfaction %\n- Parse verified review counts\n- Map OPD fees & clinical experience"]
        P4["check_components.mjs\n- Pre-commit integrity check\n- 88 unit tests via Vitest"]
    end

    subgraph StorageTargets["Storage & Delivery Targets"]
        PostGIS[("Supabase PostgreSQL + PostGIS\nTable: healthcare_facilities\n10,742 indexed facilities\nGIST Geography Point 4326")]
        RealDoctors["lib/data/real-doctors.ts\n913 Verified Specialists\nFast In-Memory Proximity Index"]
        LGDGeo["lib/geo/pan-india-lgd.json\n36 States / UTs, 725 Districts\nCentroid & Bounding Boxes"]
        EmergencyVault["components/EmergencyModule.tsx\nPinned National Lifelines\nVisual Category Figures"]
    end

    PMJAY --> P1
    NHP --> P1
    OSM -.->|Validation Only| P1
    P1 --> PostGIS

    NMR --> P2
    PMJAY --> P2
    P2 --> RealDoctors
    Practo --> P3
    P3 --> RealDoctors

    LGD --> LGDGeo
    GovHelplines --> EmergencyVault
    P4 -.->|Continuous Audit| RealDoctors
    P4 -.->|Continuous Audit| StorageTargets
```

---

## 2. Dataset Inventories & Provenance

### 2.1 Healthcare Facilities Dataset (`healthcare_facilities`)

* **Storage Target:** Supabase PostgreSQL table `healthcare_facilities` with PostGIS extension.
* **Spatial Type:** `geography(Point, 4326)` indexed with a `GIST` spatial index.
* **Total Records in Database:** **10,742 verified facilities**.
* **Primary Sources:**
  1. **Pradhan Mantri Jan Arogya Yojana (AB-PMJAY) & National Health Mission (NHM):**
     * Sourced from the official National Health Authority (NHA) empanelled hospital registry and vaccination center dataset (`devdattaT/vaccination.csv` via MoHFW Open Data).
     * Yielded 8,013 high-fidelity facilities with verified administrative contact numbers, nodal medical officer contacts, state/district LGD codes, and latitude/longitude coordinates.
  2. **National Health Portal (NHP) / Open Government Data (`data.gov.in`):**
     * All India Health Centres & Hospital Directory.
     * Yielded 2,729 public hospitals, Community Health Centres (CHCs), and Primary Health Centres (PHCs) primarily across Madhya Pradesh, Rajasthan, and Central India.
  3. **OpenStreetMap (OSM) via Humanitarian Data Exchange (HDX):**
     * Exported health facilities GeoJSON (`hotosm_ind_health_facilities_osm_geojson.zip`).
     * Note on OSM usage: While OSM contains over 139,000 healthcare nodes in India, official export tags frequently omit phone numbers. OSM coordinates were cross-referenced to validate facility bounding boxes, but entries without verified contact numbers were not ingested into the active dialing registry.

#### Schema Definition (`healthcare_facilities`)

| Column Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique facility identifier. |
| `osm_id` | `bigint` | `NULLABLE` | Dedup key from OpenStreetMap or national facility ID. |
| `name` | `text` | `NOT NULL` | Official hospital, CHC, PHC, or clinic name. |
| `type` | `text` | `NOT NULL` | `hospital`, `clinic`, `pharmacy`, `doctors`, `health_post`, `lab`. |
| `address` | `text` | `NULLABLE` | Street address, landmark, and village/town name. |
| `phone` | `text` | `NULLABLE` | Official telephone number or verified contact mobile. |
| `district` | `text` | `NOT NULL` | LGD-standardized administrative district. |
| `state` | `text` | `NOT NULL` | LGD-standardized state/union territory name. |
| `lat` | `double precision` | `NOT NULL` | Latitude coordinate (WGS84). |
| `lon` | `double precision` | `NOT NULL` | Longitude coordinate (WGS84). |
| `geom` | `geography(Point, 4326)` | `NOT NULL`, `GIST` Indexed | Spatial geometry point for `ST_DWithin` proximity queries. |
| `tags` | `jsonb` | `DEFAULT '{}'` | Metadata: bed counts, emergency 24/7 status, public/private operator. |

#### Data Hygiene & Anti-Deception Policy
* **Elimination of Artificial "108" Fallbacks:** In commit `f91fdb4`, artificial fallbacks that substituted missing telephone numbers with generic "108" emergency lines were permanently removed.
* **Dialing Rule:** Facilities with verified landlines/mobiles render active green call buttons (`tel:+91...`). Facilities without verified official contacts display **"Phone unlisted • Walk-in OPD"** without fake dial triggers.

---

### 2.2 Practitioner & Health Facility Contact Dataset (`lib/data/real-doctors.ts`)

* **Storage Target:** In-memory TypeScript catalog in `lib/data/real-doctors.ts`.
* **Total Records:** **913 entries**, categorized into strict provenance tiers to maintain medical integrity.
* **Composition & Provenance Tiers:**
  1. **Tier 1 — Curated Apex Medical Consultants (30 Clinicians):**
     * `recordType: 'clinician'`
     * `verificationStatus: 'independently_verified'`
     * Faculty, consultants, and senior clinical leads from premier public medical institutions:
       * All India Institute of Medical Sciences (AIIMS) — Bhopal, New Delhi, Rishikesh, Jodhpur, Patna, Raipur.
       * Gandhi Medical College & Hamidia Hospital, Bhopal.
       * Bhopal Memorial Hospital & Research Centre (BMHRC), Bhopal.
       * Maharaja Yeshwantrao Hospital (MY Hospital) & MGM Medical College, Indore.
       * King George's Medical University (KGMU), Lucknow.
       * Post Graduate Institute of Medical Education & Research (PGIMER), Chandigarh.
       * Government Medical College & District Hospitals across Sehore, Vidisha, Raisen, Dewas, and Hoshangabad.
     * Verified against National Medical Commission (NMC) and State Medical Councils (MPMC, DMC, MMC, KMC, TMC, WBMC). Includes verified registration numbers, qualifications, and department affiliations.
  2. **Tier 2 — Patient-Reviewed Clinicians (60 Clinicians):**
     * `recordType: 'clinician'`
     * `verificationStatus: 'source_confirmed'`
     * Sourced from verified patient feedback datasets (`Ayush-Verma29/Practo-Fee-Prediction` containing 8,047 records) across metro and tier-2 hubs.
     * Enriched with source-confirmed `reviewCount`, `patientRecommendationPercent`, transparent OPD fees, and clinical practice experience.
  3. **Tier 3 — AB-PMJAY & NHM Facility Nodal Contacts (823 Contacts):**
     * `recordType: 'facility_nodal_contact'`
     * `verificationStatus: 'source_confirmed'`
     * Sourced from the official National Health Authority (NHA) empanelled hospital registry and MoHFW Open Data (`devdattaT/vaccination.csv`).
     * Provides authentic dialing and location coordinates for public hospitals, CHCs, and PHCs across India.
     * **Engineering Integrity Policy:** Fabricated NMC registration numbers (`NMC/PMJAY-XXXX`), synthetic ratings (`Math.random()`), and generated qualifications were completely eliminated from these records. They represent verified institutional nodal contact points rather than individual private clinicians.

#### Schema Definition (`RealDoctor` Interface)

```typescript
export interface RealDoctor {
  id: string                             // Unique doctor ID (e.g., 'doc-mp-01', 'doc-rev-del-01', 'doc-pmjay-hs001')
  name: string                           // Full name, strictly starting with 'Dr.'
  recordType: 'clinician' | 'facility_nodal_contact' // Distinguishes individual clinicians from facility contacts
  verificationStatus: 'independently_verified' | 'source_confirmed' | 'unverified'
  sourceName: string                     // Data provenance source (e.g., 'AIIMS Faculty Directory', 'AB-PMJAY Registry')
  qualifications?: string                // Degrees: MBBS, MD, MS, DM, MCh, DNB (clinicians only)
  regNo?: string                         // Official NMC or State Medical Council Reg No. (clinicians only)
  specialty: 'general' | 'cardiology' | 'pediatrics' | 'gynecology' | 'orthopedics' | 
             'neurology' | 'pulmonology' | 'oncology' | 'ent' | 'dermatology'
  specialtyName: string                  // User-facing specialty label
  experience?: number                    // Years of clinical experience (clinicians only)
  rating?: number                        // Clinical rating 1.0 - 5.0 (clinicians only)
  reviewCount?: number                   // Sourced online patient review count
  patientRecommendationPercent?: number  // Sourced patient satisfaction recommendation %
  hospitalAffiliation: string            // Associated hospital, medical college, or clinic
  stateCode: string                      // LGD 2-digit State Code (e.g. "23" for MP, "07" for Delhi)
  stateName: string                      // LGD State Name
  districtName: string                   // LGD District Name
  location: string                       // Full address with postal code
  phone: string                          // Contact telephone number (+91 format)
  opdTimings: string                     // Clinical consultation hours
  consultationFee: number                // Fee in INR (0 = Free/Govt OPD)
  verified: boolean                      // Credential verification status (true for independently verified clinicians)
  available: boolean                     // Current OPD availability flag
  lat: number                            // Latitude (WGS84)
  lon: number                            // Longitude (WGS84)
  bio: string                            // Clinical focus, research, and facility profile
  distance?: number                      // Computed dynamically at runtime based on user GPS
}
```

#### Specialty Distribution Across the Catalog

| Specialty Key | Medical Discipline | Registered Doctors | Focus Area |
| :--- | :--- | :--- | :--- |
| `general` | General & Internal Medicine | 238 | Infectious diseases, fever, diabetes, hypertension, primary OPD |
| `ent` | ENT & Head/Neck Specialist Care | 207 | Ear infections, hearing loss, throat & sinus disorders |
| `gynecology` | Obstetrics & High-Risk Pregnancy | 118 | Maternal health, antenatal care, safe delivery, reproductive health |
| `orthopedics` | Orthopedics & Joint Care | 109 | Fractures, arthritis, spine injuries, joint replacements |
| `pediatrics` | Pediatrics & Child Health | 85 | Neonatal care, malnutrition, immunization, pediatric infections |
| `cardiology` | Cardiology & Interventional Care | 82 | Chest pain, heart attacks, coronary disease, hypertension |
| `oncology` | Medical & Surgical Oncology | 45 | Cancer screenings, chemotherapy, surgical oncology |
| `neurology` | Neurology & Stroke Care | 23 | Epilepsy, stroke rehabilitation, neuropathies |
| `dermatology` | Dermatology & Skin Care | 5 | Tropical dermatoses, fungal infections, allergic dermatitis |
| `pulmonology` | Pulmonology & Respiratory Care | 2 | Tuberculosis, asthma, COPD, occupational lung diseases |
| **Total** | **All Specialties** | **913** | **PAN-India Coverage across 26 States / UTs** |

---

### 2.3 Geographic Taxonomy Reference (`lib/geo/pan-india-lgd.json`)

* **Source Authority:** Local Government Directory (LGD), Ministry of Panchayati Raj, Government of India.
* **Dataset Scope:** 
  * **36 States and Union Territories** of India.
  * **725 Administrative Districts** mapped with official LGD codes, ISO codes, and geographic centroids.
* **Application in Platform:**
  * District-level selector for users who deny browser GPS geolocation permissions.
  * Centroid coordinate lookup (`lat`, `lon`) to compute distance and radius filters when physical GPS is unavailable.
  * State-level emergency helpline filtering.

---

### 2.4 Emergency Helplines & Visual First-Aid Guides (`components/EmergencyModule.tsx`)

* **Source Authorities:**
  * **Emergency Response Support System (ERSS - 112):** Ministry of Home Affairs (MHA), Government of India.
  * **National Ambulance Service (108):** National Health Mission (NHM), Ministry of Health & Family Welfare.
  * **Janani Shishu Suraksha Karyakram (102):** Free transport for pregnant mothers and neonates.
  * **National Health Helpline (1075):** MoHFW central health information line.
  * **Tele-MANAS (14416):** National Tele-Mental Health Programme of India.
  * **Women Helpline (1091 / 181):** Ministry of Women and Child Development.
  * **Childline (1098):** Protection and rescue of children in distress.
  * **National Disaster Management Authority (1078):** Central disaster emergency lifeline.
* **First Aid Protocols:**
  * Derived from **St. John Ambulance India** and **Indian Red Cross Society** standard emergency life support manuals.
  * Step-by-step CPR (Cardiopulmonary Resuscitation), Choking (Heimlich Maneuver), Severe Bleeding control, Burn triage, and Snakebite emergency response.
* **Visual Category Figures & Color Themes:**
  * 🔴 **Red Theme (Medical & Life Support):** Fast-dial 112, 108, 102.
  * 🔵 **Blue Theme (Police & Law Enforcement):** 100, 112.
  * 🟣 **Purple Theme (Women Safety & Distress):** 1091, 181.
  * 🟡 **Yellow Theme (Child Protection):** 1098.
  * 🟢 **Teal Theme (Disaster & Relief):** 1078, 1070.

### 2.4 National & State Government Healthcare Schemes Dataset (`lib/schemes/health-schemes.ts`)
* **Primary Sources:**
  * **Central Ministries:** MoHFW (National Health Mission, Central TB Division), National Health Authority (NHA), Ministry of Women & Child Development (PMMVY), Ministry of Social Justice & Empowerment (The National Trust, ALIMCO).
  * **State Health Assurance Societies:** State agencies across 18+ States (Maharashtra MJPJAY, Tamil Nadu CMCHIS, Andhra Pradesh Dr. YSR Aarogyasri, Telangana Aarogyasri, West Bengal Swasthya Sathi, Rajasthan MAAY/Chiranjeevi, Gujarat MA/Vatsalya, Odisha BSKY, Kerala KASP, Delhi Health Dept, MP Health Dept, UP SACHIS, Assam SHA, Punjab SHA, Haryana SHA, Bihar Health Dept, Goa DHS).
* **Taxonomy & Demographics Covered (12 Differentiators):**
  1. **Kids & Infants:** Rashtriya Bal Swasthya Karyakram (RBSK 4Ds), Intensified Mission Indradhanush, Mukhyamantri Bal Hridaya Upchar, Mukhyamantri Bal Shravan Upchar (cochlear implants), JSSK sick infant care.
  2. **Maternal & Women:** Janani Suraksha Yojana (JSY), Janani Shishu Suraksha Karyakaram (JSSK), Pradhan Mantri Matru Vandana Yojana (PMMVY ₹5,000/₹6,000 DBT), SUMAN.
  3. **Senior Citizens (70+ Age):** Ayushman Vaya Vandana Card (₹5 Lakh universal cover for all citizens 70+ irrespective of income).
  4. **Paralysis & Disability:** Niramaya Health Insurance Scheme (National Trust, ₹1 Lakh for Cerebral Palsy, spastic paralysis, autism, multiple disabilities, covering corrective surgeries and ongoing physiotherapy/speech therapy), ADIP Scheme (free motorized tricycles, wheelchairs, prosthetics).
  5. **Cancer & Oncology:** Health Minister's Cancer Patient Fund (HMCPF / RAN ₹15 Lakh grant at Regional Cancer Centres), AMRIT discounted pharmacy.
  6. **Rare Diseases:** National Policy for Rare Diseases (NPRD up to ₹50 Lakh financial assistance at 12 designated Centres of Excellence).
  7. **Kidney & Dialysis:** Pradhan Mantri National Dialysis Programme (PMNDP 100% free peritoneal & hemodialysis for BPL).
  8. **Tuberculosis (TB):** Ni-kshay Poshan Yojana (₹500/month nutritional DBT throughout treatment + free CBNAAT/molecular testing).
  9. **Mental Health:** Tele-MANAS (24/7 National Mental Health Helpline 14416 across 20+ regional languages).
  10. **Universal & Poverty Upliftment:** Ayushman Bharat PM-JAY (₹5 Lakh), PMBJP Janaushadhi (50-90% cheaper generic medicines), state flagship insurance (MJPJAY, Aarogyasri, Swasthya Sathi, BSKY, CMCHIS, MAAY).
  11. **Emergency & Trauma:** Farishte Dilli Ke (100% free emergency golden-hour surgery/ICU at any private hospital, Good Samaritan legal protection), Innuyir Kaappom 48 (Tamil Nadu).
* **Record Structure:**
  * Title & Department (Bilingual: English & Hindi).
  * Scope (National vs. State).
  * State LGD code & name mapping.
  * Verified coverage amounts (e.g. ₹5,00,000/year, ₹25,00,000/year, ₹50,00,000 grant, 100% Free).
  * Key Benefits checklist.
  * Eligibility criteria and Application channels.
  * Direct 1-tap phone dialer (`tel:`) and official government URL.

---

## 3. Data Ingestion & Reporting Tools

All dataset maintenance, validation, and reporting scripts reside in the `scripts/` directory (`scripts/{data,db,ci}/`):

| Script Filename | Execution Command | Functionality |
| :--- | :--- | :--- |
| `scripts/data/report_dataset.mjs` | `npm run report:dataset` | Outputs real-time audit report of doctors, facilities, and hygiene compliance. |
| `scripts/ci/check_components.mjs` | `npm run check:components` | 8-stage automated component integrity and test verification engine. |
| `scripts/data/ingest_pmjay_facilities.mjs` | `node scripts/data/ingest_pmjay_facilities.mjs` | Ingests PM-JAY facilities with verified contacts into Supabase PostGIS. |
| `scripts/data/build_pan_india_doctors.mjs` | `node scripts/data/build_pan_india_doctors.mjs` | Normalizes PM-JAY medical officers into `lib/data/real-doctors.ts`. |

---

## 4. Data Hygiene & Validation Rules

To prevent data corruption, regressions, or misleading information, the platform enforces strict automated validation rules:

1. **Doctor Name Strict Prefix:**
   * Every doctor in `lib/data/real-doctors.ts` must match `/^Dr\./`.
   * Enforced in `tests/unit/multilingual-engine.test.ts`.
2. **Standard Telephone Format:**
   * Every phone contact must begin with `+91` followed by a valid Indian mobile (10 digits) or landline with STD code (e.g. `+91 755-2672355`).
   * Enforced in `tests/unit/multilingual-engine.test.ts`.
3. **Geographic Bounding Box:**
   * Every facility and doctor coordinate must fall within the sovereign territory bounding box of India:
     * Latitude: $6.5^\circ\text{ N} \le \text{Lat} \le 37.5^\circ\text{ N}$
     * Longitude: $68.7^\circ\text{ E} \le \text{Lon} \le 97.5^\circ\text{ E}$
4. **No Artificial Placeholders:**
   * No dummy numbers (e.g., `108`, `0000000000`, `9999999999`) may be used as fill-in data for unlisted clinics. Unlisted facilities must explicitly display *"Phone unlisted • Walk-in OPD"*.

---

## 5. Summary Statistics for Reporting

* **Total Verified Healthcare Facilities in PostGIS:** `10,742`
* **Total Registered Medical Practitioners in Catalog:** `913`
* **Total Verified National & State Healthcare Schemes:** `38` (16 Central Flagship, 22 State Schemes across 18 States)
* **Practitioners with Verified Online Reviews:** `60`
* **Total States & Union Territories Covered:** `36` (All India)
* **Total Administrative Districts Mapped:** `725`
* **Average PostGIS Proximity Query Latency:** `274 ms` (558 ms P95)
* **Pre-Commit Component Check Execution Time:** `< 9 seconds`
* **Unit Test Pass Rate:** `100% (88 / 88 tests passing)`
