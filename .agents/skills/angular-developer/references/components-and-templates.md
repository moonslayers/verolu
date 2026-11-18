# Components, Templates and Pipes

Component anatomy, inputs/outputs, host elements, queries and content projection, deferrable views, pipes, and naming conventions.

## Components

Angular components are the fundamental building blocks of an application. Each component consists of a TypeScript class with behaviors, an HTML template, and a CSS selector.

### Component Definition

Use the `@Component` decorator to define a component's metadata.

```ts
@Component({
  selector: 'app-profile',
  template: `
    <img src="profile.jpg" alt="Profile photo" />
    <button (click)="save()">Save</button>
  `,
  styles: `
    img {
      border-radius: 50%;
    }
  `,
})
export class Profile {
  save() {
    /* ... */
  }
}
```

### Metadata Options

- `selector`: The CSS selector that identifies this component in templates.
- `template`: Inline HTML template (preferred for small templates).
- `templateUrl`: Path to an external HTML file.
- `styles`: Inline CSS styles.
- `styleUrl` / `styleUrls`: Path(s) to external CSS file(s).
- `imports`: Lists the components, directives, or pipes used in this component's template.

### Using Components

To use a component, add it to the `imports` array of the consuming component and use its selector in the template.

```ts
@Component({
  selector: 'app-root',
  imports: [Profile],
  template: `<app-profile />`,
})
export class App {}
```

#### Self-Closing Tags

Angular supports self-closing tags for custom components.

**Rule:** Always use self-closing tags when a component does not contain projected content or child nodes:

```html
<!-- Preferred: concise and modern -->
<app-profile />
<app-user-card [user]="currentUser()" />
<router-outlet />

<!-- Avoid: redundant closing tags for empty elements -->
<app-profile></app-profile>
<app-user-card [user]="currentUser()"></app-user-card>
<router-outlet></router-outlet>
```

### Template Control Flow

Angular uses built-in blocks for conditional rendering and loops.

#### Conditional Rendering (`@if`)

Use `@if` to conditionally show content. You can include `@else if` and `@else` blocks.

```html
@if (user.isAdmin) {
<admin-dashboard />
} @else if (user.isModerator) {
<mod-dashboard />
} @else {
<standard-dashboard />
}
```

**Result aliasing**: Save the result of the expression for reuse.

```html
@if (user.settings(); as settings) {
<p>Theme: {{ settings.theme }}</p>
}
```

#### Loops (`@for`)

The `@for` block iterates over collections. The `track` expression is **required** for performance and DOM reuse.

```html
<ul>
  @for (item of items(); track item.id; let i = $index, total = $count) {
  <li>{{ i + 1 }}/{{ total }}: {{ item.name }}</li>
  } @empty {
  <li>No items to display.</li>
  }
</ul>
```

**Implicit Variables**: `$index`, `$count`, `$first`, `$last`, `$even`, `$odd`.

#### Switching Content (`@switch`)

The `@switch` block renders content based on a value. It uses strict equality (`===`) and has **no fallthrough**.

```html
@switch (status()) { @case ('loading') { <app-spinner /> } @case ('error') { <app-error-msg /> }
@case ('success') { <app-data-grid /> } @default {
<p>Unknown status</p>
} }
```

**Multiple Cases**: Stack consecutive `@case` statements with no content between them to share one
block across several matches.

```angular-html
@switch (status()) {
  @case ('paused')
  @case ('cancelled') {
    <span>Not running</span>
  }
  @default {
    <span>Running</span>
  }
}
```

**Exhaustive Type Checking**: Use `@default never;` to ensure all cases of a union type are handled.

```html
@switch (state) { @case ('on') { ... } @case ('off') { ... } @default never; // Errors if a new
state like 'standby' is added }
```

#### Arrow Functions in Template Expressions

Template expressions support arrow functions with an expression body, such as inline array
callbacks:

```html
<button (click)="count.update((c) => c + 1)">Increment</button>
```

For derived values such as a filtered list, use a `computed` signal in the component instead.

