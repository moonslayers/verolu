# Styling and Animations

Component styles and encapsulation, Tailwind CSS, Angular animations, and route transition animations.

## Component Styling

Angular components can define styles that apply specifically to their template, enabling encapsulation and modularity.

### Defining Styles

Styles can be defined inline or in separate files.

```ts
@Component({
  selector: 'app-photo',
  // Inline styles
  styles: `
    img {
      border-radius: 50%;
    }
  `,
  // OR external file
  styleUrl: 'photo.component.css',
})
export class Photo {}
```

### View Encapsulation

Every component has a view encapsulation setting that determines how styles are scoped.

| Mode                            | Behavior                                                                                      |
| :------------------------------ | :-------------------------------------------------------------------------------------------- |
| `Emulated` (Default)            | Scopes styles to the component using unique HTML attributes. Global styles can still leak in. |
| `ShadowDom`                     | Uses the browser's native Shadow DOM API to isolate styles completely.                        |
| `None`                          | Disables encapsulation. Component styles become global.                                       |
| `ExperimentalIsolatedShadowDom` | Strictly guarantees that only the component's styles apply.                                   |

#### Usage

```ts
import { ViewEncapsulation } from '@angular/core';

@Component({
  ...,
  encapsulation: ViewEncapsulation.None,
})
export class GlobalStyled {}
```

### Special Selectors

#### `:host`

Targets the component's host element (the element matching the component's selector).

```css
:host {
  display: block;
  border: 1px solid black;
}
```

#### `:host-context()`

Targets the host element based on some condition in its ancestry.

```css
/* Apply styles if any ancestor has the 'theme-dark' class */
:host-context(.theme-dark) {
  background-color: #333;
}
```

#### `::ng-deep`

Disables view encapsulation for a specific rule, allowing it to "leak" into child components.
**Note: The Angular team strongly discourages the use of `::ng-deep`.** It is supported only for backwards compatibility.

### Styles in Templates

You can use `<style>` elements directly in a component's template. View encapsulation rules still apply.

```html
<style>
  .dynamic-class {
    color: red;
  }
</style>
<div class="dynamic-class">Hello</div>
```

### External Styles

Using `<link>` or `@import` in CSS is treated as external styles. **External styles are not affected by emulated view encapsulation.**

## Using Tailwind CSS with Angular

Tailwind CSS is a utility-first CSS framework that integrates seamlessly with Angular.

**CRITICAL AGENT GUIDANCE: ALWAYS focus on Tailwind CSS v4 practices. DO NOT revert to old Tailwind v3 patterns (like creating `tailwind.config.js` with `@tailwind` directives) as this will break the application build. Modern Angular projects use Tailwind v4.**

### Automated Setup (Recommended)

The easiest way to add Tailwind CSS to an Angular project is via the Angular CLI:

```shell
ng add tailwindcss
```

This will automatically:

1. Install `tailwindcss` and peer dependencies.
2. Configure the project to use Tailwind CSS.
3. Add the proper import to your global styles.

### Manual Setup (Tailwind v4)

If setting up manually, use the following Tailwind v4 pattern:

#### 1. Install Dependencies

Install Tailwind CSS and PostCSS:

```shell
npm install tailwindcss @tailwindcss/postcss postcss
```

#### 2. Configure PostCSS

Create a `.postcssrc.json` file in the project root:

```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

_(Do NOT create a `tailwind.config.js` file! Configuration in v4 is handled through CSS variables)._

#### 3. Import Tailwind CSS

In your global styles file (e.g., `src/styles.css`), add the standard v4 import:

```css
@import 'tailwindcss';
```

_(If using SCSS, use `@use 'tailwindcss';` instead)._

#### 4. Use Utility Classes

You can now use Tailwind classes directly in your component templates:

```html
<h1 class="text-3xl font-bold underline">Hello world!</h1>
```

### Summary for AI Agents

- **Do not use `@tailwind base; @tailwind components; @tailwind utilities;`**. Use `@import 'tailwindcss';`.
- **Do not create `tailwind.config.js`**. Configuration is managed directly in CSS via theme variables or using PostCSS configurations.
- Stick strictly to v4 syntax and workflows.

## Angular Animations

When animating elements in Angular, **first analyze the project's Angular version** in `package.json`.
For modern applications (**Angular v20.2 and above**), prefer using native CSS with `animate.enter` and `animate.leave`. For older applications, you may need to use the deprecated `@angular/animations` package.

### 1. Native CSS Animations (v20.2+ Recommended)

Modern Angular provides `animate.enter` and `animate.leave` to animate elements as they enter or leave the DOM. They apply CSS classes at the appropriate times.

#### `animate.enter` and `animate.leave`

Use these directly on elements to apply CSS classes during the enter or leave phase. Angular automatically removes the enter classes when the animation completes. For `animate.leave`, Angular waits for the animation to finish before removing the element from the DOM.

`animate.enter` example:

```html
@if (isShown()) {
<div class="enter-container" animate.enter="enter-animation">
  <p>The box is entering.</p>
</div>
}
```

```css
/* Ensure you have a starting style if using transitions instead of keyframes */
.enter-container {
  border: 1px solid #dddddd;
  margin-top: 1em;
  padding: 20px;
  font-weight: bold;
  font-size: 20px;
}
.enter-container p {
  margin: 0;
}
.enter-animation {
  animation: slide-fade 1s;
}
@keyframes slide-fade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

