# Alpine.js Patterns

This document provides copy-paste Alpine.js patterns for the interactive elements used across the Konsulin landing page. All patterns use Alpine.js v3 and vanilla HTML—no external libraries needed.

## Overview

Alpine.js is already included in the TailBliss template. Use the patterns below to add interactivity without adding dependencies.

---

## Pattern 1: Expand/Collapse (Accordion)

**Use case**: Reveal hidden details on click. Best for value blocks, FAQs, proofs.

**Interactive behavior**:
1. User sees a closed state with a headline
2. User clicks
3. Content expands (smooth animation)
4. User clicks again
5. Content collapses

### Single Expand/Collapse

```html
<div x-data="{ open: false }" class="border rounded-lg p-6 cursor-pointer transition-all"
     :class="{ 'border-blue-500 bg-blue-50': open }">
  
  <!-- Clickable Header -->
  <div @click="open = !open" class="flex justify-between items-center">
    <h3 class="text-lg font-semibold">📝 Jurnal Harian</h3>
    <span class="text-2xl transition-transform duration-300" 
          :class="{ 'rotate-45': open }">+</span>
  </div>
  
  <!-- Hidden Content (Expands on Click) -->
  <div x-show="open" 
       x-transition:enter="transition ease-out duration-300"
       x-transition:enter-start="opacity-0"
       x-transition:enter-end="opacity-100"
       x-transition:leave="transition ease-in duration-200"
       x-transition:leave-start="opacity-100"
       x-transition:leave-end="opacity-0"
       class="mt-4 text-gray-600">
    <p class="leading-relaxed">
      Tulis perasaanmu, tanpa ada yang menilai. Tracking mood membantu kamu lihat pola 
      kesehatan mental sendiri.
    </p>
    <p class="text-sm text-gray-500 mt-3">
      🔬 Research menunjukkan journaling kurangi anxiety 30%.
    </p>
  </div>
</div>
```

**TailwindCSS classes used**:
- `x-data="{ open: false }"` – Initialize state
- `@click="open = !open"` – Toggle on click
- `x-show="open"` – Show/hide based on state
- `x-transition:*` – Smooth animations
- `:class="{ ... }"` – Conditional styling

---

### Multiple Expand/Collapse (Accordion Group)

For multiple sections where only one can be open at a time:

```html
<div x-data="{ activeTab: null }" class="space-y-4">
  
  <!-- Item 1 -->
  <div class="border rounded-lg p-6 cursor-pointer transition-all"
       :class="{ 'border-blue-500 bg-blue-50': activeTab === 1 }">
    <div @click="activeTab = activeTab === 1 ? null : 1" class="flex justify-between items-center">
      <h3 class="text-lg font-semibold">📝 Jurnal Harian</h3>
      <span class="text-2xl transition-transform" :class="{ 'rotate-45': activeTab === 1 }">+</span>
    </div>
    <div x-show="activeTab === 1" x-transition class="mt-4 text-gray-600">
      Tulis perasaanmu, tanpa ada yang menilai...
    </div>
  </div>

  <!-- Item 2 -->
  <div class="border rounded-lg p-6 cursor-pointer transition-all"
       :class="{ 'border-blue-500 bg-blue-50': activeTab === 2 }">
    <div @click="activeTab = activeTab === 2 ? null : 2" class="flex justify-between items-center">
      <h3 class="text-lg font-semibold">📊 Skrining Kesehatan Mental</h3>
      <span class="text-2xl transition-transform" :class="{ 'rotate-45': activeTab === 2 }">+</span>
    </div>
    <div x-show="activeTab === 2" x-transition class="mt-4 text-gray-600">
      Test kesehatan mental, tau hasilnya langsung...
    </div>
  </div>

  <!-- Item 3 -->
  <div class="border rounded-lg p-6 cursor-pointer transition-all"
       :class="{ 'border-blue-500 bg-blue-50': activeTab === 3 }">
    <div @click="activeTab = activeTab === 3 ? null : 3" class="flex justify-between items-center">
      <h3 class="text-lg font-semibold">💬 Chat dengan Psikolog</h3>
      <span class="text-2xl transition-transform" :class="{ 'rotate-45': activeTab === 3 }">+</span>
    </div>
    <div x-show="activeTab === 3" x-transition class="mt-4 text-gray-600">
      Konsultasi dengan profesional, kapan saja...
    </div>
  </div>
</div>
```

**Key difference**: `activeTab: null` instead of `open: false`, and `activeTab === 1` checks specific index.

**File location in your project**: Likely in `/layouts/partials/home-feature.html` or similar.

