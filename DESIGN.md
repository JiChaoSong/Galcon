---
name: Fidelity Dark
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#bec7d4'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#88919d'
  outline-variant: '#3f4852'
  surface-tint: '#98cbff'
  primary: '#98cbff'
  on-primary: '#003354'
  primary-container: '#00a3ff'
  on-primary-container: '#00375a'
  inverse-primary: '#00629d'
  secondary: '#7dffa2'
  on-secondary: '#003918'
  secondary-container: '#05e777'
  on-secondary-container: '#00622e'
  tertiary: '#ffb778'
  on-tertiary: '#4c2700'
  tertiary-container: '#e88300'
  on-tertiary-container: '#512a00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#cfe5ff'
  primary-fixed-dim: '#98cbff'
  on-primary-fixed: '#001d33'
  on-primary-fixed-variant: '#004a77'
  secondary-fixed: '#62ff96'
  secondary-fixed-dim: '#00e475'
  on-secondary-fixed: '#00210b'
  on-secondary-fixed-variant: '#005226'
  tertiary-fixed: '#ffdcc1'
  tertiary-fixed-dim: '#ffb778'
  on-tertiary-fixed: '#2e1500'
  on-tertiary-fixed-variant: '#6c3a00'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1440px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  sidebar-width: 260px
  panel-padding: 24px
---

## Brand & Style

The design system is engineered for the **GEO Workbench**, a high-precision, data-intensive environment where clarity meets cutting-edge technology. It evokes a sense of technical mastery, innovation, and unwavering reliability. The brand personality is "Technical Maverick"—professional enough for enterprise data analysis but vibrant enough to signal a modern, forward-thinking platform.

The visual style is a fusion of **Corporate Modern** and **Science & Tech**. It prioritizes information density while maintaining a sophisticated aesthetic through the use of high-contrast accents against a deep, void-like background. The interface should feel like a high-end command center: efficient, luminous, and structured.

## Colors

The palette utilizes a high-contrast dark mode strategy. The **Primary Blue** (#00a3ff) is the engine of the interface, used for navigation and primary data focal points. **Secondary Green** (#00e676) is reserved for positive trajectories, success states, and additive data. **Tertiary Orange** (#ff9100) provides a critical visual counterpoint for warnings, alerts, and high-priority highlights.

Surface colors are layered using a "luminance-based elevation" model. Backgrounds use the Neutral Black (#0a0a0a) as the deepest foundation, while interactive cards and panels use progressively lighter shades of grey to indicate hierarchy. All text maintains high contrast ratios against these dark backgrounds to ensure legibility during extended analytical sessions.

## Typography

The typographic system leverages **Space Grotesk** for its technical, geometric character, making headlines feel like coordinates on a map. **Inter** is used for all functional text to maximize legibility in data-dense tables and code blocks.

- **Headlines:** Use Space Grotesk for page titles, card headers, and large numeric displays.
- **Body:** Use Inter for general descriptions and analytical summaries.
- **Labels:** Use Inter Bold (Uppercase) for table headers, axis labels, and metadata tags to provide a clear functional distinction.

## Layout & Spacing

This design system utilizes a **Fixed Grid** approach for the main content area to ensure data visualizations remain consistent, while the sidebar and auxiliary panels follow a fluid model.

- **Desktop (1280px+):** 12-column grid, 32px margins, 16px gutters. The sidebar is fixed to the left.
- **Tablet (768px - 1279px):** 8-column grid, 24px margins. Sidebar collapses into an icon-only rail.
- **Mobile (< 768px):** 4-column grid, 16px margins. Sidebar becomes a hidden drawer.

A strictly 8px-based spacing scale ensures vertical rhythm. Data tables should use a "Compact" vertical rhythm (8px row padding) to maximize information density.

## Elevation & Depth

In this dark-mode environment, depth is communicated through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows.

- **Level 0 (Base):** #0A0A0A - The canvas.
- **Level 1 (Panels/Sidebar):** #141414 - Distinct sections of the workbench.
- **Level 2 (Cards/Modals):** #1F1F1F - Floating elements or interactive containers.
- **Outlines:** Use a 1px border (#262626) on all Level 1 and Level 2 elements to provide definition without relying on light-source logic.
- **Glow:** Primary and Secondary interactive elements may use a subtle, 4px blur outer glow in their respective brand color when in a focused or active state.

## Shapes

The shape language is "Rounded and Accessible." A standard radius of **8px** (rounded-DEFAULT) is applied to most UI components to balance the technical nature of the platform with a more modern, approachable feel.

- **Buttons & Inputs:** 8px radius.
- **Analytical Cards:** 16px radius (rounded-lg) to provide a distinct, soft container for complex data.
- **Tags/Chips:** 4px radius (rounded-sm) for a refined, system-level feel.

This increased roundedness (Level 2) maintains a professional feel while providing a more contemporary and accessible aesthetic for the workbench.

## Components

### Sidebar Navigation
The sidebar uses a dark-grey background (#141414) with a primary-blue indicator (2px vertical bar) for the active state. Icons should be stroke-based and consistently sized at 20px.

### Data Tables
Tables are the heart of the workbench. Headers use `label-md` with a subtle bottom border. Row hover states should use a slight luminance increase (#1F1F1F). Column alignment is strict: text to the left, numerical data to the right.

### Analytical Cards
Cards contain chart or graph modules. They must include a title bar with Space Grotesk typography and an optional "Actions" area for filtering or exporting data. Use the 16px corner radius for these primary containers.

### Charts & Graphs
- **Line/Bar Charts:** Use Primary Blue for the main series, Secondary Green for comparisons, and Tertiary Orange for thresholds.
- **Grid Lines:** Minimal, using #262626.

### Markdown Editor
The editor uses a monospaced variant of Inter or a system mono font. Headers within the preview use the Space Grotesk hierarchy. Links are styled in Primary Blue with a subtle underline.

### Buttons & Inputs
Buttons use a solid fill for primary actions and a ghost/outline style for secondary. Inputs use #141414 backgrounds with a 1px #262626 border, shifting to a Primary Blue border on focus. All interactive elements follow the 8px corner radius standard.