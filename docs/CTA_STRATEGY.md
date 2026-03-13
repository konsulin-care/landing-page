# CTA Strategy

This document explains the **dual-CTA architecture** for Konsulin's landing page and when to direct users to WhatsApp vs. the PWA dashboard.

## Strategic Vision

**Primary Goal**: Build long-term habit formation through daily WhatsApp interactions.

**Secondary Goal**: Enable power users to access full analytics and features via PWA.

**Result**: Users enter via WhatsApp (low friction), stay via habit (daily journaling), and explore PWA (when they want deeper insights).

---

## The Dual-Interface Model

Konsulin has two interfaces that work together:

| Interface | Purpose | Users | When to Link |
|-----------|---------|-------|-------------|
| **WhatsApp** | Entry point + daily habit driver | General public, casual users | Primary CTA, all action-oriented sections |
| **PWA Dashboard** | Insight + analytics layer | Power users, explorers, professionals | Secondary CTA, after user understands value |

### Data Architecture
Data flows one direction: **WhatsApp → PWA**
- Users journal/screen in WhatsApp
- Data syncs real-time to PWA
- Users view analytics in PWA
- Users return to WhatsApp for daily interactions

---

## CTA Hierarchy Across the Page

Implement this **graduated CTA strategy** throughout the landing page:

### **Layer 1: Hero Section (First Impression)**
```
Primary CTA: "Mulai di WhatsApp"
└─ Color: Green (#10b981 or similar)
└─ Placement: Below fold (must scroll to see)
└─ Copy: Action-oriented, no friction language
└─ Link: WhatsApp chat or flow initiation

Optional Secondary: Small text link: "Lihat fitur di PWA"
└─ Color: Gray or text-link color
└─ Placement: Below primary CTA
└─ Copy: "Prefer the full dashboard? Try PWA"
```

**Rationale**: Users landing on your page don't know Konsulin yet. Pushing PWA here is friction. WhatsApp feels familiar and safe.

---

### **Layer 2: Value Blocks (Mid-Page, Multiple Sections)**
```
Each value block has a micro-CTA:

Block 1 (Jurnal):
└─ "Coba sekarang" → WhatsApp
└─ Why: User wants to *try* not *learn*

Block 2 (Skrining):
└─ "Lihat tes" → WhatsApp
└─ Why: Tests live in WhatsApp bot, start interaction there

Block 3 (Chat dengan Psikolog):
└─ "Hubungi sekarang" → WhatsApp
└─ Why: Connection to human happens via WhatsApp flow

Block 4 (Lihat Pola Mood):
└─ "Buka PWA" → PWA Dashboard
└─ Why: Pattern analytics are PWA-only feature
└─ Signal: User is ready for deeper insight
```

**Rationale**: Match the CTA to where the action happens. If journaling starts in WhatsApp, link to WhatsApp. If analytics are PWA-only, link to PWA.

---

### **Layer 3: Social Proof / Use Case Section**
```
Narrative: "Rini mulai di WhatsApp, sekarang dia lihat pola mood-nya di PWA"

Primary CTA: "Seperti Rini, mulai sekarang" → WhatsApp
└─ Reinforces the journey (WA → PWA)

Secondary CTA: "Lihat contoh dashboard Rini" → PWA screenshot or example
└─ For those wanting to preview PWA before trying WA
```

**Rationale**: Use case sections should show the *full journey*: WA entry → PWA discovery. Let both CTAs tell that story.

---

### **Layer 4: Final CTA Section (Bottom of Page)**
```
Headline: "Siap memahami kesehatan mental kamu?"

Layout: Two CTA options side-by-side (or stacked on mobile)

Primary CTA: "Mulai di WhatsApp" → WhatsApp
└─ Color: Green, prominent, larger
└─ Copy: Action-oriented
└─ Placement: Left (or top on mobile)

Secondary CTA: "Lihat fitur lengkap di PWA" → PWA
└─ Color: Outlined or gray, smaller
└─ Copy: Exploratory, for the curious
└─ Placement: Right (or below on mobile)
```