---

## Pattern 2: Tabs / Toggle Group

**Use case**: Switch between different content sections. Best for feature comparison, pricing tiers, different perspectives.

**Interactive behavior**:
1. User sees multiple tab buttons
2. User clicks a tab
3. Content for that tab displays
4. Other tabs hide

### Tab Group

```html
<div x-data="{ activeTab: 'journaling' }" class="w-full">
  
  <!-- Tab Buttons -->
  <div class="flex border-b border-gray-200 gap-0">
    <button 
      @click="activeTab = 'journaling'"
      :class="{ 'border-b-2 border-blue-600 text-blue-600': activeTab === 'journaling' }"
      class="px-6 py-3 font-semibold transition-colors text-gray-600 hover:text-blue-600">
      Jurnal
    </button>
    
    <button 
      @click="activeTab = 'screening'"
      :class="{ 'border-b-2 border-blue-600 text-blue-600': activeTab === 'screening' }"
      class="px-6 py-3 font-semibold transition-colors text-gray-600 hover:text-blue-600">
      Skrining
    </button>
    
    <button 
      @click="activeTab = 'counseling'"
      :class="{ 'border-b-2 border-blue-600 text-blue-600': activeTab === 'counseling' }"
      class="px-6 py-3 font-semibold transition-colors text-gray-600 hover:text-blue-600">
      Konseling
    </button>
  </div>

  <!-- Tab Content -->
  <div class="mt-6">
    
    <!-- Journaling Tab -->
    <div x-show="activeTab === 'journaling'" x-transition class="text-gray-700">
      <h3 class="text-xl font-semibold mb-3">Jurnal Harian</h3>
      <p>Tulis perasaanmu setiap hari. Lihat pola mood dalam dashboard PWA.</p>
      <a href="..." class="text-blue-600 hover:text-blue-800 mt-4 inline-block">Coba sekarang →</a>
    </div>

    <!-- Screening Tab -->
    <div x-show="activeTab === 'screening'" x-transition class="text-gray-700">
      <h3 class="text-xl font-semibold mb-3">Skrining Kesehatan Mental</h3>
      <p>Test yang terbukti secara ilmiah untuk memahami kondisi mental kamu.</p>
      <a href="..." class="text-blue-600 hover:text-blue-800 mt-4 inline-block">Lihat tes →</a>
    </div>

    <!-- Counseling Tab -->
    <div x-show="activeTab === 'counseling'" x-transition class="text-gray-700">
      <h3 class="text-xl font-semibold mb-3">Chat dengan Psikolog</h3>
      <p>Konsultasi dengan profesional kesehatan mental kapan kamu butuh.</p>
      <a href="..." class="text-blue-600 hover:text-blue-800 mt-4 inline-block">Hubungi sekarang →</a>
    </div>
  </div>
</div>
```

**Key points**:
- `activeTab: 'journaling'` – Start with first tab active
- Use string keys instead of numbers for clarity
- `:class` conditionally adds underline/color to active tab

---

## Pattern 3: Carousel / Slider

**Use case**: Scroll through multiple items. Best for testimonials, use cases, image galleries.

**Interactive behavior**:
1. User sees current item (e.g., testimonial)
2. User clicks "next" or "prev"
3. Display updates to show next item
4. Navigation dots show which item is active

### Testimonial Carousel

```html
<div x-data="{ 
  current: 0, 
  testimonials: [
    { name: 'Rini, 24', role: 'Content Creator', text: 'Awalnya aku pikir mental health itu cuma buat orang yang \"sakit\". Ternyata semua orang perlu maintain kesehatan mental. Thanks Konsulin!' },
    { name: 'Aldi, 32', role: 'Manajer Proyek', text: 'Journaling di Konsulin bantu aku manage stress kerja. Sekarang aku tau pola kapan aku paling tertekan.' },
    { name: 'Siti, 28', role: 'Guru', text: 'Aplikasinya simple dan mudah dipakai. Aku recommend ke murid-murid aku yang struggling dengan mental health.' }
  ]
}" class="w-full">

  <!-- Current Testimonial -->
  <div class="bg-gray-50 rounded-lg p-8 mb-6">
    <p class="text-lg text-gray-700 mb-4 italic">
      "<span x-text="testimonials[current].text"></span>"
    </p>
    <p class="font-semibold text-gray-900">
      <span x-text="testimonials[current].name"></span> — <span class="text-gray-600" x-text="testimonials[current].role"></span>
    </p>
  </div>

  <!-- Navigation -->
  <div class="flex items-center justify-between">
    <!-- Previous Button -->
    <button @click="current = current === 0 ? testimonials.length - 1 : current - 1"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
      ← Sebelumnya
    </button>

    <!-- Dots Indicator -->
    <div class="flex gap-2">
      <template x-for="(_, index) in testimonials" :key="index">
        <button @click="current = index"
                :class="{ 'bg-blue-600': current === index, 'bg-gray-300': current !== index }"
                class="w-2 h-2 rounded-full transition"></button>
      </template>
    </div>

    <!-- Next Button -->
    <button @click="current = current === testimonials.length - 1 ? 0 : current + 1"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
      Selanjutnya →
    </button>
  </div>

  <!-- Item Counter (Optional) -->
  <p class="text-center text-gray-600 text-sm mt-4">
    <span x-text="current + 1"></span> dari <span x-text="testimonials.length"></span>
  </p>
</div>
```