Arrow functions must have an expression body, such as `(c) => c + 1`. In event bindings, call the
method directly, `(click)="save()"`, because an arrow function like `(click)="() => save()"` is
never invoked.

Arrow functions with a block body (`() => { ... }`) are not supported. A pipe cannot be used
inside an arrow function's body, but an arrow function can be passed as an argument to a pipe.

### Core Concepts

- **Host Element**: The DOM element that matches the component's selector.
- **View**: The DOM rendered by the component's template inside the host element.
- **Standalone**: By default, components are standalone (since Angular 19, `standalone: true` is default). For older versions, `standalone: true` must be explicit or the component must be part of an `NgModule`.
- **Component Tree**: Angular applications are structured as a tree of components, where each component can host child components.
- **Component Naming**: Do not add suffixes the `Component` suffix for Component classes (e.g., AppComponent) unless the project has been configured to use that naming configuration.

## Inputs

Inputs allow data to flow from a parent component to a child component. Angular recommends using the signal-based `input` API for modern applications.

### Signal-based Inputs

Declare inputs using the `input()` function. This returns an `InputSignal`.

```ts
import {Component, input, computed} from '@angular/core';

@Component({
  selector: 'app-user',
  template: `<p>{{ label() }} ({{ age() }})</p>`,
})
export class User {
  // Optional input with default value
  readonly name = input('Guest');

  // Required input
  readonly age = input.required<number>();

  // Inputs are reactive signals
  protected readonly label = computed(() => `Name: ${this.name()}`);
}
```

#### Usage in Template

```html
<app-user [name]="userName" [age]="25" />
```

### Configuration Options

The `input` function accepts a config object:

- **Alias**: Change the property name used in templates.
- **Transform**: Modify the value before it reaches the component.

```ts
import { input, booleanAttribute } from '@angular/core';

@Component({...})
export class CustomButton {
  // Alias example
  readonly label = input('', { alias: 'btnLabel' });

  // Transform example using built-in helper
  readonly disabled = input(false, { transform: booleanAttribute });
}
```

### Model Inputs (Two-Way Binding)

Use `model()` to create an input that supports two-way data binding.

```ts
@Component({
  selector: 'custom-counter',
  template: `<button (click)="increment()">+</button>`,
})
export class CustomCounter {
  readonly value = model(0);

  increment() {
    this.value.update((v) => v + 1);
  }
}
```

#### Usage

```html
<!-- Two-way binding with a signal -->
<custom-counter [(value)]="mySignal" />

<!-- Two-way binding with a plain property -->
<custom-counter [(value)]="myProperty" />
```

### Decorator-based Inputs (@Input)

The legacy API remains supported but is not recommended for new code.

```ts
import { Component, Input } from '@angular/core';

@Component({...})
export class Legacy {
  @Input({ required: true }) value = 0;
  @Input({ transform: trimString }) label = '';
}
```

### Best Practices

- **Prefer Signals**: Use `input()` instead of `@Input()` for better reactivity and type safety.
- **Required Inputs**: Use `input.required()` for mandatory data to get build-time errors.
- **Pure Transforms**: Ensure input transform functions are pure and statically analyzable.
- **Avoid Collisions**: Do not use input names that collide with standard DOM properties (e.g., `id`, `title`).

## Outputs (Custom Events)

Outputs allow a child component to emit custom events that a parent component can listen to. Angular recommends using the new `output()` function for modern applications.

### Function-based outputs

Declare outputs using the `output()` function. This returns an `OutputEmitterRef`.

```ts
import {Component, output} from '@angular/core';

@Component({
  selector: 'custom-slider',
  template: `<button (click)="changeValue(50)">Set to 50</button>`,
})
export class CustomSlider {
  // Output without event data
  readonly panelClosed = output<void>();

  // Output with event data (number)
  readonly valueChanged = output<number>();

  changeValue(newValue: number) {
    this.valueChanged.emit(newValue);
  }
}
```

#### Usage in Template

