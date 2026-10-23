# MINMEG Component Specifications

Full specs: the `components:` block in design.md. Each component is built once in `src/components/ui` of each app and reused.

- button-primary: `#1e8742`, white text, Euclid Circular A 14px semibold, pill, 44px tall; hover `#196f37`, pressed `#145a2c`
- button-secondary: white, 1px `#c1ccd6` border, ink text, pill
- button-danger: `#d92d20`, white text, pill
- text-input: 44px, 8px radius, 1px `#c1ccd6`; focus 2px `#1e8742`; error 2px `#d92d20` + message below
- card: white, 1px `#e1e5e8`, 12px radius, no shadow
- sidebar: `#0a1f1a`, 264px (72px collapsed); active item `#1e8742` with white text
- top-bar: white, 64px, bottom hairline
- modal / side sheet: white on `rgba(10, 31, 26, 0.7)` overlay, no shadow
- toast / tooltip: `#0a1f1a`, white text
- badges: success `#e6f4ea`/`#145a2c`, neutral, warning `#fff8e0`/`#7a5a2f`, error `#fef3f2`/`#b42318`
- table: hairline border, surface header, rows ≥ 44px; rows become cards below 768px
