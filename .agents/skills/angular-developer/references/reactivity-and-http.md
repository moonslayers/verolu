# Reactivity and HTTP

Signals, computed, linkedSignal, resource/httpResource, effects, and HttpClient with interceptors.

## Angular Signals Overview

Signals are the foundation of reactivity in modern Angular applications. A **signal** is a wrapper around a value that notifies interested consumers when that value changes.

### Writable Signals (`signal`)

Use `signal()` to create state that can be directly updated.

```ts
import {signal} from '@angular/core';

// Create a writable signal
const count = signal(0);

// Read the value (always requires calling the getter function)
console.log(count());

// Update the value directly
count.set(3);

// Update based on the previous value
count.update((value) => value + 1);
```

#### Exposing as Readonly

When exposing state from a service, it is a best practice to expose a readonly version to prevent external mutation.

```ts
private readonly _count = signal(0);
// Consumers can read this, but cannot call .set() or .update()
readonly count = this._count.asReadonly();
```

### Computed Signals (`computed`)

Use `computed()` to create read-only signals that derive their value from other signals.

- **Lazily Evaluated**: The derivation function doesn't run until the computed signal is read.
- **Memoized**: The result is cached. It only recalculates when one of the signals it depends on changes.
- **Dynamic Dependencies**: Only the signals _actually read_ during the derivation are tracked.

```ts
import {signal, computed} from '@angular/core';

const count = signal(0);
const doubleCount = computed(() => count() * 2);

// doubleCount automatically updates when count changes.
```

### Reactive Contexts

A **reactive context** is a runtime state where Angular monitors signal reads to establish a dependency.

Angular automatically enters a reactive context when evaluating:

- `computed` signals
- `effect` callbacks
- `linkedSignal` computations
- Component templates

#### Untracked Reads (`untracked`)