Bind to the output event using parentheses `()`. If the event emits data, access it using the special `$event` variable.

```html
<custom-slider (panelClosed)="savePanelState()" (valueChanged)="logValue($event)" />
```

### Configuration Options

The `output` function accepts a config object to specify an alias.

```ts
@Component({...})
export class CustomSlider {
  // The event is named 'valueChanged' in the template,
  // but accessed as 'changed' in the component class.
  readonly changed = output<number>({ alias: 'valueChanged' });
}
```

### Programmatic Subscription

When creating components dynamically, you can subscribe to outputs programmatically:

```ts
const componentRef = viewContainerRef.createComponent(CustomSlider);

const subscription = componentRef.instance.valueChanged.subscribe((val) => {
  console.log('Value changed:', val);
});

// Clean up manually if needed (Angular cleans up destroyed components automatically)
subscription.unsubscribe();
```

### Decorator-based Outputs (@Output)

The legacy API uses the `@Output()` decorator with an `EventEmitter`. It remains supported but is not recommended for new code.

```ts
import { Component, Output, EventEmitter } from '@angular/core';

@Component({...})
export class LegacyExample {
  @Output() readonly valueChanged = new EventEmitter<number>();

  // With alias
  @Output('customEventName') readonly changed = new EventEmitter<void>();
}
```

### Best Practices

- **Prefer `output()`**: Use the function-based `output()` instead of `@Output()` and `EventEmitter`.
- **Naming**: Use `camelCase` for output names. Avoid prefixing with `on` (e.g., use `valueChanged` instead of `onValueChanged`).
- **No DOM Bubbling**: Angular custom events do not bubble up the DOM tree like native events.
- **Avoid Collisions**: Do not choose names that collide with native DOM events (like `click` or `submit`).

## Component Host Elements

The **host element** is the DOM element that matches a component's selector. The component's template renders inside this element.

### Binding to the Host Element

Use the `host` property in the `@Component` decorator to bind properties, attributes, styles, and events to the host element. This is the **preferred approach** over legacy decorators.

```ts
@Component({
  selector: 'custom-slider',
  host: {
    'role': 'slider', // Static attribute
    '[attr.aria-valuenow]': 'value', // Attribute binding
    '[class.active]': 'isActive()', // Class binding
    '[style.color]': 'color()', // Style binding
    '[tabIndex]': 'disabled ? -1 : 0', // Property binding
    '(keydown)': 'onKeyDown($event)', // Event binding
  },
})
export class CustomSlider {
  protected readonly value = 0;
  protected readonly disabled = false;
  protected readonly isActive = signal(false);
  protected readonly color = signal('blue');

  onKeyDown(event: KeyboardEvent) {
    /* ... */
  }
}
```

### Legacy Decorators

`@HostBinding` and `@HostListener` are supported for backwards compatibility but should be avoided in new code.

```ts
export class CustomSlider {
  @HostBinding('tabIndex')
  get tabIndex() {
    return this.disabled ? -1 : 0;
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    /* ... */
  }
}
```

### Binding Collisions

If both the component (host binding) and the consumer (template binding) bind to the same property:

1. **Static vs Static**: The instance (consumer) binding wins.
2. **Static vs Dynamic**: The dynamic binding wins.
3. **Dynamic vs Dynamic**: The component's host binding wins.

### Injecting Host Attributes

Use `HostAttributeToken` with the `inject` function to read static attributes from the host element at construction time.

```ts
import {Component, HostAttributeToken, inject} from '@angular/core';

@Component({
  selector: 'app-btn',
  template: `<ng-content />`,
})
export class AppButton {
  // Throws error if 'type' is missing unless injected with { optional: true }
  type = inject(new HostAttributeToken('type'));
}
```

Usage:

```html
<app-btn type="primary">Click Me</app-btn>
```

## Queries and content projection

Queries give a component access to elements, directives and components in its template or in its projected content. Content projection lets a parent insert markup into slots of a child component.

### View queries (`viewChild`, `viewChildren`)

