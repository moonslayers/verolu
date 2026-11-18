# Testing

Unit testing with Vitest and TestBed, component harnesses, router testing, and end-to-end tests.

## Testing Fundamentals

This guide covers the fundamental principles and practices for writing unit tests in this repository, which uses Vitest as the test runner.

### Core Philosophy: Zoneless & Async-First

This project follows a modern, zoneless testing approach. State changes schedule updates asynchronously, and tests must account for this.

**Do NOT** use `fixture.detectChanges()` to manually trigger updates.
**Do NOT** use `fixture.changeDetectorRef.markForCheck()` either: it marks only the host view and does not refresh the template of `OnPush` components (the default). Update state through signals, inputs, or DOM events instead.
**ALWAYS** use the "Act, Wait, Assert" pattern:

1.  **Act:** Update state or perform an action (e.g., set a component input, click a button).
2.  **Wait:** Use `await fixture.whenStable()` to allow the framework to process the scheduled update and render the changes.
3.  **Assert:** Verify the outcome.

#### Basic Test Structure Example

```ts
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MyComponent} from './my.component';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;
  let h1: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    // Create the component fixture
    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    h1 = fixture.nativeElement.querySelector('h1');
  });

  it('should display the default title', async () => {
    // ACT: (Implicit) Component is created with default state.
    // WAIT for initial data binding.
    await fixture.whenStable();
    // ASSERT the initial state.
    expect(h1.textContent).toContain('Default Title');
  });

  it('should display a different title after a change', async () => {
    // ACT: Change the component's title property.
    component.title.set('New Test Title');

    // WAIT for the asynchronous update to complete.
    await fixture.whenStable();

    // ASSERT the DOM has been updated.
    expect(h1.textContent).toContain('New Test Title');
  });
});
```

### TestBed and ComponentFixture

- **`TestBed`**: The primary utility for creating a test-specific Angular module. Use `TestBed.configureTestingModule({...})` in your `beforeEach` to declare components, provide services, and set up imports needed for your test.
- **`ComponentFixture`**: A handle on the created component instance and its environment.
  - `fixture.componentInstance`: Access the component's class instance.
  - `fixture.nativeElement`: Access the component's root DOM element.
  - `fixture.debugElement`: An Angular-specific wrapper around the `nativeElement` that provides safer, platform-agnostic ways to query the DOM (e.g., `debugElement.query(By.css('p'))`).

## Testing with Component Harnesses

Component harnesses are the standard, preferred way to interact with components in tests. They provide a robust, user-centric API that makes tests less brittle and easier to read by insulating them from changes to a component's internal DOM structure.

### Why Use Harnesses?

- **Robustness:** Tests don't break when you refactor a component's internal HTML or CSS classes.
- **Readability:** Tests describe interactions from a user's perspective (e.g., `button.click()`, `slider.getValue()`) instead of through DOM queries (`fixture.nativeElement.querySelector(...)`).
- **Reusability:** The same harness can be used in both unit tests and E2E tests.

Angular Material provides a test harness for every component in its library.

### Using a Harness in a Unit Test

The `TestbedHarnessEnvironment` is the entry point for using harnesses in unit tests.

#### Example: Testing with a `MatButtonHarness`

```ts
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatButtonHarness} from '@angular/material/button/testing';
import {MyButtonContainerComponent} from './my-button-container.component';

describe('MyButtonContainerComponent', () => {
  let fixture: ComponentFixture<MyButtonContainerComponent>;
  let loader: HarnessLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    fixture = TestBed.createComponent(MyButtonContainerComponent);
    // Create a harness loader for the component's fixture
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('should find a button with specific text', async () => {
    // Load the harness for a MatButton with the text "Submit"
    const submitButton = await loader.getHarness(MatButtonHarness.with({text: 'Submit'}));

    // Use the harness API to interact with the component
    expect(await submitButton.isDisabled()).toBe(false);
    await submitButton.click();

    // ... assertions
  });
});
```

#### Key Concepts

1.  **`HarnessLoader`**: An object used to find and create harness instances. Get a loader for your component's fixture using `TestbedHarnessEnvironment.loader(fixture)`.

2.  **`loader.getHarness(HarnessClass)`**: Asynchronously finds and returns a harness instance for the first matching component.

3.  **`HarnessClass.with({ ... })`**: Many harnesses provide a static `with` method that returns a `HarnessPredicate`. This allows you to filter and find components based on their properties, like text, selector, or disabled state. Always use this to precisely target the component you want to test.

