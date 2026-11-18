# Routing

Route definitions, loading strategies, outlets, navigation, guards, resolvers, and router lifecycle.

## Define Routes

Routes are objects that define which component should render for a specific URL path.

### Basic Configuration

Define routes in a `Routes` array and provide them using `provideRouter` in your `appConfig`.

```ts
// app.routes.ts
export const routes: Routes = [
  {path: '', component: HomePage},
  {path: 'admin', component: AdminPage},
];

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)],
};
```

### URL Paths

- **Static**: Matches an exact string (e.g., `'admin'`).
- **Route Parameters**: Dynamic segments prefixed with a colon (e.g., `'user/:id'`).
- **Wildcard**: Matches any URL using `**`. Useful for "Not Found" pages. **Always place at the end of the array.**

### Matching Strategy

Angular uses a **first-match wins** strategy. Specific routes must come before less specific ones.

### Redirects

Use `redirectTo` to point one path to another.

```ts
{ path: 'articles', redirectTo: '/blog' },
{ path: 'blog', component: Blog },
```

#### Conditional Redirects

Pass a function to `redirectTo` to apply logic when redirecting.

```ts
{
  path: 'restaurant/:location/menu',
  redirectTo: ({ params }) => {
    const base = `/restaurant/${params['location']}/menu`;
    const hour = new Date().getHours();

    if (hour < 11) return `${base}/breakfast`;
    if (hour < 17) return `${base}/lunch`;
    return `${base}/dinner`;
  },
},
```

### Page Titles

Associate titles with routes for accessibility. Titles can be static or dynamic (via `ResolveFn` or a custom `TitleStrategy`).

```ts
{ path: 'home', component: Home, title: 'Home Page' }
```

### Route Data and Providers

- **Static Data**: Attach metadata using the `data` property.
- **Route Providers**: Scope dependencies to a specific route and its children using the `providers` array.

### Nested (Child) Routes

Define sub-views using the `children` property. Parent components must include a `<router-outlet />`.

```ts
{
  path: 'product/:id',
  component: Product,
  children: [
    { path: 'info', component: ProductInfo },
    { path: 'reviews', component: ProductReviews },
  ],
}
```

## Route Loading Strategies

Angular supports two main strategies for loading routes and components to balance initial load time and navigation responsiveness.

### Eager Loading

Components are bundled into the initial JavaScript payload and are available immediately.

```ts
{ path: 'home', component: Home }
```

- **Pros**: Seamless transitions.
- **Cons**: Increases initial bundle size.

### Lazy Loading

Components or routes are loaded only when the user navigates to them. This creates separate JavaScript "chunks".

#### Lazy Loading Components

Use `loadComponent` to fetch the component on demand.

```ts
{
  path: 'admin',
  loadComponent: () => import('./admin').then(m => m.Admin),
}
```

#### Lazy Loading Child Routes

Use `loadChildren` to fetch a set of routes.

```ts
{
  path: 'settings',
  loadChildren: () => import('./settings/settings.routes'),
}
```

Return the `import()` promise directly only when the loaded file uses a `default` export.

### Injection Context and Lazy Loading

Loader functions run within the **injection context** of the current route. This allows you to call `inject()` to make context-aware loading decisions.

```ts
{
  path: 'dashboard',
  loadComponent: () => {
    const flags = inject(FeatureFlags);
    return flags.isPremium
      ? import('./premium-dashboard')
      : import('./basic-dashboard');
  },
}
```

### Recommendation

- Use **Eager Loading** for the primary landing pages.
- Use **Lazy Loading** for all other feature areas to keep the initial bundle small.

## Show Routes with Outlets

The `RouterOutlet` directive is a placeholder where Angular renders the component for the current URL.

### Basic Usage

Include `<router-outlet />` in your template. Angular inserts the routed component as a sibling immediately following the outlet.

```html
<app-header /> <router-outlet />
<!-- Route content appears here -->
<app-footer />
```

### Nested Outlets

Child routes require their own `<router-outlet />` within the parent component's template.

```ts
// Parent component template
<h1>Settings</h1>
<router-outlet /> <!-- Child components like Profile or Security render here -->
```

### Named Outlets (Secondary Routes)

Pages can have multiple outlets. Assign a `name` to an outlet to target it specifically. The default name is `'primary'`.

```html
<router-outlet />
<!-- Primary -->
<router-outlet name="sidebar" />
<!-- Secondary -->
```

Define the `outlet` in the route config:

```ts
{
  path: 'chat',
  component: Chat,
  outlet: 'sidebar'
}
```

### Outlet Lifecycle Events

`RouterOutlet` emits events when components are changed:

- `activate`: New component instantiated.
- `deactivate`: Component destroyed.
- `attach` / `detach`: Used with `RouteReuseStrategy`.

```html
<router-outlet (activate)="onActivate($event)" />
```

### Passing Data via `routerOutletData`

You can pass contextual data to the routed component using the `routerOutletData` input. The component accesses this via the `ROUTER_OUTLET_DATA` injection token as a signal.

```ts
// In Parent
<router-outlet [routerOutletData]="{ theme: 'dark' }" />

// In Routed Component
outletData = inject(ROUTER_OUTLET_DATA) as Signal<{ theme: string }>;
```

## Navigate to Routes

Angular provides both declarative and programmatic ways to navigate between routes.

### Declarative Navigation (`RouterLink`)

Use the `RouterLink` directive on anchor elements.