View queries search the component's **own template**. They return readonly signals.

#### Querying a single element or component (`viewChild`)

Use `viewChild` to find the first match. You can query by a template reference variable (string), a component or directive class, or an `InjectionToken`.

```ts
import {Component, ElementRef, viewChild} from '@angular/core';

@Component({
  selector: 'app-search-field',
  template: `<input #inputField type="text" />`,
})
export class SearchField {
  readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputField');

  focusInput() {
    // The value is undefined until the view has been created
    this.inputEl()?.nativeElement.focus();
  }
}
```

- **Querying by class**: The type is inferred from the class.
  ```ts
  readonly datePicker = viewChild(DatePicker); // Signal<DatePicker | undefined>
  ```
- **Querying by string**: TypeScript cannot infer the type of the matched element. Pass a generic (`viewChild<ElementRef<HTMLInputElement>>('inputField')`) or let the `read` option set the type (see below).
- **Required queries**: `viewChild.required` returns a signal without `undefined` in its type. Reading it before a result exists throws `NG0951: Child query result is required but no value is available`. This happens when it is read in the constructor, or when the matched element sits inside an `@if` whose condition is false. Only use `.required` for elements that are always rendered.
  ```ts
  readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputField');
  ```

#### Reading a different token (`read`)

Use the `read` option to get something other than the default result from the matched element, such as its `ElementRef`, a directive on it, or the `TemplateRef` of an `<ng-template>`.

```ts
import {Component, ElementRef, TemplateRef, viewChild} from '@angular/core';
import {DatePicker} from './date-picker';

@Component({
  selector: 'app-empty-state',
  imports: [DatePicker],
  template: `
    <app-date-picker />
    <ng-template #emptyTemplate>
      <p>No results</p>
    </ng-template>
  `,
})
export class EmptyState {
  readonly datePickerEl = viewChild(DatePicker, {read: ElementRef});
  // No generic needed: the type comes from `read`
  readonly template = viewChild.required('emptyTemplate', {read: TemplateRef});
}
```

#### Querying multiple results (`viewChildren`)

`viewChildren` returns a signal of a readonly array (`Signal<readonly T[]>`).

```ts
import {Component, computed, input, viewChildren} from '@angular/core';
import {Avatar} from './avatar';
import {User} from './user.model';

@Component({
  selector: 'app-user-list',
  imports: [Avatar],
  template: `
    @for (user of users(); track user.id) {
      <app-avatar [user]="user" />
    }
  `,
})
export class UserList {
  readonly users = input.required<User[]>();
  readonly avatars = viewChildren(Avatar);
  readonly avatarCount = computed(() => this.avatars().length);
}
```

#### When query results update

Query results update when Angular creates or destroys views, for example when an `@if` condition changes or `@for` items are added or removed. Nodes added outside Angular templates (`Renderer2`, `innerHTML`, third-party libraries) are never matched.

---

### Content queries (`contentChild`, `contentChildren`)

Content queries search the content that a parent **projects** into the component. Use them when consumers provide the children, as in a tab group. A view query would not find projected children.

```ts
import {Component, computed, contentChildren} from '@angular/core';
import {Tab} from './tab';

@Component({
  selector: 'app-tab-group',
  template: `
    <div role="tablist">
      @for (title of tabTitles(); track $index) {
        <button role="tab">{{ title }}</button>
      }
    </div>
    <ng-content />
  `,
})
export class TabGroup {
  // Tab declares `readonly title = input.required<string>()`
  readonly tabs = contentChildren(Tab);
  readonly tabTitles = computed(() => this.tabs().map((tab) => tab.title()));
}
```

Usage (the consumer imports both `TabGroup` and `Tab`):

```html
<app-tab-group>
  <app-tab title="Profile">...</app-tab>
  <app-tab title="Settings">...</app-tab>
