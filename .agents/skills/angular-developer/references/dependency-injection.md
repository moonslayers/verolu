# Dependency Injection

DI fundamentals, service creation, providers, injection context, and hierarchical injectors.

## Dependency Injection (DI) Fundamentals

Dependency Injection (DI) is a design pattern used to organize and share code across an application by allowing you to "inject" features into different parts. This improves code maintainability, scalability, and testability.

### How DI Works in Angular

There are two primary ways code interacts with Angular's DI system:

1.  **Providing**: Making values (objects, functions, primitives) available to the DI system.
2.  **Injecting**: Asking the DI system for those values.

Angular components, directives, and services automatically participate in DI.

### Services

A **service** is the most common way to share data and functionality across an application. It is a TypeScript class decorated with `@Service()`.

#### Creating a Service

Use the `@Service()` decorator to make the service a singleton available throughout the entire application. This is the recommended approach for most services.

```ts
import {Service} from '@angular/core';

@Service()
export class AnalyticsLogger {
  trackEvent(category: string, value: string) {
    console.log('Analytics event logged:', {category, value});
  }
}
```

Common uses for services include:

- Data clients (API calls)
- State management
- Authentication and authorization
- Logging and error handling
- Utility functions

### Injecting Dependencies

Use Angular's `inject()` function to request dependencies.

#### The `inject()` Function

You can use the `inject()` function to get an instance of a service (or any other provided token).

```ts
import {Component, inject} from '@angular/core';
import {Router} from '@angular/router';
import {AnalyticsLogger} from './analytics-logger.service';

@Component({
  selector: 'app-navbar',
  template: `<a href="#" (click)="navigateToDetail($event)">Detail Page</a>`,
})
export class Navbar {
  // Injecting dependencies using class field initializers
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsLogger);

  navigateToDetail(event: Event) {
    event.preventDefault();
    this.analytics.trackEvent('navigation', '/details');
    this.router.navigate(['/details']);
  }
}
```

#### Where can `inject()` be used? (Injection Context)

You can call `inject()` in an **injection context**. The most common injection contexts are during the construction of a component, directive, or service.

Valid places to call `inject()`:

1.  **Class field initializers** (Recommended)
2.  **Constructor body**
3.  **Route guards and resolvers** (which are executed in an injection context)
4.  **Factory functions** used in providers

```typescript
import {Component, Directive, Service, inject, ElementRef} from '@angular/core';
import {HttpClient} from '@angular/common/http';

// 1. In a Component (Field Initializer & Constructor)
@Component(/* ... */)
export class Example {
  private service1 = inject(MyService); // ✅ Field initializer

  private service2: MyService;
  constructor() {
    this.service2 = inject(MyService); // ✅ Constructor body
  }
}

// 2. In a Directive
@Directive({
  /*...*/
})
export class MyDirective {
  private element = inject(ElementRef); // ✅ Field initializer
}

// 3. In a Service
@Service()
export class MyService {
  private http = inject(HttpClient); // ✅ Field initializer
}

// 4. In a Route Guard (Functional)
export const authGuard = () => {
  const auth = inject(AuthService); // ✅ Route Guard
  return auth.isAuthenticated();
};
```

## Creating and Using Services

Services in Angular are reusable pieces of code that handle data fetching, business logic, or state management that multiple components or other services need to access.

### Creating a Service

You can generate a service using the Angular CLI:

```bash
ng generate service my-data
```

Or you can manually create a TypeScript class and decorate it with `@Service()`. For reactive state management, store data in a private `signal()` and expose it publicly via `.asReadonly()`:

```ts
import {Service, signal} from '@angular/core';

@Service()
export class BasicDataStore {
  private readonly dataSignal = signal<string[]>([]);

  // Expose state as a read-only signal to prevent direct external mutation
  readonly data = this.dataSignal.asReadonly();

  addData(item: string): void {
    this.dataSignal.update((items) => [...items, item]);
  }
}
```