```ts
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav>
      <a routerLink="/dashboard" routerLinkActive="active-link">Dashboard</a>
      <a [routerLink]="['/user', userId]">Profile</a>
    </nav>
  `,
})
export class Nav {
  userId = '123';
}
```

- **Absolute Paths**: Start with `/` (e.g., `/settings`).
- **Relative Paths**: No leading `/`. Use `../` to go up a level.

### Programmatic Navigation (`Router`)

Inject the `Router` service to navigate via TypeScript code.

#### `router.navigate()`

Uses an array of commands.

```ts
private router = inject(Router);
private route = inject(ActivatedRoute);

// Standard navigation
this.router.navigate(['/profile']);

// With parameters
this.router.navigate(['/search'], {
  queryParams: { q: 'angular' },
  fragment: 'results'
});

// Relative navigation
this.router.navigate(['edit'], { relativeTo: this.route });
```

#### `router.navigateByUrl()`

Uses a string path. Ideal for absolute navigation or full URLs.

```ts
this.router.navigateByUrl('/products/123?view=details');

// Replace current entry in history
this.router.navigateByUrl('/login', {replaceUrl: true});
```

### URL Parameters

- **Route Params**: Part of the path (e.g., `/user/123`).
- **Query Params**: After the `?` (e.g., `/search?q=query`).
- **Matrix Params**: Scoped to a segment (e.g., `/products;category=books`).

## Route Guards

Route guards control whether a user can navigate to or leave a route.

### Types of Guards

- **`CanActivate`**: Can the user access this route? (e.g., Auth check).
- **`CanActivateChild`**: Can the user access children of this route?
- **`CanDeactivate`**: Can the user leave this route? (e.g., Unsaved changes).
- **`CanMatch`**: Should this route even be considered for matching? (e.g., Feature flags). If it returns `false`, the router continues checking other routes.

### Creating a Guard

Guards are typically functional since Angular 15.

```ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Redirect to login
  return router.parseUrl('/login');
};
```

### Applying Guards

Add them to the route configuration as an array. Asynchronous guards (returning a `Promise` or `Observable`) in the same array start together and run concurrently; the router does not wait for one to finish before starting the next. Array order only sets priority: if any guard does not return `true`, the result of the first such guard in the array is used. Do not make a guard depend on work done by an earlier guard in the same array (for example, loading the current user); share that work through a service or combine the checks into one guard.

```ts
{
  path: 'admin',
  component: Admin,
  canActivate: [authGuard],
  canActivateChild: [adminChildGuard],
  canDeactivate: [unsavedChangesGuard]
}
```

### Return Values

- `boolean`: `true` to allow, `false` to block.
- `UrlTree` or `RedirectCommand`: Redirect to a different route.
- `Observable` or `Promise`: Resolves to the above types.

### Security Note

**Client-side guards are NOT a substitute for server-side security.** Always verify permissions on the server.

## Data Resolvers

Data resolvers fetch data before a route activates, ensuring components have the necessary data upon rendering.

### Creating a Resolver

Implement the `ResolveFn` type.

```ts
export const userResolver: ResolveFn<User> = (route, state) => {
  const userService = inject(UserService);
  const id = route.paramMap.get('id')!;
  return userService.getUser(id);
};
```

### Configuring the Route

Add the resolver under the `resolve` key.

```ts
{
  path: 'user/:id',
  component: UserProfile,
  resolve: {
    user: userResolver
  }
}
```

### Accessing Resolved Data

#### 1. Via `ActivatedRoute` (Traditional)

```ts
private readonly route = inject(ActivatedRoute);
protected readonly data = toSignal(this.route.data, {requireSync: true});
protected readonly user = computed(() => this.data().user);
```

#### 2. Via Component Inputs (Modern)

Enable `withComponentInputBinding()` in `provideRouter` to pass resolved data directly to `@Input` or `input()`.

```ts
// app.config.ts
provideRouter(routes, withComponentInputBinding());

// component.ts
user = input.required<User>();
```

### Error Handling

Navigation is blocked if a resolver fails.

- Use `withNavigationErrorHandler` for global handling.
- Use `catchError` within the resolver to return a `RedirectCommand` or fallback data.

```ts
return userService
  .get(id)
  .pipe(catchError(() => of(new RedirectCommand(router.parseUrl('/error')))));
```

### Best Practices

- **Keep it lightweight**: Fetch only critical data.
- **Provide feedback**: Listen to router events to show a global loading bar during navigation, as the UI stays on the old page until the resolver finishes.

## Router Lifecycle and Events

Angular Router emits events through the `Router.events` observable, allowing you to track the navigation lifecycle from start to finish.

### Common Router Events (Chronological)

1. **`NavigationStart`**: Navigation begins.
2. **`RoutesRecognized`**: Router matches the URL to a route.
3. **`GuardsCheckStart` / `End`**: Evaluation of `canActivate`, `canMatch`, etc.
4. **`ResolveStart` / `End`**: Data resolution phase (fetching data via resolvers).
5. **`NavigationEnd`**: Navigation completed successfully.
6. **`NavigationCancel`**: Navigation canceled (e.g., guard returned `false`).
7. **`NavigationError`**: Navigation failed (e.g., error in resolver).

### Subscribing to Events

Inject the `Router` and filter the `events` observable.

```ts
import {Router, NavigationStart, NavigationEnd} from '@angular/router';

export class MyService {
  private router = inject(Router);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((event) => {
      console.log('Navigated to:', event.url);
    });
  }
}
```

### Debugging

Enable detailed console logging of all routing events during application bootstrap.

```ts
provideRouter(routes, withDebugTracing());
```

### Common Use Cases

- **Loading Indicators**: Show a spinner when `NavigationStart` fires and hide it on `NavigationEnd`/`Cancel`/`Error`.
- **Analytics**: Track page views by listening for `NavigationEnd`.
- **Scroll Management**: Respond to `Scroll` events for custom scroll behavior.