**Key points**:
- `x-for="(_, index) in testimonials"` – Loop through array to create dots
- `:key="index"` – Unique key for each dot
- `current = current === 0 ? length - 1 : current - 1` – Loop back to end

**File location**: Likely `/layouts/partials/home-rationale.html` or similar.

---

## Pattern 4: Scroll-Reveal Animation

**Use case**: Animate sections as user scrolls into view. Best for hero animations, building momentum.

**Interactive behavior**:
1. Section is hidden/opacity 0
2. User scrolls to section
3. Section fades in or slides up
4. Animation completes

### Scroll-Reveal (Fade-In)

```html
<section x-data="{ 
  visible: false 
}" 
@scroll.window="visible = (window.pageYOffset + window.innerHeight) > $el.offsetTop + 100"
:class="{ 'opacity-100': visible, 'opacity-0': !visible }"
class="transition-opacity duration-700 ease-out py-16">
  
  <h2 class="text-3xl font-bold mb-8">Apa Itu Konsulin?</h2>
  <p class="text-gray-700 text-lg leading-relaxed">
    Konsulin adalah platform kesehatan mental yang dirancang untuk membuat wellness 
    dan healthcare accessible, credible, dan secure.
  </p>
</section>
```

**Key points**:
- `@scroll.window` – Listen to scroll events
- `visible = (window.pageYOffset + window.innerHeight) > $el.offsetTop + 100` – Trigger when 100px before element
- `:class` toggles opacity

---

### Scroll-Reveal (Slide-Up)

For a more dramatic effect:

```html
<section x-data="{ 
  visible: false 
}" 
@scroll.window="visible = (window.pageYOffset + window.innerHeight) > $el.offsetTop + 100"
class="py-16">
  
  <div :class="{ 'opacity-100 translate-y-0': visible, 'opacity-0 translate-y-10': !visible }"
       class="transition-all duration-700 ease-out">
    
    <h2 class="text-3xl font-bold mb-8">Nilai-Nilai Kami</h2>
    <p class="text-gray-700 text-lg">
      Konsulin dibangun dengan kepercayaan bahwa akses mudah ke informasi yang akurat 
      memberdayakan orang untuk memahami kesehatan mental mereka dengan lebih baik.
    </p>
  </div>
</section>
```

**Difference**: Uses `translate-y-10` (slides up 10px) combined with opacity.

---

## Pattern 5: Hover Tooltip / Reveal

**Use case**: Show additional context on hover. Best for research citations, icons with explanations.

**Interactive behavior**:
1. User hovers over element
2. Tooltip appears
3. User moves away
4. Tooltip disappears

### Hover Tooltip

```html
<div class="flex items-center gap-2 cursor-help">
  <span class="font-semibold">🔬 Berbasis Riset</span>
  
  <div x-data="{ showTooltip: false }" 
       @mouseenter="showTooltip = true" 
       @mouseleave="showTooltip = false"
       class="relative inline-block">
    
    <!-- Hover Trigger (Icon) -->
    <span class="text-blue-600 font-bold">?</span>
    
    <!-- Tooltip -->
    <div x-show="showTooltip" 
         x-transition
         class="absolute bottom-full left-0 mb-2 bg-gray-900 text-white text-sm rounded px-3 py-2 whitespace-nowrap pointer-events-none">
      Setiap test di Konsulin adalah standar internasional psikologi
      <div class="absolute top-full left-0 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
    </div>
  </div>
</div>
```

**Key points**:
- `@mouseenter` and `@mouseleave` – Trigger on hover
- Tooltip positioned absolutely with `bottom-full` (above)
- Arrow indicator using CSS border trick

---

