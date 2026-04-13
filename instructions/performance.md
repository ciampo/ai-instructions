# Performance

How I think about performance. Not premature optimization -- informed awareness of cost.

## Bundle Size

- **[RULE]** Be aware of what you import. Import only what you need and follow the package's documented entrypoints. Avoid pulling in the whole package when it is not tree-shakeable.
- **[STRONG]** Do not add large dependencies without discussing the size trade-off. Check bundle size impact with tools like `bundlephobia` or the project's bundle analyzer.
- **[PREFER]** Favor tree-shakeable libraries. Avoid libraries that require importing the entire package for a single utility.

## Lazy Loading

- **[STRONG]** Code-split routes, heavy components, and non-critical features behind `React.lazy()` / dynamic `import()`.
- **[PREFER]** Defer loading of below-the-fold content, modals, and drawers until needed.
- Load fonts with `font-display: swap` or `optional` to avoid invisible text.

## Rendering

- **[STRONG]** Avoid unnecessary re-renders. Lift state up only as far as needed. Colocate state with the components that use it.
- **[PREFER]** Use `useMemo` and `useCallback` when the computation is genuinely expensive or when a stable reference prevents re-renders in children that rely on referential equality. Do not scatter them everywhere as a reflex.
- Avoid creating new objects, arrays, or functions inline in JSX when they are passed to memoized children.
- **[STRONG]** Virtualize long lists. Do not render hundreds of DOM nodes when only a few are visible.

## CSS Performance

- **[PREFER]** Use `contain` (layout, paint, size) on isolated UI regions to limit browser layout/paint scope.
- Prefer `translate`, `scale`, `opacity` for animations -- these properties can be composited on the GPU without triggering layout.
- Avoid layout thrashing: batch DOM reads and writes. Do not interleave `getBoundingClientRect()` calls with style mutations.

## Images and Assets

- **[STRONG]** Use responsive images (`srcset`, `sizes`) and modern formats (WebP, AVIF) where the platform supports them.
- **[RULE]** Always include `width` and `height` attributes (or aspect-ratio) on images to prevent layout shift.
- **[PREFER]** Lazy-load offscreen images with `loading="lazy"`.

## Measuring

- Profile before optimizing. Use browser DevTools (Performance panel, Lighthouse), React DevTools Profiler, and bundle analyzers.
- Do not optimize based on intuition alone. Measure, identify the bottleneck, fix it, measure again.
