# Landing Page Formula

This document explains the **repeating modular pattern** used across the Konsulin landing page. Every section follows this template to ensure consistent conversion flow and user engagement.

## The Core Formula: Problem → Outcome → Proof → Action

Each section is a **self-contained conversion unit** that answers one specific question for the user.

```
┌─────────────────────────────────────────────────────┐
│ SECTION BLOCK                                       │
├─────────────────────────────────────────────────────┤
│ 1. Problem Statement (Text + Visual)                │
│    └─ What's missing or broken?                     │
│                                                     │
│ 2. Outcome (Text)                                   │
│    └─ What will they experience?                    │
│                                                     │
│ 3. Proof (Optional: Visual or Interactivity)        │
│    └─ Why should they believe this?                 │
│                                                     │
│ 4. Action (Button or Link)                          │
│    └─ What's the next step?                         │
└─────────────────────────────────────────────────────┘
```

## Section Breakdown

### 1. Text: Problem Statement
**Purpose**: Emotional hook that resonates with the user's pain.

**Structure**: One sentence, phrased as a problem, not a feature.

**Examples**:
- ❌ "Konsulin provides digital journaling" (feature-focused)
- ✓ "Siapa yang mendengarkan perasaanmu?" (problem-focused)
- ❌ "Mental health screening available" (feature)
- ✓ "Merasa tertekan tapi tidak tahu kenapa?" (problem)

**Rule**: Always start by naming the problem, not the solution.

---

### 2. Visual: Reinforce the Problem
**Purpose**: Show what the problem *looks like*, not what the solution does.

**Options**:
- Icon (e.g., sad face, person alone, question mark)
- Illustration (e.g., person journaling, stressed at desk)
- Photo (e.g., thoughtful person, candid moment)
- Diagram (flow showing the problem loop)

**Rule**: The visual should make the user feel *seen*, not sold to.

---

### 3. Text: Outcome (Reframed as a Benefit)
**Purpose**: Answer "What will I experience if I solve this?"

**Structure**: One sentence, phrased as an outcome the user will feel or achieve.

**Examples**:
- ❌ "Konsulin has journaling" (feature)
- ✓ "Tulis tanpa dihakimi, lihat polanya sendiri" (outcome)
- ❌ "Screening tests available" (feature)
- ✓ "Pahami kesehatanmu dengan sains, tanpa antri dokter" (outcome)

**Rule**: Use first-person or direct address ("kamu"). Make it tangible.

---

### 4. Interactive Reveal (Optional but Recommended)
**Purpose**: Deepen understanding without requiring a click to advance.

**Options**:
- Click to expand hidden detail
- Hover to show tooltip
- Scroll to reveal next section
- Tab between related options
- Carousel to browse similar items

**Rule**: Interactivity should feel optional—never force users to interact to understand the main message.

---

### 5. Action: Micro-CTA or Navigation
**Purpose**: Move the user forward (either deeper into the page or to the next step).

**Structure**: Button or link with clear, action-oriented text.

**Examples**:
- Primary CTA: "Mulai di WhatsApp" (green, prominent)
- Secondary CTA: "Lihat selengkapnya" (text link or outline)
- Navigation: "Lanjut ke fitur berikutnya" (arrow or button)

**Rule**: Each section should either drive toward the primary CTA or deepen engagement.

---

## Repeating Section Types

Apply the formula above to each of these section types:

### **Section 1: Hero Block**
- **Problem**: Emotional statement about what's missing
- **Visual**: Full-width image or animation (person in the emotional state)
- **Outcome**: One sentence: what they'll feel after using Konsulin
- **Interactivity**: Subtle fade-in or slide-up animation on page load
- **Action**: Primary CTA ("Mulai di WhatsApp"), placed below the fold

**Placement**: Top of page, above the fold.

**Goal**: Stop scrolling, answer "Why should I care?"

---

### **Section 2-5: Value Blocks (Repeating)**
- **Problem**: Pain point related to one core feature
- **Visual**: Icon or small illustration (helps with scannability)
- **Outcome**: What they'll experience after using this feature
- **Interactivity**: Click to expand and reveal deeper detail (proof point, stat, or example)
- **Action**: Secondary CTA or navigation link ("Lihat lebih lanjut")

**Placement**: Middle of page (roughly 4-5 value blocks).

**Goal**: Show how each part of Konsulin solves a specific problem.

**Typical value blocks**:
1. Journaling (curah hati tanpa takut)
2. Screening (pahami kesehatan mental dengan sains)
3. Chat dengan psikolog (konsultasi kapan butuh)
4. Manajemen jadwal (jangan lupa appointment)
5. (Optional) Lihat pola mood (analytics di PWA)

---