4.  **Harness API:** Once you have a harness instance, use its methods (e.g., `.click()`, `.getText()`, `.getValue()`) to interact with the component. These methods automatically handle waiting for async operations and change detection.

## Testing with the RouterTestingHarness

When testing components that involve routing, it is crucial **not to mock the Router or related services**. Instead, use the `RouterTestingHarness`, which provides a robust and reliable way to test routing logic in an environment that closely mirrors a real application.

Using the harness ensures you are testing the actual router configuration, guards, and resolvers, leading to more meaningful tests.

### Setting Up for Router Testing

The `RouterTestingHarness` is the primary tool for testing routing scenarios. You also need to provide your test routes using the `provideRouter` function in your `TestBed` configuration.

#### Example Setup

```ts
import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {Dashboard} from './dashboard.component';
import {HeroDetail} from './hero-detail.component';

describe('Dashboard Component Routing', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    // 1. Configure TestBed with test routes
    TestBed.configureTestingModule({
      providers: [
        // Use provideRouter with your test-specific routes
        provideRouter([
          {path: '', component: Dashboard},
          {path: 'heroes/:id', component: HeroDetail},
        ]),
      ],
    });

    // 2. Create the RouterTestingHarness
    harness = await RouterTestingHarness.create();
  });
});
```

#### Key Concepts

1.  **`provideRouter([...])`**: Provide a test-specific routing configuration. This should include the routes necessary for the component-under-test to function correctly.
2.  **`RouterTestingHarness.create(initialUrl?)`**: Asynchronously creates the harness and optionally performs an initial navigation.

### Writing Router Tests

Once the harness is created, you can use it to drive navigation and make assertions on the state of the router and the activated components.

#### Example: Testing Navigation

```ts
it('should navigate to a hero detail when a hero is selected', async () => {
  // 1. Navigate to the initial component and get its instance
  const dashboard = await harness.navigateByUrl('/', Dashboard);

  // Suppose the dashboard has a method to select a hero
  const heroToSelect = {id: 42, name: 'Test Hero'};
  dashboard.selectHero(heroToSelect);

  // Wait for stability after the action that triggers navigation
  await harness.fixture.whenStable();

  // 2. Assert on the URL
  const router = TestBed.inject(Router);
  expect(router.url).toEqual('/heroes/42');

  // 3. Get the activated component after navigation
  const heroDetail = harness.routeDebugElement?.componentInstance as HeroDetail;

  // 4. Assert on the state of the new component
  expect(heroDetail.hero.name).toBe('Test Hero');
});

it('should get the activated component directly', async () => {
  // Navigate and get the component instance in one step
  const dashboardInstance = await harness.navigateByUrl('/', Dashboard);

  expect(dashboardInstance).toBeInstanceOf(Dashboard);
});
```

#### Best Practices

- **Navigate with the Harness:** Use `harness.navigateByUrl()` or `harness.navigate()` to simulate navigation. Both methods return a promise that resolves with the activated component instance, or `null` if no outlet is activated.
- **Access the Router State:** Inject `Router` from `TestBed` to inspect the live router state.
- **Get Activated Components:** Use the component returned by `navigateByUrl(url, ComponentType)`. After application-driven navigation, read `harness.routeDebugElement?.componentInstance`.
- **Wait for Stability:** After performing an action that causes navigation, always `await harness.fixture.whenStable()` to ensure the routing is complete before making assertions.

## End-to-End (E2E) Testing

> [!IMPORTANT]
> Only use the setup guidelines in this file if there is no existing E2E testing framework configured in the workspace, or if the user has explicitly requested to change or set up E2E testing.

### Setting Up and Running E2E Tests

Add supported E2E frameworks to the project using `ng add`:

- **Playwright:**
  ```shell
  ng add playwright-ng-schematics
  ```
- **Cypress:**
  ```shell
  ng add @cypress/schematic
  ```
- **Nightwatch:**
  ```shell
  ng add @nightwatch/schematics
  ```
- **WebdriverIO:**
  ```shell
  ng add @wdio/schematics
  ```
- **Puppeteer:**
  ```shell
  ng add @puppeteer/ng-schematics
  ```

Run E2E tests:

```shell
ng e2e [project] [options]
```

### Custom & Enterprise Testing Tools

For custom enterprise runners (e.g., Katalon Studio, TestCafe, Selenium), define execution commands in `package.json` scripts.