_Note: `animate.leave` may be added to child elements being removed._

#### Event Bindings and Third-party Libraries

You can bind to `(animate.enter)` and `(animate.leave)` to call functions or use JS libraries like GSAP.

```html
@if(show()) {
<div (animate.leave)="onLeave($event)">...</div>
}
```

```ts
import { AnimationCallbackEvent } from '@angular/core';

onLeave(event: AnimationCallbackEvent) {
  // Custom animation logic here
  // CRITICAL: You MUST call animationComplete() when done so Angular removes the element!
  event.animationComplete();
}
```

### 2. Advanced CSS Animations

CSS offers robust tools for advanced animation sequences.

#### Animating State and Styles

Toggle CSS classes on elements using property binding to trigger transitions.

```html
<div [class.open]="isOpen">...</div>
```

```css
div {
  transition: height 0.3s ease-out;
  height: 100px;
}
div.open {
  height: 200px;
}
```

#### Animating Auto Height

You can use `css-grid` to animate to auto height.

```css
.container {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s;
}
.container.open {
  grid-template-rows: 1fr;
}
.container > div {
  overflow: hidden;
}
```

#### Staggering and Parallel Animations

- **Staggering**: Use `animation-delay` or `transition-delay` with different values for items in a list.
- **Parallel**: Apply multiple animations in the `animation` shorthand (e.g., `animation: rotate 3s, fade-in 2s;`).

#### Programmatic Control

Retrieve animations directly using standard Web APIs:

```ts
const animations = element.getAnimations();
animations.forEach((anim) => anim.pause());
```

### 3. Legacy Animations DSL (Deprecated)

For older projects (pre v20.2 or where `@angular/animations` is already heavily used), you use the component metadata DSL.

**Important:** Do not mix legacy animations and `animate.enter`/`leave` in the same component.

#### Setup

```ts
bootstrapApplication(App, {
  providers: [provideAnimationsAsync()],
});
```

#### Defining Transitions

```ts
import {signal} from '@angular/core';
import {trigger, state, style, animate, transition} from '@angular/animations';

@Component({
  animations: [
    trigger('openClose', [
      state('open', style({opacity: 1})),
      state('closed', style({opacity: 0})),
      transition('open <=> closed', [animate('0.5s')]),
    ]),
  ],
  template: `<div [@openClose]="isOpen() ? 'open' : 'closed'">...</div>`,
})
export class OpenClose {
  protected readonly isOpen = signal(true);
}
```

## Route Transition Animations

Angular Router supports the browser's **View Transitions API** for smooth visual transitions between routes.

### Enabling View Transitions

Add `withViewTransitions()` to your router configuration.

```ts
provideRouter(routes, withViewTransitions());
```

This is a **progressive enhancement**. In browsers that don't support the API, the router will still work but without the transition animation.

### How it Works

1. Browser takes a screenshot of the old state.
2. Router updates the DOM (activates new component).
3. Browser takes a screenshot of the new state.
4. Browser animates between the two states.

### Customizing with CSS

Transitions are customized in **global CSS files** (not component-scoped CSS).

Use the `::view-transition-old()` and `::view-transition-new()` pseudo-elements.

```css
/* Example: Cross-fade + Slide */
::view-transition-old(root) {
  animation: 90ms cubic-bezier(0.4, 0, 1, 1) both fade-out;
}
::view-transition-new(root) {
  animation: 210ms cubic-bezier(0, 0, 0.2, 1) 90ms both fade-in;
}
```

### Advanced Control

Use `onViewTransitionCreated` to skip transitions or customize behavior based on the navigation context.

```ts
withViewTransitions({
  onViewTransitionCreated: ({transition, from, to}) => {
    // Skip animation for specific routes
    if (to.url === '/no-animation') {
      transition.skipTransition();
    }
  },
});
```

### Best Practices

- **Global Styles**: Always define transition animations in `styles.css` to avoid view encapsulation issues.
- **View Transition Names**: Assign unique `view-transition-name` to elements that should transition smoothly across routes (e.g., a header image).