**Rationale**: By the end of the page, users have decided: "Do I want to try this?" If yes → WhatsApp (fast). If they want to explore first → PWA (optional).

---

## URL Formats and Implementation

### WhatsApp CTA Format

**For a simple WhatsApp chat link**:
```
https://wa.me/[YOUR_BUSINESS_NUMBER]?text=Halo%20Konsulin%2C%20aku%20ingin%20mulai
```

**Variables**:
- Replace `[YOUR_BUSINESS_NUMBER]` with Konsulin's WhatsApp Business number (with country code, e.g., `+6281234567890`)
- The `?text=` parameter pre-fills the user's first message
- URL-encode special characters: spaces = `%20`, `,` = `%2C`

**Example (for Indonesia)**:
```
https://wa.me/+6281234567890?text=Halo%20Konsulin%2C%20aku%20ingin%20mulai
```

**In Hugo template**:
```html
<a href="https://wa.me/+6281234567890?text=Halo%20Konsulin%2C%20aku%20ingin%20mulai"
   class="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold 
          hover:bg-green-700 transition-all duration-300">
  Mulai di WhatsApp
</a>
```

### WhatsApp Flow (If Using WhatsApp Bot Flows)

If Konsulin has a structured WhatsApp Flow (for onboarding, questionnaire, etc.):
```
https://wa.me/[YOUR_BUSINESS_NUMBER]?type=[FLOW_TYPE]&flow_id=[FLOW_ID]
```

Check with your WhatsApp Business Account for the exact flow URL format.

---

### PWA Dashboard CTA Format

**Standard PWA link**:
```
https://app.konsulin.com/dashboard
```

Or if you have a specific onboarding/login page:
```
https://app.konsulin.com/login
https://app.konsulin.com/signup
```

**In Hugo template**:
```html
<a href="https://app.konsulin.com/dashboard"
   class="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold 
          hover:border-gray-400 transition-all duration-300">
  Buka PWA Dashboard
</a>
```

Or as a text link:
```html
<a href="https://app.konsulin.com/dashboard"
   class="text-blue-600 hover:text-blue-800 underline font-semibold">
  Lihat fitur lengkap di PWA →
</a>
```

---

## Copy Guidelines for CTAs

### **WhatsApp CTA Copy**

Use **action-oriented, low-barrier language**:
- ✓ "Mulai di WhatsApp"
- ✓ "Chat dengan Konsulin"
- ✓ "Coba sekarang"
- ✓ "Hubungi kami"
- ✗ "Login ke aplikasi"
- ✗ "Buka dashboard"
- ✗ "Daftar akun"

**Why**: WhatsApp feels immediate and social, not like account creation.

### **PWA CTA Copy**