#### The `@Service` decorator

Using `@Service` is the recommended approach for most services. It tells Angular to:

- **Create a single instance (singleton)** for the entire application.
- **Make it available everywhere** automatically, without needing to list it in any `providers` array.
- **Enable tree-shaking**, meaning the service is only included in the final JavaScript bundle if it is actually injected somewhere.

##### The `autoProvided` option

If you don't want to create a singleton of your service, you can set `@Service({autoProvided: false})` and declare the service in a `providers` array.

### Injecting a Service

Once a service is created, you can inject it into components, directives, or other services using the `inject()` function.

#### Injecting into a Component

```ts
import {Component, inject} from '@angular/core';
import {BasicDataStore} from './basic-data-store.service';

@Component({
  selector: 'app-example',
  template: `
    <div>
      <p>Data items: {{ dataStore.data().length }}</p>
      <button (click)="dataStore.addData('New Item')">Add Item</button>
    </div>
  `,
})
export class Example {
  // Inject the service as a class field
  readonly dataStore = inject(BasicDataStore);
}
```

#### Injecting into Another Service

Services can inject other services in the exact same way. Use `computed()` to derive values from injected services reactively:

```ts
import {Service, computed, inject, signal} from '@angular/core';
import {AdvancedDataStore} from './advanced-data-store.service';

@Service()
export class CombinedDataStore {
  // Injecting another service
  private readonly advancedDataStore = inject(AdvancedDataStore);
  private readonly dataSignal = signal<string[]>([]);

  // Combine reactive state from this service and the injected service
  readonly allData = computed(() => [...this.dataSignal(), ...this.advancedDataStore.data()]);
}
```

### Advanced Service Patterns

While `@Service` covers most scenarios, you may sometimes need:

- **Component-specific instances**: If a component needs its own isolated instance of a service, provide it directly in the component's `@Component({ providers: [MyService] })` array and set the `autoProvided: false` option: `@Service({autoProvided: false})`
- **Factory providers**: For dynamic creation.
- **Value providers**: For injecting configuration objects.

## Defining Dependency Providers

Angular offers automatic and manual ways to provide dependencies to its Dependency Injection (DI) system.

### Automatic Provision

The most common way to provide a service is using `providedIn: 'root'` on an `@Injectable()`.

#### InjectionToken

Use `InjectionToken` for non-class dependencies (configuration objects, functions, primitives). An `InjectionToken` can also be automatically provided.

```ts
import {InjectionToken} from '@angular/core';

export interface AppConfig {
  apiUrl: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config', {
  providedIn: 'root',
  factory: () => ({apiUrl: 'https://api.example.com'}),
});
```

### Manual Provision

You use the `providers` array when a service lacks `providedIn`, when you want a new instance for a specific component, or when configuring runtime values.

```ts
@Component({
  providers: [
    // Shorthand for { provide: LocalService, useClass: LocalService }
    LocalService,

    // useClass: Swap implementations
    {provide: Logger, useClass: BetterLogger},

    // useValue: Provide static values
    {provide: API_URL_TOKEN, useValue: 'https://api.example.com'},

    // useFactory: Generate value dynamically
    {
      provide: ApiClient,
      useFactory: (http = inject(HttpClient)) => new ApiClient(http),
    },

    // useExisting: Create an alias
    {provide: OldLogger, useExisting: NewLogger},

    // multi: Provide multiple values for the same token as an array
    {provide: INTERCEPTOR_TOKEN, useClass: AuthInterceptor, multi: true},
  ],
})
export class Example {}
```

### Scopes of Providers

- **Application Bootstrap**: Global singletons. Use for HTTP clients, logging, or app-wide config.
- **Component/Directive**: Isolated instances. Use for component-specific state or forms. Services are destroyed when the component is destroyed.
- **Route**: Feature-specific services loaded only with specific routes.