### **Section 6: Social Proof Block**
- **Problem**: "Why should I trust this?" (implicit)
- **Visual**: Avatar carousel, testimonials, or research badges
- **Outcome**: "People like me found this valuable"
- **Interactivity**: Carousel to browse testimonials, or hover to reveal full quote
- **Action**: Link to full reviews or research citations

**Placement**: After value blocks, before use case.

**Goal**: Build credibility without being corporate.

---

### **Section 7: Use Case / Narrative Block**
- **Problem**: "Is this for someone like me?"
- **Visual**: Screenshot carousel or step-by-step diagram
- **Outcome**: Narrative showing problem → resolution
- **Interactivity**: Clickable steps that reveal one at a time
- **Action**: Primary CTA ("Mulai seperti [nama]" or "Coba sekarang")

**Placement**: Near the bottom, before final CTA.

**Goal**: Make it real—show someone relatable using Konsulin.

**Narrative structure**:
1. Introduce the person and their problem (relatable)
2. Show them opening WhatsApp to Konsulin
3. Show them journaling or screening
4. Show them seeing the pattern in PWA
5. Show them feeling better/more aware

---

### **Section 8: Final CTA Block**
- **Problem**: "Is this really for me?" (implicit, last chance to convince)
- **Visual**: Optional (could be empty for minimalism)
- **Outcome**: Urgency-light statement ("Siap memahami kesehatan mental kamu?")
- **Interactivity**: None (focus on decision)
- **Action**: Primary CTA (WhatsApp) + secondary CTA (PWA for explorers)

**Placement**: Bottom of page.

**Goal**: Give ready-to-convert users both entry points.

---

## Content Rules

### Copy Tone
- **Conversational**: Write like a friend, not a salesperson
- **Direct**: Use "kamu" (you), not "pengguna" (user)
- **Problem-first**: Name the pain before offering relief
- **Proof-light**: Mention credibility (research, team) but don't oversell

### Copy Length
- Problem statement: 1 sentence (5-8 words ideal)
- Outcome statement: 1 sentence (8-12 words ideal)
- Proof/detail (on expand): 2-3 sentences max
- Button text: 2-3 words max

### Visual Consistency
- Icons: Use consistent style (outline or solid, not mixed)
- Colors: Use 2-3 primary colors for CTAs, neutral for content
- Spacing: Consistent padding/margins between sections
- Responsive: Test on mobile (where most users will be)

---

## Interaction Patterns

Use one primary interaction pattern **per section**. Don't overload.

### **Pattern 1: Expand/Collapse**
```
User sees: "Jurnal Harian"
On click: Reveal "Tulis tanpa dihakimi, lihat polanya"
```
**Best for**: Value blocks, proof points, FAQs

### **Pattern 2: Tabs/Toggle**
```
User sees: Multiple buttons (Jurnal | Skrining | Chat | Jadwal)
On click: Show relevant content
```
**Best for**: Showing different features side-by-side

### **Pattern 3: Carousel**
```
User sees: Testimonial 1
On click next/prev: Cycle through testimonials
```
**Best for**: Testimonials, use cases, step-by-step narratives

### **Pattern 4: Scroll-Reveal**
```
User scrolls down
Section fades in or slides up as it enters viewport
```
**Best for**: Hero animations, section transitions, building momentum

### **Pattern 5: Hover-Hint**
```
User hovers over element
Tooltip or detail text appears
```
**Best for**: Icons, research citations, additional context

---

## The Conversion Journey (Timeline)

This is what you're optimizing for when building sections:

```
Seconds 0-2:  Hero block
              └─ User thinks: "Oh, this is about me"

Seconds 2-5:  Value block 1 + 2
              └─ User thinks: "Okay, I see how this helps"

Seconds 5-8:  Interactive element (expand, carousel, hover)
              └─ User thinks: "This seems legit"

Seconds 8-10: Primary CTA visible
              └─ User thinks: "Let me try it"
              └─ CLICK TO WHATSAPP
```

Each section should move the user closer to this goal without overwhelming them.

---

## Testing the Formula

Before committing a new section:

1. **Read the problem statement alone**: Does it resonate? Does it feel real?
2. **Look at the visual alone**: Does it reinforce the problem (not the solution)?
3. **Read the outcome alone**: Is it specific and believable?
4. **Test the interaction**: Does it reveal something useful without friction?
5. **Click the action**: Does the next step feel natural?

If any of these fail, the section breaks the formula.

---

## Examples in the Codebase

Look for these patterns in `/layouts/partials/`:
- `home-header.html` – Hero block (problem + CTA)
- `home-feature.html` – Value blocks (repeating pattern)
- `home-rationale.html` – Social proof (carousel)
- `home-cta.html` – Final CTA block

Compare these against the formula above to understand the structure in practice.