Use **exploratory, feature-focused language**:
- ✓ "Lihat dashboard"
- ✓ "Lihat fitur lengkap"
- ✓ "Buka aplikasi penuh"
- ✓ "Akses analytics"
- ✗ "Download aplikasi" (it's a PWA, not downloadable in traditional sense)
- ✗ "Daftar" (feels too formal)
- ✗ "Chat" (conflates with WhatsApp)

**Why**: PWA is for explorers and power users who want to see more depth.

---

## Button Styling (TailwindCSS)

### **Primary CTA (WhatsApp)**
```html
<a href="https://wa.me/..." 
   class="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold 
          hover:bg-green-700 active:bg-green-800 
          transition-all duration-300 transform hover:scale-105 
          shadow-md hover:shadow-lg">
  Mulai di WhatsApp
</a>
```

### **Secondary CTA (PWA)**
```html
<a href="https://app.konsulin.com/dashboard"
   class="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold 
          hover:border-gray-400 hover:bg-gray-50 
          transition-all duration-300">
  Lihat Fitur Lengkap
</a>
```

### **Text Link CTA (PWA)**
```html
<a href="https://app.konsulin.com/dashboard"
   class="text-blue-600 hover:text-blue-800 underline font-semibold 
          transition-colors duration-200">
  Buka PWA Dashboard →
</a>
```

---

## Placement Rules

### **Never place secondary CTAs above primary CTAs**

**Wrong** (confuses hierarchy):
```
[ Buka PWA Dashboard ]
[ Mulai di WhatsApp ]
```

**Correct** (clear hierarchy):
```
[ Mulai di WhatsApp ]    ← Primary (green, larger, prominent)

Prefer PWA? Buka dashboard →  ← Secondary (text link, small)
```

### **On mobile, stack CTAs vertically**

**Desktop** (side-by-side):
```
[ Mulai di WhatsApp ]  [ Buka PWA ]
```

**Mobile** (stacked):
```
[ Mulai di WhatsApp ]

[ Buka PWA Dashboard ]
```

Use TailwindCSS responsive classes:
```html
<div class="flex flex-col md:flex-row gap-4">
  <a href="..." class="flex-1">Mulai di WhatsApp</a>
  <a href="..." class="flex-1">Buka PWA</a>
</div>
```

---

## Measurement & Analytics

Track these metrics to validate the CTA strategy:

| Metric | What It Tells You |
|--------|------------------|
| **WhatsApp click-through rate** | How many users want to try (conversion signal) |
| **PWA click-through rate** | How many users want to explore first (research signal) |
| **WhatsApp-to-PWA conversion** | Do users who start in WA eventually explore PWA? (habit signal) |
| **Bounce rate after PWA** | Do PWA visitors return to WhatsApp or leave? |
| **Daily active users (WA vs. PWA)** | Which interface drives habit? (Should be WA for daily) |

---

## Common Mistakes to Avoid

### ❌ **Mistake 1: Pushing PWA too early**
```
Hero CTA: "Buka dashboard"
└─ Problem: User hasn't experienced value yet
└─ Result: High bounce rate
```

### ✓ **Correct**: Push WhatsApp in hero, PWA later
```
Hero CTA: "Mulai di WhatsApp"
Middle CTAs: Mix WhatsApp + PWA based on context
Final CTA: Both options
```

---

### ❌ **Mistake 2: Using the same CTA link everywhere**
```
All CTAs → PWA dashboard
└─ Problem: Users must create account first
└─ Result: Lower conversion, friction increases
```

### ✓ **Correct**: Match CTA to context
```
"Try journaling" → WhatsApp (start immediately)
"See analytics" → PWA (data lives here)
"Explore features" → PWA (full experience)
```

---

### ❌ **Mistake 3: Unclear button styling**
```
All buttons are gray and similar size
└─ Problem: User doesn't know what to click first
```

### ✓ **Correct**: Clear visual hierarchy
```
Primary (green, larger): "Mulai di WhatsApp"
Secondary (gray outline, smaller): "Lihat PWA"
```

---

## Testing the CTA Strategy

Before launching changes:

1. **Click test**: Every CTA link works and goes to the correct destination
2. **Mobile test**: CTAs are clickable on mobile (large enough, proper spacing)
3. **Hierarchy test**: Can a user identify the primary CTA on every section?
4. **Copy test**: Does CTA copy match what the user expects when they arrive?
   - Click "Coba sekarang" → WhatsApp loads
   - Click "Lihat dashboard" → PWA login loads
5. **Cross-device test**: Test on WhatsApp mobile browser, Safari, Chrome

---

## Summary

| Context | Primary CTA | Secondary CTA |
|---------|-------------|---------------|
| **Hero section** | WhatsApp | PWA (optional) |
| **Value blocks** | WhatsApp (for actions) | PWA (for analytics) |
| **Use case narrative** | WhatsApp | PWA example |
| **Final CTA block** | WhatsApp | PWA |

**Key Principle**: WhatsApp is the *entry point and daily driver*. PWA is the *insight layer*. Together, they create the habit loop.