</app-tab-group>
```

- **String locators**: The template reference variable must be on the projected content, in the parent's template, not in the component's own template. For example, `contentChild<ElementRef>('panelHeader')` in a panel component matches `<app-panel><h2 #panelHeader>Title</h2></app-panel>`.
- **`descendants` option**: `contentChild` searches all projected content by default. `contentChildren` only matches direct children of the component's host element in the projected content. Pass `{descendants: true}` to also match items nested inside other elements.
  ```ts
  readonly items = contentChildren(MenuItem, {descendants: true});
  ```
- Content queries support `.required` and the `read` option like view queries. The same `NG0951` caveat applies: projected content inside a parent's `@if` may be absent.

---

### Content projection

#### Single-slot projection

A self-closing `<ng-content />` projects all children into one location.

```html
<!-- app-button template -->
<button class="btn">
  <ng-content />
</button>
```

```html
<app-button>Click Me!</app-button>
```

#### Multi-slot projection

The `select` attribute of `<ng-content>` takes a CSS selector. Prefer attribute selectors (e.g. `[layout-header]`) for slots. An unknown custom element such as `<layout-header>` fails template compilation with a "not a known element" error, unless it is a real component or the parent declares `CUSTOM_ELEMENTS_SCHEMA`.

```html
<!-- app-layout template -->
<header>
  <ng-content select="[layout-header]" />
</header>
<main>
  <ng-content />
</main>
<footer>
  <ng-content select="[layout-footer]" />
</footer>
```

```html
<app-layout>
  <h1 layout-header>My Website Header</h1>
  <p>Main content goes here.</p>
  <p layout-footer>Copyright Info</p>
</app-layout>
```

#### Fallback content

Since **Angular 18**, content placed inside `<ng-content>` renders when nothing matches the slot.

```html
<!-- app-card template -->
<div class="card-header">
  <ng-content select="[card-title]">Default Title</ng-content>
</div>
<div class="card-body">
  <ng-content />
</div>
```

#### Conditional or repeated content

Do not put `<ng-content>` inside `@if`, `@for`, `@switch` or `<ng-template>`. The parent always instantiates projected content, even when the slot is not rendered. To render content lazily or several times, have the consumer pass an `<ng-template>`, query it and render it with `NgTemplateOutlet`, which must be added to the component's `imports`.

```ts
import {Component, contentChild, signal, TemplateRef} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'app-expandable',
  imports: [NgTemplateOutlet],
  template: `
    <button (click)="expanded.set(!expanded())">Toggle</button>
    @if (expanded()) {
      <ng-container [ngTemplateOutlet]="content()" />
    }
  `,
})
export class Expandable {
  readonly expanded = signal(false);
  readonly content = contentChild.required(TemplateRef);
}
```

```html
<app-expandable>
  <ng-template>
    <p>Details, only created when expanded.</p>
  </ng-template>
</app-expandable>
```

---

### Best Practices

- **Prefer signal queries**: Use `viewChild`, `viewChildren`, `contentChild` and `contentChildren` instead of the `@ViewChild`, `@ViewChildren`, `@ContentChild` and `@ContentChildren` decorators. Migrate existing code with `ng generate @angular/core:signal-queries-migration` (see [migrations.md](tooling.md)).
- **No `static` option**: Signal queries do not accept `{static: true}`, which only exists on decorator queries. Passing it is a TypeScript compilation error.
- **Call queries as functions**: Queries are signals. Read them with `this.inputEl()`, not `this.inputEl`.
- **String locators match template reference variables only**: `viewChild('myInput')` matches `<input #myInput>`, not an element named `myInput` or a `.myInput` class. To match a component or directive, pass its class.
- **Derive state instead of using lifecycle hooks**: Instead of reading queries in `ngAfterViewInit` or `ngAfterContentInit`, derive state from them with `computed()`. To work with the DOM of a queried element (measuring, calling a third-party library), use `afterRenderEffect` rather than `effect`, because `effect` runs before Angular updates the DOM (see [effects.md](reactivity-and-http.md)).
- **Host element**: To set attributes, classes or styles on the component's own host element, use the `host` property in `@Component` instead of injecting `ElementRef` (see [host-elements.md](components-and-templates.md)).
- **Limit `nativeElement` access**: Keep it for imperative DOM APIs that templates cannot express, such as `focus()`, measurements or third-party libraries. Set attributes, classes, styles and text through template bindings.

