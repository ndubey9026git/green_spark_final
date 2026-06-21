# Attractive Animated Responsive UI for GreenSpark

## Goal
Create a premium, modern, and responsive UI across the whole application. The design will feature:
- Glass‑morphism cards with subtle blur
- Bright, harmonious gradients and a curated color palette
- Smooth micro‑animations using `framer-motion`
- Responsive layouts that work on mobile, tablet, and desktop
- Consistent typography with Google Font **Inter**
- Accessible contrast and focus states

## User Review Required
> [!IMPORTANT]
> This change will overhaul the visual styling of **all** pages (Dashboard, CarbonTracker, Simulators, etc.). Please confirm you want to proceed.

## Open Questions
> [!WARNING]
> - Do you prefer a dark theme (dark background, light cards) or a light theme (light background, dark cards)?
> - Should we keep the current component structure and only inject new CSS, or are you open to reorganising components for better layout control?
> - Any specific brand colors you want to incorporate beyond the default teal‑blue gradient?

## Proposed Changes

### 1. Global Styles (`src/index.css`)
Create a new stylesheet that defines the design system:
```diff
+/* Design Tokens */
+ :root {
+   --font-family: 'Inter', system-ui, sans-serif;
+   --primary-h: 210;   /* hue for blue */
+   --primary-s: 60%;
+   --primary-l: 52%;
+   --accent-h: 160;   /* teal */
+   --accent-s: 55%;
+   --accent-l: 45%;
+   --bg-light: hsl(0, 0%, 98%);
+   --bg-dark: hsl(210, 10%, 10%);
+ }
+
+html, body {
+   margin:0; padding:0;
+   font-family: var(--font-family);
+   background: var(--bg-light);
+   color: hsl(var(--primary-h), 5%, 20%);
+   line-height: 1.6;
+}
+
+/* Glass‑morphism card utility */
+.glass-card {
+   background: rgba(255,255,255,0.25);
+   backdrop-filter: blur(12px);
+   border-radius: 1rem;
+   border: 1px solid rgba(255,255,255,0.3);
+   padding: 1.5rem;
+   box-shadow: 0 4px 30px rgba(0,0,0,0.1);
+}
+
+/* Responsive grid helper */
+.grid-responsive {
+   display: grid;
+   gap: 1.5rem;
+   grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
+}
+
+/* Button with subtle animation */
+.btn-primary {
+   background: linear-gradient(135deg, hsl(var(--primary-h), var(--primary-s), var(--primary-l)), hsl(var(--accent-h), var(--accent-s), var(--accent-l)));
+   color:#fff;
+   border:none;
+   border-radius: 0.75rem;
+   padding: 0.75rem 1.5rem;
+   cursor:pointer;
+   transition: transform 0.2s ease, box-shadow 0.2s ease;
+}
+.btn-primary:hover {
+   transform: translateY(-2px);
+   box-shadow: 0 4px 12px rgba(0,0,0,0.15);
+}
+
+/* Animate entry using framer‑motion */
+.fade-in {
+   opacity:0;
+   transform: translateY(20px);
+   animation: fadeIn 0.6s forwards ease-out;
+}
+@keyframes fadeIn {
+   to { opacity:1; transform:none; }
+}
```

### 2. Import Global CSS
Add the stylesheet to the entry point (`src/main.jsx` or `src/index.js`):
```js
import './index.css';
```

### 3. Update Core Layouts
- **App.jsx**: Wrap `<Routes>` with a `<motion.div className="fade-in">` to animate page transitions.
- **Dashboard.jsx**, **CarbonTracker.jsx**, **AIEcoAdvisor.jsx**, **BioreactorSandbox.jsx**, **GreenGridSandbox.jsx**, **CarbonCaptureSandbox.jsx**:
  - Replace top‑level containers with `<div className="glass-card fade-in">`.
  - Use the `.grid-responsive` class for card collections.
  - Convert `motion.div` wrappers to `<motion.div>` with simple `whileHover` scale effects on interactive elements (buttons, cards).
  - Swap Tailwind utility classes for the new CSS utility classes where possible.

### 4. Animations
Add subtle motion to frequently used UI pieces:
```js
<motion.button whileHover={{ scale:1.05 }} className="btn-primary">Start</motion.button>
```
- Header links: fade‑in on mount, underline slide on hover.
- Cards: lift on hover (`whileHover={{ y:-5, scale:1.02 }}`).

### 5. Responsive Navigation Header
Create a new `Header.jsx` component (or update existing) that:
- Shows a hamburger menu on < 640 px.
- Uses flexbox to space items.
- Applies the `.glass-card` background.
- Animates the mobile drawer with `framer-motion` slide‑in.

### 6. Font Integration
Add Google Font Inter via `<link>` in `public/index.html` or import in CSS:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
```

### 7. Test & Verify
1. Run `npm run dev` → confirm no CSS conflicts.
2. Resize the viewport to verify the `.grid-responsive` behaviour.
3‑9. Visit each route (`/dashboard`, `/grid-simulator`, `/dac-simulator`, `/bioreactor-simulator`, `/leaderboard`, etc.) and ensure the new card style, buttons, and motion are applied.
10. Check accessibility contrast with Chrome dev tools.

## Verification Plan
- **Automated**: Lint (`npm run lint`) and build (`npm run build`).
- **Manual**: Visual inspection on desktop and mobile (Chrome dev tools responsive mode).

---
*Please review the open questions and confirm you’d like to proceed.*