If you need to read a signal inside a reactive context _without_ creating a dependency (so that the context doesn't re-run when the signal changes), use `untracked()`.

```ts
import {effect, untracked} from '@angular/core';

effect(() => {
  // This effect only runs when currentUser changes.
  // It does NOT run when counter changes, even though counter is read here.
  console.log(`User: ${currentUser()}, Count: ${untracked(counter)}`);
});
```

#### Async Operations in Reactive Contexts

The reactive context is only active for **synchronous** code. Signal reads after an `await` will not be tracked. **Always read signals before asynchronous boundaries.**

```ts
// ❌ INCORRECT: theme() is not tracked because it is read after await
effect(async () => {
  const data = await fetchUserData();
  console.log(theme());
});

// ✅ CORRECT: Read the signal before the await
effect(async () => {
  const currentTheme = theme();
  const data = await fetchUserData();
  console.log(currentTheme);
});
```

## Dependent State with `linkedSignal`

The `linkedSignal` function lets you create writable state that is intrinsically linked to some other state. It is perfect for state that needs a default value derived from an input or another signal, but can still be independently modified by the user.

If the source state changes, the `linkedSignal` resets to a new computed value.

### Basic Usage

When you only need to recompute based on a source, pass a computation function. `linkedSignal` works like `computed`, but the resulting signal is writable (you can call `.set()` or `.update()` on it).

```ts
import { Component, signal, linkedSignal } from '@angular/core';

@Component({...})
export class ShippingMethodPicker {
  protected readonly shippingOptions = signal(['Ground', 'Air', 'Sea']);

  // Defaults to the first option.
  // If shippingOptions changes, selectedOption resets to the new first option.
  protected readonly selectedOption = linkedSignal(() => this.shippingOptions()[0]);

  changeShipping(index: number) {
    // We can still manually update this signal!
    this.selectedOption.set(this.shippingOptions()[index]);
  }
}
```

### Advanced Usage: Accounting for Previous State

Sometimes, when the source state changes, you want to preserve the user's manual selection if it is still valid. To do this, use the object syntax providing `source` and `computation`.

The `computation` function receives the new value of the source, and a `previous` object containing the previous source value and the previous `linkedSignal` value.

```ts
interface ShippingMethod { id: number; name: string; }

@Component({...})
export class ShippingMethodPicker {
  protected readonly shippingOptions = signal<ShippingMethod[]>([
    {id: 0, name: 'Ground'}, {id: 1, name: 'Air'}, {id: 2, name: 'Sea'}
  ]);

  protected readonly selectedOption = linkedSignal<ShippingMethod[], ShippingMethod>({
    source: this.shippingOptions,
    computation: (newOptions, previous) => {
      // If the newly loaded options still contain the user's previously
      // selected option, keep it selected. Otherwise, reset to the first option.
      return newOptions.find(opt => opt.id === previous?.value.id) ?? newOptions[0];
    }
  });
}
```

### Customizing the `set` Operation

By default, calling `.set()` on a `linkedSignal` updates its internal value directly. To write back to the source of truth instead, pass a `set` function in the options. It receives the new value plus a `rawSet` function that applies the default behavior directly (useful to skip the computation when it is expensive and you already know the result).

```ts
const tempC = signal(0);
// tempF.set() writes back to tempC instead of only updating tempF
const tempF = linkedSignal(() => (tempC() * 9) / 5 + 32, {
  set: (valF) => tempC.set(((valF - 32) * 5) / 9),
});

tempF.set(212); // tempC() is now 100, tempF() re-derives to 212
```

#### When to use `linkedSignal` vs `computed` vs `effect`

- Use `computed`: When state is **strictly** derived from other state and should never be manually updated.
- Use `linkedSignal`: When state is derived from other state, but the user **must** be able to override or manually update it.
- **Never** use `effect` to sync one piece of state to another. That is an anti-pattern. Use `computed` or `linkedSignal` instead.

## Async Reactivity with `resource`

A `Resource` incorporates asynchronous data fetching into Angular's signal-based reactivity. It executes an async loader function whenever its dependencies change, exposing the status and result as synchronous signals.

### Basic Usage

The `resource` function accepts an options object with two main properties:

1. `params`: A reactive computation (like `computed`). When signals read here change, the resource re-fetches.
2. `loader`: An async function that fetches data based on the parameters.

```ts
import { Component, resource, signal, computed } from '@angular/core';

@Component({...})
export class UserProfile {
  protected readonly userId = signal('123');

  protected readonly userResource = resource({
    // Reactively tracking userId
    params: () => ({ id: this.userId() }),

    // Executes whenever params change
    loader: async ({ params, abortSignal }) => {
      const response = await fetch(`/api/users/${params.id}`, { signal: abortSignal });
      if (!response.ok) throw new Error('Network error');
      return response.json();
    }
  });

  // Use the resource value in computed signals
  protected readonly userName = computed(() => {
    if (this.userResource.hasValue()) {
      return this.userResource.value()?.name;
    } else if (this.userResource.error()) {
      return 'Failed to load';
    } else {
      return 'Loading...';
    }
  });
}
```

### Aborting Requests

If the `params` signal changes while a previous loader is still running, the `Resource` will attempt to abort the outstanding request using the provided `abortSignal`. **Always pass `abortSignal` to your `fetch` calls.**

### Reloading Data

You can imperatively force the resource to re-run the loader without the params changing by calling `.reload()`.

```ts
this.userResource.reload();
```

### Resource Status Signals

The `Resource` object provides several signals to read its current state:

- `value()`: The resolved data, or `undefined` if there is none yet. **Throws if the resource is in the `'error'` status**, so guard reads with `hasValue()` or check `error()` first.
- `hasValue()`: Type-guard boolean. `true` if a value exists. It is `false` (and does not throw) in the `'error'` status.
- `isLoading()`: Boolean indicating if the loader is currently running (`'loading'` or `'reloading'`).
- `error()`: The error thrown by the loader, or `undefined`.
- `status()`: A string constant representing the exact state (`'idle'`, `'loading'`, `'resolved'`, `'error'`, `'reloading'`, `'local'`).

| `status()`    | `value()`                    | Meaning                                                   |
| ------------- | ---------------------------- | --------------------------------------------------------- |
| `'idle'`      | `undefined`                  | `params` returned `undefined`, so the loader did not run. |
| `'loading'`   | `undefined`                  | The loader is running because `params` changed.           |
| `'reloading'` | the previous value           | The loader is running because of `.reload()`.             |
| `'resolved'`  | the loaded value             | The loader completed.                                     |
| `'error'`     | **throws**                   | The loader threw or rejected.                             |
| `'local'`     | the value passed to `.set()` | The value was set locally.                                |

Do not read `value()` directly in a template or computed signal without a guard, because a failed request would throw there.

### Local Mutation

You can optimistically update the resource's value directly. This changes the status to `'local'`.

```ts
this.userResource.value.set({name: 'Optimistic Update'});
```

### Reactive Data Fetching with `httpResource`

If you are using Angular's `HttpClient`, prefer using `httpResource`. It is a specialized wrapper that leverages the Angular HTTP stack (including interceptors) while providing the same signal-based resource API.

## Side Effects with `effect` and `afterRenderEffect`

In Angular, an **effect** is an operation that runs whenever one or more signal values it tracks change.

### When to use `effect`

Effects are intended for syncing signal state to imperative, non-signal APIs.

**Valid Use Cases:**

- Logging analytics.
- Syncing state to `localStorage` or `sessionStorage`.
- Performing custom rendering to a `<canvas>` or 3rd-party charting library.

**CRITICAL RULE: DO NOT use effects to propagate state.**
If you find yourself using `.set()` or `.update()` on a signal _inside_ an effect to keep two signals in sync, you are making a mistake. This causes `ExpressionChangedAfterItHasBeenChecked` errors and infinite loops. **Always use `computed()` or `linkedSignal()` for state derivation.**

### Basic Usage

Effects execute asynchronously during the change detection process. They always run at least once.

```ts
import { Component, signal, effect } from '@angular/core';

@Component({...})
export class Example {
  protected readonly count = signal(0);

  constructor() {
    // Effect must be created in an injection context (e.g., a constructor)
    effect((onCleanup) => {
      console.log(`Count changed to ${this.count()}`);

      const timer = setTimeout(() => console.log('Timer finished'), 1000);

      // Cleanup function runs before the next execution, or when destroyed
      onCleanup(() => clearTimeout(timer));
    });
  }
}
```

### DOM Manipulation with `afterRenderEffect`

Standard `effect` runs _before_ Angular updates the DOM. If you need to manually inspect or modify the DOM based on a signal change (e.g., integrating a 3rd party UI library), use `afterRenderEffect`.

`afterRenderEffect` runs after Angular has finished rendering the DOM.

#### Render Phases

To prevent reflows (forced layout thrashing), `afterRenderEffect` forces you to divide your DOM reads and writes into specific phases.

```ts
import { Component, afterRenderEffect, viewChild, ElementRef } from '@angular/core';

@Component({...})
export class Chart {
  canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    afterRenderEffect({
      // 1. Read from the DOM
      earlyRead: () => {
        return this.canvas().nativeElement.getBoundingClientRect().width;
      },
      // 2. Write to the DOM (receives the previous phase result as a Signal)
      write: (width) => {
        // NEVER read from the DOM in the write phase.
        setupChart(this.canvas().nativeElement, width());
      }
    });
  }
}
```

**Available Phases (executed in this order):**

1. `earlyRead`
2. `write` (Never read here)
3. `mixedReadWrite` (Avoid if possible)
4. `read` (Never write here)

_Note: `afterRenderEffect` only runs on the client, never during Server-Side Rendering (SSR)._

## HTTP communication with `HttpClient` and `httpResource`

Use Angular's HTTP APIs for backend communication so requests participate in dependency injection, interceptors, transfer cache, and security features.

### Setup

In Angular v21 and later, `HttpClient` is available for injection by default. Add `provideHttpClient(...)` only when an app needs to configure HTTP features for a specific injector:

```ts
import {provideHttpClient, withInterceptors} from '@angular/common/http';

export const appConfig = {
  providers: [provideHttpClient(withInterceptors([authInterceptor]))],
};
```

- `HttpClient` uses the fetch backend by default.
- Use `withXhr()` only when upload progress events are required. Do not use `withXhr()` for server-side rendering.
- Use `provideHttpClient(...)` for feature configuration such as interceptors, XSRF options, XHR, or parent-request delegation.
- Calling `provideHttpClient()` with no features is not required for basic HTTP requests, but it configures the default HTTP feature set for that injector, including Angular's XSRF interceptor.
- Prefer `provideHttpClient(...)` over `HttpClientModule` for feature configuration, especially with multiple injectors.
- Use `withRequestsMadeViaParent()` when a child injector should add interceptors while still delegating to the parent HTTP chain.

### `HttpClient`

Encapsulate backend calls in injectable services, not components:

```ts
import {HttpClient} from '@angular/common/http';
import {Service, inject} from '@angular/core';

@Service()
export class UserService {
  private readonly http = inject(HttpClient);

  getUser(id: string) {
    return this.http.get<User>(`/api/users/${id}`);
  }
}
```

Important rules:

- `HttpClient` requests are cold `Observable`s. No request is sent until the `Observable` is subscribed to. Multiple subscriptions send multiple backend requests.
- Subscribe to mutation requests (`post`, `put`, `patch`, `delete`) so they execute.
- The generic type parameter is a type assertion only. Validate unknown backend data at runtime when the shape is not trusted.
- Use literal values for `responseType` and `observe`; if options are extracted, write values like `responseType: 'text' as const`.
- `HttpHeaders` and `HttpParams` are immutable; use the returned instance from `.set()` or `.append()`.
- Fetch options such as `timeout`, `cache`, `priority`, `mode`, `redirect`, `credentials`, `keepalive`, `referrer`, `referrerPolicy`, and `integrity` are supported where the backend supports them. `withCredentials: true` overrides `credentials`.
- Handle failures through `HttpErrorResponse`. Network and timeout failures use status `0`; backend failures use the server status code.
- Prefer the `async` pipe or `toSignal` for component reads so subscriptions are cleaned up.

### Interceptors

Prefer functional interceptors configured with `withInterceptors`.

```ts
import {
  HttpHandlerFn,
  HttpRequest,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  return next(req.clone({setHeaders: {Authorization: 'Bearer token'}}));
}

export const appConfig = {
  providers: [provideHttpClient(withInterceptors([authInterceptor]))],
};
```

- Interceptors run in the order listed.
- Request and response objects are mostly immutable; clone before changing them.
- Request and response bodies are not deeply immutable. Avoid in-place body mutation because retries can run the same interceptor again.
- Use `inject()` inside functional interceptors for services.
- Use `HttpContextToken` for per-request metadata that interceptors need but the backend should not receive.
- Use DI-based interceptors only for existing code, and enable them with `withInterceptorsFromDi()`.

### Security

- `HttpClient` strips the XSSI prefix from JSON responses when present.
- `provideHttpClient()` configures XSRF protection by default for mutating relative and same-origin requests. It reads the `XSRF-TOKEN` cookie and sends the `X-XSRF-TOKEN` header.
- The backend must set the XSRF cookie and verify the header. Customize names with `withXsrfConfiguration(...)`; disable only deliberately with `withNoXsrfProtection()`.

### `httpResource`

Use `httpResource` to create an asynchronous derivation that fetches data over HTTP and exposes the result as reactive signals.

```ts
import {httpResource} from '@angular/common/http';
import {input} from '@angular/core';

export class UserProfile {
  readonly userId = input.required<string>();
  readonly user = httpResource(() => `/api/users/${this.userId()}`);
}
```

- `httpResource` is eager. It sends a request when its reactive request computation runs, not when an `Observable` is subscribed.
- When a dependency changes, it cancels the pending request and sends the next one.
- Return `undefined` from the request function to skip a backend request.
- Prefer `httpResource` for reads. Use `HttpClient` directly for mutations such as `POST`, `PUT`, `PATCH`, and `DELETE`.
- Guard `value()` reads with `hasValue()`; reading `value()` while the resource is in an error state throws.
- Use `httpResource.text`, `httpResource.blob`, or `httpResource.arrayBuffer` for non-JSON responses.
- Use the `parse` option to validate or transform responses with a runtime schema.
- Read `headers()`, `statusCode()`, and `progress()` when response metadata or download progress is needed. Set `reportProgress: true` for progress events.