## Deferrable Views

Use a `@defer` block for template content that can be lazy loaded and is not required for the initial render. Angular splits eligible
dependencies into a separate chunk and loads them when the block triggers.

### Code splitting

A component, directive, or pipe is deferred only when:

- It is standalone.
- It is not referenced outside the `@defer` block in the same file, including by a view query.

Dependencies used by `@placeholder`, `@loading`, and `@error` are eager. Keep those blocks small.
Avoid barrel imports when they cause a deferred dependency to be referenced eagerly.

### States and triggers

```html
@defer (on viewport; prefetch on idle) {
<product-reviews />
} @placeholder (minimum 200ms) {
<div class="reviews-placeholder" aria-hidden="true"></div>
} @loading (after 100ms; minimum 200ms) {
<p role="status">Loading reviews...</p>
} @error {
<p role="alert">Reviews could not be loaded.</p>
}
```

- `@placeholder` renders before the trigger.
- `@loading` renders while the deferred chunk loads. Use `after` and `minimum` to avoid flicker.
- `@error` renders when loading fails.
- `on idle` is the default. Other triggers are `viewport`, `interaction`, `hover`, `immediate`,
  and `timer`.
- `when expression` triggers when the expression first becomes truthy. The block does not revert
  if it later becomes false.
- `prefetch` downloads the chunk before the main trigger renders it.