### Library Pattern: `provide*` functions

Library authors should export functions that return provider arrays to encapsulate configuration:

```ts
export function provideAnalytics(config: AnalyticsConfig): Provider[] {
  return [{provide: ANALYTICS_CONFIG, useValue: config}, AnalyticsService];
}
```

## Injection Context

The `inject()` function can only be used when code is executing within an **injection context**.

### Where is an Injection Context Available?

An injection context is automatically available in:

1. **Field initializers** of classes instantiated by DI (`@Service`, `@Injectable`, `@Component`, `@Directive`, `@Pipe`).
2. **Constructors** of classes instantiated by DI.
3. **Factory functions** specified in `useFactory` or `InjectionToken` configurations.
4. **Functional APIs** executed by Angular (e.g., functional route guards, resolvers, interceptors).

```ts
@Component({...})
export class Example {
  // ✅ Valid: Field initializer
  private router = inject(Router);

  constructor() {
    // ✅ Valid: Constructor
    const http = inject(HttpClient);
  }

  onClick() {
    // ❌ Invalid: Not an injection context
    // const auth = inject(AuthService);
  }
}
```

### `runInInjectionContext`

If you need to run a function within an injection context (often needed for dynamic component creation or testing), use `runInInjectionContext`. This requires access to an existing injector (like `EnvironmentInjector` or `Injector`).

```ts
import {inject, EnvironmentInjector, runInInjectionContext, Service} from '@angular/core';

@Service()
export class MyService {
  private injector = inject(EnvironmentInjector);

  doSomethingDynamic() {
    runInInjectionContext(this.injector, () => {
      // ✅ Now valid to use inject() here
      const router = inject(Router);
    });
  }
}
```

### `assertInInjectionContext`

Use `assertInInjectionContext` in utility functions to guarantee they are called from a valid context. It throws a clear error if not.

```ts
import {assertInInjectionContext, inject, ElementRef} from '@angular/core';

export function injectNativeElement<T extends Element>(): T {
  assertInInjectionContext(injectNativeElement);
  return inject(ElementRef).nativeElement;
}
```

## Hierarchical Injectors

Angular's dependency injection system is hierarchical, meaning services can be scoped to different levels of the application.

### Types of Injector Hierarchies

1. **`EnvironmentInjector` Hierarchy**: Configured via `@Service()`, `@Injectable({ providedIn: 'root' })` or `ApplicationConfig.providers` during bootstrap. These are global singletons.
2. **`ElementInjector` Hierarchy**: Created implicitly at each DOM element. Configured via the `providers` or `viewProviders` array in `@Component()` or `@Directive()`.

### Resolution Rules

When a dependency is requested, Angular resolves it in two phases:

1. It searches up the **`ElementInjector`** tree, starting from the requesting component/directive up to the root element.
2. If not found, it searches the **`EnvironmentInjector`** tree, starting from the closest environment injector up to the root.
3. If still not found, it throws an error (unless marked optional).

### Resolution Modifiers

You can alter how Angular searches for a dependency using the options object in `inject()`:

- **`optional`**: If the dependency isn't found, return `null` instead of throwing an error.
- **`self`**: Only check the current `ElementInjector`. Do not look up the parent tree.
- **`skipSelf`**: Start searching in the parent `ElementInjector`, skipping the current element.
- **`host`**: Stop searching when reaching the host component's view boundary.

```ts
@Component({...})
export class Example {
  // Returns null if not found instead of crashing
  optionalService = inject(MyService, { optional: true });

  // Skips this component's providers, looks at parent
  parentService = inject(ParentService, { skipSelf: true });
}
```

### `providers` vs `viewProviders`

When providing a service at the component level:

- **`providers`**: The service is available to the component, its view (template), and any **projected content** (`<ng-content>`).
- **`viewProviders`**: The service is available to the component and its view, but **NOT** to projected content. Use this to isolate services from content passed in by consumers.
