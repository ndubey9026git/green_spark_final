# Degrade UI Across All Pages

**Goal**: Transform the current premium, animated, glassmorphic UI into a minimal, plain, and intentionally unattractive design for all pages.

## User Review Required
> [!IMPORTANT]
> This change will significantly reduce visual quality and user experience. Confirm you want to proceed.

## Open Questions
> [!WARNING]
> - Should we apply these changes to every existing component, or only top‑level pages?
> - Do you want any specific "worst" styles (e.g., Comic Sans, flashing colors) or just plain defaults?

## Proposed Changes

### Global Styles
- Replace `src/index.css` (or main stylesheet) with the following minimal CSS that overrides all colors to black on white, removes border radius, disables animations, and uses default system fonts.

```diff
@@
-/* Existing premium styles */
+/* Worst‑possible UI overrides */
+* {
+  all: unset;
+  box-sizing: border-box;
+}
+body {
+  margin: 0;
+  padding: 0;
+  background: #ffffff;
+  color: #000000;
+  font-family: "Comic Sans MS", cursive, sans-serif;
+}
+button, input, select, textarea {
+  border: 2px solid #ff00ff;
+  background: #ffff00;
+  color: #0000ff;
+  font-size: 20px;
+  animation: none !important;
+}
+img {
+  filter: hue-rotate(180deg) invert(100%);
+  opacity: 0.3;
+}
+/* Disable all transitions */
+* {
+  transition: none !important;
+}
```

### Component‑Specific Adjustments
- **GamePlayer.jsx**: Remove all `motion` wrappers and replace with plain `div`s.
- **Dashboard.jsx**, **CarbonTracker.jsx**, **AIEcoAdvisor.jsx**, **BioreactorSandbox.jsx**, **GreenGridSandbox.jsx**, **CarbonCaptureSandbox.jsx**: Strip all Tailwind/utility classes, replace with inline styles using the worst colors.
- Remove all glass‑morphism backgrounds and replace with solid gray.
- Replace all icons with plain text equivalents.

### Remove Animations
- Delete all `framer-motion` imports and usage.
- Remove any CSS animation keyframes.

### Verification Plan
- Run `npm run build` and ensure the app compiles.
- Manually browse each route (`/dashboard`, `/grid-simulator`, `/dac-simulator`, `/bioreactor-simulator`, etc.) to verify the UI looks deliberately plain and unattractive.

## Verification Plan
### Automated Tests
- None required; visual inspection only.

### Manual Verification
- Open the app in a browser, navigate to every page, and confirm the UI matches the described worst style.

---
*This plan will be applied once you approve.*
