# Angular conventions

Apply these on top of the general rules in `../SKILL.md`. Angular moves fast; the point of
this file is to keep us on the modern APIs and off the deprecated ones. Default to the latest
stable features and conventions, and prefer the framework's own idioms over hand-rolled
alternatives.

## Reactivity: signals first

Model component state with **signals**, not mutable fields or `BehaviorSubject` where a signal
fits. Signals are the framework's primary reactivity primitive now and integrate with change
detection directly.

- `signal()` for writable state, `computed()` for derived state, `effect()` only for genuine
  side effects (never to sync one signal into another — that's `computed`).
- Prefer `input()` / `output()` signal APIs over the `@Input()` / `@Output()` decorators.
- Use `model()` for two-way bindable state.
- Reach for RxJS where it earns its place — real async streams, debouncing, cancellation — and
  bridge with `toSignal()` / `toObservable()` rather than manual `subscribe` in components.

```ts
// Prefer
readonly quantity = signal(1)
readonly totalPrice = computed(() => this.quantity() * this.unitPrice())

// Over
quantity = 1
get totalPrice() { return this.quantity * this.unitPrice }
```

## Zoneless

Write components so they work **zoneless** — do not rely on Zone.js to trigger change
detection. Signals and the modern APIs are what notify the framework, so keep state in signals
and avoid patterns that assume Zone monkey-patching (e.g. expecting a bare mutated field to
re-render).

## Control flow, not structural directives

Use the built-in block control flow (`@if`, `@for`, `@switch`) in templates, not the legacy
`*ngIf` / `*ngFor` / `*ngSwitch` structural directives. It's faster, type-checked, and
requires no imports. Always give `@for` a `track` expression.

```html
<!-- Prefer -->
@if (user(); as currentUser) {
  <app-profile [user]="currentUser" />
} @else {
  <app-empty-state />
}
@for (order of orders(); track order.id) {
  <app-order-row [order]="order" />
}

<!-- Over -->
<app-profile *ngIf="user as currentUser" [user]="currentUser"></app-profile>
<app-order-row *ngFor="let order of orders" [order]="order"></app-order-row>
```

## Dependency injection: inject()

Use the `inject()` function, not constructor parameter injection. It reads more clearly, works
in functions and field initializers, and composes with inheritance without threading
`super()` calls.

```ts
// Prefer
export class CheckoutComponent {
  private readonly cartService = inject(CartService)
  private readonly router = inject(Router)
}

// Over
export class CheckoutComponent {
  constructor(private cartService: CartService, private router: Router) {}
}
```

## Components

- **Standalone components** are the default — no `NgModule` scaffolding.
- Set `changeDetection: ChangeDetectionStrategy.OnPush` on every component; with signals it's
  the correct and performant default.
- Keep templates dumb: no business logic in the template or the component class beyond wiring
  state to view and events to services. The real work belongs in a `core/` or feature service.
- Prefer the `class` and `style` bindings and the modern `@let` for template-local values over
  cramming expressions into the markup.

## Routing and data

- Lazy-load feature routes with `loadComponent` / `loadChildren`.
- Prefer functional route guards and functional HTTP interceptors over class-based ones.
- Use `HttpClient` through a feature or core service; components consume the service, never
  `HttpClient` directly.

## What to avoid

- `*ngIf` / `*ngFor` / `*ngSwitch`, constructor injection, `NgModule` for new code.
- `any` — type it, or use `unknown` and narrow.
- Manual `subscribe` in components without teardown; prefer `toSignal()` or the `async` pipe.
- Logic in templates that should be a `computed()`.
