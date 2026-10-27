# React conventions

Apply these on top of the general rules in `../SKILL.md`. Default to the current React model:
function components, hooks, the compiler, and data-fetching that leans on Suspense.

## State: match the tool to the complexity

Reach for the simplest thing that holds the state correctly, and escalate only when you feel
real pain:

- **`useState` / `useReducer`** for local component state. This is the default — most state is
  local and does not need a library.
- **Zustand** when state is genuinely shared across distant parts of the tree, or the
  transitions are involved enough to be a small state machine. Keep stores small and sliced;
  select narrowly so components only re-render on the slice they read.
- Do not reach for a global store for state that one subtree owns. Global-by-default is how
  apps become impossible to reason about.

```ts
// Local — the default
const [isOpen, setIsOpen] = useState(false)

// Shared / machine-like — Zustand, selected narrowly
const cartItemCount = useCartStore(state => state.items.length)
```

## Validation: Zod

Validate data crossing a trust boundary — API responses, form input, URL params, anything from
outside the component — with **Zod**, and derive the TypeScript type from the schema so the
type and the runtime check can never drift.

```ts
const OrderSchema = z.object({
  id: z.string().uuid(),
  totalAmountCents: z.number().int().nonnegative(),
})
type Order = z.infer<typeof OrderSchema>

const order = OrderSchema.parse(await response.json())
```

## Data fetching: Suspense boundaries

Prefer data fetching that suspends, wrapped in `<Suspense>` boundaries with an
`<ErrorBoundary>` alongside, over manual `isLoading` / `error` flags threaded through
components. The boundary owns the fallback; the component gets to assume its data is present,
which removes a whole class of "render before loaded" bugs.

```tsx
<ErrorBoundary fallback={<OrderLoadError />}>
  <Suspense fallback={<OrderSkeleton />}>
    <OrderDetails orderId={orderId} />
  </Suspense>
</ErrorBoundary>
```

Place boundaries at meaningful UI units, not one giant boundary at the root — that way one slow
or failed section doesn't blank the whole page.

## React Compiler

Assume the **React Compiler** is handling memoization. Do not hand-wrap everything in
`useMemo`, `useCallback`, and `React.memo` — write straightforward components and let the
compiler optimize. Reserve manual memoization for a measured hot path the compiler provably
can't handle, and say why in a comment when you do.

Write components the compiler can analyze: keep them pure during render, don't mutate props or
state in place, and follow the rules of hooks.

## Components and hooks

- Function components only; type props with an explicit `type` (Zod-derived where the data is
  external).
- Keep components focused on rendering and event wiring. Non-trivial logic goes into a custom
  hook (`useCheckout`) or a plain function, so it's testable without rendering.
- Custom hooks own reusable stateful logic; a plain function owns reusable pure logic. Don't
  put pure logic in a hook just to have a hook.
- Compute derived values during render (the compiler makes this cheap) rather than mirroring
  them into state with an effect. `useEffect` is for synchronizing with something *outside*
  React — subscriptions, the DOM, a non-React store — not for reacting to prop changes.

## What to avoid

- Class components, `useEffect` used to derive state from props, and manual memoization by
  reflex.
- `any` — type it, or use `unknown` and narrow with Zod.
- One root-level Suspense/error boundary standing in for real per-section boundaries.
- Global state for something a single subtree owns.