### Hover Expand (Card Reveal)

```html
<div x-data="{ hovered: false }" 
     @mouseenter="hovered = true"
     @mouseleave="hovered = false"
     class="rounded-lg border p-6 transition-all cursor-pointer"
     :class="{ 'shadow-lg border-blue-500 bg-blue-50': hovered }">
  
  <h3 class="text-lg font-semibold mb-2">Skrining Kesehatan Mental</h3>
  <p class="text-gray-600">Test yang terbukti ilmiah, hasil instan.</p>
  
  <!-- Additional Info (Shows on Hover) -->
  <div x-show="hovered" x-transition class="mt-4 pt-4 border-t border-gray-300">
    <p class="text-sm text-gray-700">
      Tes ini menggunakan standar yang sama dengan yang digunakan dokter, 
      tapi kamu bisa lakukan sendiri di rumah.
    </p>
    <a href="#" class="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block">Lihat tes →</a>
  </div>
</div>
```

---

## Pattern 6: Form Input with Validation (Bonus)

**Use case**: Contact form, newsletter signup, etc.

```html
<form x-data="{ 
  email: '', 
  submitted: false,
  isValid: false
}"
@submit.prevent="submitted = true"
class="space-y-4">
  
  <div>
    <input type="email" 
           x-model="email"
           @input="isValid = email.includes('@')"
           placeholder="Email kamu"
           class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600">
    
    <!-- Validation Message -->
    <p x-show="submitted && !isValid" class="text-red-600 text-sm mt-1">
      Masukkan email yang valid
    </p>
  </div>
  
  <button type="submit"
          :disabled="!isValid && submitted"
          class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
    Kirim
  </button>
  
  <p x-show="submitted && isValid" class="text-green-600">
    Terimakasih! Kami akan hubungi kamu.
  </p>
</form>
```

---

## Best Practices

### 1. **Keep It Simple**
Each interactive element should do one thing. Avoid nesting too many `x-data` blocks.

### 2. **Always Provide Fallback**
Not all users have JavaScript enabled. Critical content should be visible without Alpine.

```html
<!-- Good: Content visible by default -->
<div x-data="{ open: false }">
  <div @click="open = !open">Click me</div>
  <div x-show="open">Hidden content</div>
</div>

<!-- Less good: Content hidden by default -->
<div x-show="someCondition" style="display: none;">
  Content might not show if JS fails
</div>
```

### 3. **Use Transitions Consistently**
Stick to `x-transition` for smooth, consistent animations across all interactive elements.

### 4. **Test on Mobile**
Alpine.js works on mobile, but test tap targets are large enough (minimum 44x44px).

### 5. **Name Data Properties Clearly**
```html
<!-- Good: Clear naming -->
<div x-data="{ activeTab: 'journaling', isLoading: false }">

<!-- Less clear: Abbreviated -->
<div x-data="{ t: 1, l: false }">
```

---

## Performance Tips

- **Avoid `x-for` on large lists**: Carousel pattern above shows how to handle this
- **Use `x-cloak` for flash prevention**:
  ```html
  <div x-cloak x-data="...">Content</div>
  ```
  And in CSS:
  ```css
  [x-cloak] { display: none; }
  ```

- **Debounce scroll events** if you have many:
  ```html
  @scroll.window.debounce.250ms="..."
  ```

---

## File Locations in Your Project

Based on your structure, look for these patterns in:

| Pattern | Likely Location |
|---------|---|
| Expand/Collapse (Value blocks) | `/layouts/partials/home-feature.html` |
| Tabs (Feature comparison) | `/layouts/partials/home-feature.html` |
| Carousel (Testimonials) | `/layouts/partials/home-rationale.html` |
| Scroll-Reveal | `/layouts/partials/home-header.html` or `/layouts/index.html` |
| Hover Effects | Any card-based partial |

---

## Additional Resources

- [Alpine.js Documentation](https://alpinejs.dev/)
- [Alpine.js Cheat Sheet](https://alpinejs.dev/start-here)
- TailwindCSS transition utilities: https://tailwindcss.com/docs/transition-property

---

## Summary

| Pattern | Use | Copy From |
|---------|-----|-----------|
| Expand/Collapse | Value blocks, FAQ | Pattern 1 |
| Tabs | Feature comparison | Pattern 2 |
| Carousel | Testimonials, use cases | Pattern 3 |
| Scroll-Reveal | Hero animations | Pattern 4 |
| Hover Tooltip | Citations, icons | Pattern 5 |

Choose the right pattern for each section, copy the code, adjust copy/styling, and test on mobile.