See [defer block triggers](https://angular.dev/guide/templates/defer#controlling-deferred-content-loading-with-triggers)
for trigger details and options.

For `viewport`, `interaction`, or `hover`, use a single-root placeholder or pass a template
reference to the trigger.

### SSR and hydration

By default, SSR and prerendering render the `@placeholder` block, or nothing when it is absent,
without invoking triggers. In the browser, Angular hydrates the placeholder and activates the
regular trigger.

When incremental hydration is enabled and the server should render the deferred content, add a
hydrate trigger:

```html
@defer (on viewport; hydrate on interaction) {
<product-reviews />
} @placeholder {
<div class="reviews-placeholder" aria-hidden="true"></div>
}
```

The regular trigger controls later client-side rendering. The hydrate trigger controls when
server-rendered deferred content becomes interactive.

### Layout stability

- Do not defer above-the-fold or LCP content.
- Give placeholders the same dimensions or aspect ratio as the final content.
- Keep placeholder, loading, error, and final states geometrically consistent.
- Avoid initial-render triggers such as `immediate`, short `timer` values, or early `viewport`
  triggers when replacement would cause layout shift.
- Give nested `@defer` blocks different triggers to avoid cascading requests.

## Pipes

Pipes transform data declaratively inside Angular templates using the `|` operator.

### Using pipes in templates

Import the pipe class and add it to the component's `imports` array.

```ts
import {Component} from '@angular/core';
import {DatePipe, CurrencyPipe} from '@angular/common';

@Component({
  selector: 'app-invoice',
  imports: [DatePipe, CurrencyPipe],
  template: `
    <p>Date: {{ issuedOn | date: 'mediumDate' }}</p>
    <p>Total: {{ amount | currency }}</p>
  `,
})
export class Invoice {
  issuedOn = new Date();
  amount = 49.99;
}
```

### Using pipe logic outside templates

**Do NOT inject pipe classes into services or other classes.** Pipes are template operators, not injectable services. Injecting them causes DI errors in standalone contexts and creates unnecessary coupling.

#### Custom pipes — extract the transformation function

Extract the logic into a plain function. The pipe delegates to it; services import the function directly.

```ts
// kebab-case.ts
export function toKebabCase(value: string): string {
  return value.toLowerCase().replace(/ /g, '-');
}
```

```ts
// kebab-case.pipe.ts
import {Pipe, PipeTransform} from '@angular/core';
import {toKebabCase} from './kebab-case';

@Pipe({name: 'kebabCase'})
export class KebabCasePipe implements PipeTransform {
  transform(value: string): string {
    return toKebabCase(value);
  }
}
```

```ts
// formatter.service.ts — import the function, NOT the pipe
import {Service} from '@angular/core';
import {toKebabCase} from './kebab-case';

@Service()
export class FormatterService {
  toSlug(title: string): string {
    return toKebabCase(title);
  }
}
```

#### Built-in locale-aware pipes — use standalone formatting functions

`@angular/common` exports a standalone function for each locale-aware built-in pipe:

| Pipe           | Standalone function |
| -------------- | ------------------- |
| `DatePipe`     | `formatDate`        |
| `CurrencyPipe` | `formatCurrency`    |
| `DecimalPipe`  | `formatNumber`      |
| `PercentPipe`  | `formatPercent`     |

Inject `LOCALE_ID` to get the current locale and pass it to the function.

```ts
// CORRECT — use formatNumber instead of injecting DecimalPipe
import {Service, LOCALE_ID, inject} from '@angular/core';
import {formatNumber} from '@angular/common';

@Service()
export class PriceService {
  private locale = inject(LOCALE_ID);

  formatQuantity(value: number): string {
    return formatNumber(value, this.locale, '1.0-0');
  }
}
```

```ts
// WRONG — do not inject pipe classes
import {Service, inject} from '@angular/core';
import {DecimalPipe} from '@angular/common';

@Service()
export class PriceService {
  // ❌ DecimalPipe is not designed to be injected
  private pipe = inject(DecimalPipe);
}
```

### Creating custom pipes

Use the Angular CLI to generate a pipe:

```bash
ng generate pipe path/to/my-pipe
```

A pipe needs a `@Pipe` decorator with a `name` and a `transform` method implementing `PipeTransform`.

```ts
import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'truncate'})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 50): string {
    return value.length > limit ? value.slice(0, limit) + '…' : value;
  }
}
```

- **`name`**: camelCase. Do not use hyphens.
- **Class name**: PascalCase version of `name` with `Pipe` appended (e.g., `TruncatePipe`).

### Impure pipes

Mark a pipe `pure: false` only when you need to detect mutations inside arrays or objects. Impure pipes run on every change-detection cycle and can hurt performance.

```ts
@Pipe({name: 'filterItems', pure: false})
export class FilterItemsPipe implements PipeTransform {
  transform(items: string[], query: string): string[] {
    return items.filter((i) => i.includes(query));
  }
}
```

IMPORTANT: Avoid impure pipes unless absolutely necessary.

## Angular Naming Conventions (Angular v20+ Style Guide)

This skill enforces Angular naming conventions for components, services, directives, pipes, and models. While it promotes the modern **"Intent over Role"** philosophy introduced in Angular v20, **it must respect existing project configurations first**.

---

### Core Principles

1. **Prioritize Existing Conventions**: Before generating or refactoring files, check the existing project files, `angular.json` configuration, and ESLint rules. **Do not force suffixless naming on projects that rely on standard suffixes.**
2. **Remove Role Suffixes (Modern Projects Only)**: In projects configured for "Intent over Role" or newly bootstrapped v20+ projects, filenames no longer include functional extensions like `.component.ts`, `.service.ts`, or `.directive.ts`. Corresponding TypeScript classes drop suffixes like `Component`, `Service`, or `Directive`.
3. **Intent/Purpose-Based Naming**: When suffixless naming is active, name files and classes based on their specific domain, responsibility, or business purpose (e.g., `-data`, `-store`, `-api`, or `-formatter`).
4. **Folder Location as Context**: Lean on folder hierarchy (`core/`, `features/`, `shared/`) and IDE capabilities to identify the technical role of files, rather than encoding that context within the file name.
5. **Interface/Model Exception**: Interfaces and data models still retain the `.model.ts` suffix to clearly declare type contracts.

---

### Recommended Project Structure & Naming Rules

#### 1. File/Identifier Matching & Consistency

- **Hyphens in Filenames**: Continue using kebab-case (hyphens) to separate words in filenames (e.g., `product-list.ts`).
- **Identifier Matching**: Filenames must align directly with the primary TypeScript class/identifier (e.g., `product-list.ts` contains `class ProductList`).
- **Unified Filenames**: If using split template or style files, keep names identical to the main TypeScript file:
  - `product-list.ts`
  - `product-list.html`
  - `product-list.css`
- **Test Files**: Continue to use the same base name with the `.spec.ts` suffix (e.g., `product-list.spec.ts` for `product-list.ts`).

#### 2. Core Directory (Application Foundation)

Houses singleton services, global state, and system-wide models.

- **Services (Logic/State)**:
  - _Old_: `auth.service.ts` (Class: `AuthService`)
  - _New_: `auth.ts` (Class: `AuthService`)
  - _Alternative (Intent-specific)_: Use descriptive domain-purpose suffixes like `[domain]-data.ts`, `[domain]-store.ts`, or `[domain]-data-client.ts` (e.g., `auth-data.ts` / `AuthData`, `user-data-client.ts` / `UserDataClient`).
- **Models**: Retain the `.model.ts` suffix for data shapes.
  - _Example_: `user.model.ts` (Interface: `User`)

#### 3. Features Directory (Domain Business Logic)

Organize files into feature-specific folders containing components, local services, and routes related to that domain.

- **Main Feature Component**: Name the main feature component after the route or feature itself.
  - _Example_: `features/profile/profile.ts` (Class: `Profile`)
- **Feature Sub-Components**: Name sub-components based on their display or functional role.
  - _Example_: `features/profile/components/profile-header.ts` (Class: `ProfileHeader`)
  - _Example_: `features/projects/components/project-card.ts` (Class: `ProjectCard`)
- **Feature Services**: Name feature services based on feature-specific data or state needs.
  - _Example_: `features/projects/projects-data.ts` (Class: `ProjectsData`)

#### 4. Shared Directory (Reusable UI Toolkit)

Store pure, presentational elements and helpers with zero business logic in a shared folder.

- **Shared Components**: Name shared components based on their reusable UI role.
  - _Example_: `shared/components/button/button.ts` (Class: `Button`)
  - _Example_: `shared/components/spinner/spinner.ts` (Class: `Spinner`)
- **Shared Pipes**: Name shared pipes according to their formatting purpose.
  - _Example_: `shared/pipes/format-date.ts` (Class: `FormatDate`)
- **Shared Directives**: Name directives according to the behavior they attach to elements.
  - _Old_: `highlight.directive.ts` (Class: `HighlightDirective`)
  - _New_: `highlight.ts` (Class: `Highlight`)

---

### Best Practices & Coexistence Rules

- **How to Determine the Style in Use**:
  1.  Inspect adjacent files in the target directory (do they end in `.component.ts` or `.ts`?).
  2.  Check `angular.json` for custom schematics options that might configure suffix behaviors.
  3.  If unsure, use the traditional role suffix style (`.component.ts`, `.service.ts`) as it is the safest default in the Angular ecosystem.
- **Avoid Namespace Collisions**: Without role suffixes, files like `user.ts` (component) and `user.model.ts` (model) can collide if they both declare a class/interface named `User`.
  - To prevent this use more specific, intent-based names for components (e.g. `class UserProfile` in `user-profile.ts` or `class UserDetail` in `user-detail.ts`) while keeping the simple domain name for the interface (`interface User` in `user.model.ts`).
- **Consistency Check**: Do not mix old suffix styles and new suffixless styles in the same feature folder or module. Keep existing legacy code as-is unless migrating the entire module to the modern structure.
- **Lean on the IDE**: Rely on modern IDE code navigation (e.g., "Go to Definition" or fuzzy searches for class names like `AuthData` or `ProfileHeader`) and file type icons rather than visual scan of suffix strings.
