# Tooling

Angular CLI workflows, code migrations, the Angular MCP server, and environment configuration.

## Angular CLI Guide for Agents

The Angular CLI (`ng`) is the primary tool for managing an Angular workspace. Always prefer CLI commands over manual file creation or generic `npm` commands when modifying project structure or adding Angular-specific dependencies.

### 1. Creating a New Application

1. **Check for the CLI.** On `*nix` run `which ng`; on Windows run `where ng` or `gcm ng` in PowerShell. If it is missing, prefer the project's local CLI via `npx ng` and only offer a global install (`npm install -g @angular/cli`) with the user's explicit approval.
2. **Scaffold** with `npx ng new <app-name> --interactive=false --ai-config=<agents|claude|copilot|cursor|gemini|jetbrains|none|windsurf>`. Prefer `--ai-config` matching the environment (e.g. `--ai-config=gemini`), defaulting to `agents`. Read the generated AI configuration before writing code so it stays consistent with it.
3. **Choose flags from the requirements:** `--style=scss|css|less` (stylesheet format), `--routing` (routing setup), `--ssr` (server-side rendering), `--prefix=<prefix>` (selector prefix), `--skip-tests` (only if explicitly requested).
4. **Add features before serving.** Generate the first features, run `ng build` to catch errors, and ask the user before starting the dev server.

### 2. Managing Dependencies

**ALWAYS use `ng add` for Angular libraries** instead of `npm install`. `ng add` installs the package AND runs initialization schematics (e.g., configuring `angular.json`, updating root providers).

```bash
ng add @angular/material
ng add tailwindcss
ng add @angular/fire
```

To update the application and its dependencies (which automatically runs code migrations):

```bash
ng update @angular/core@<latest or specific version> @angular/cli@<latest or specific version>
```

### 3. Generating Code (`ng generate` or `ng g`)

Always use the CLI to generate code to ensure it adheres to Angular standards and updates necessary configuration files automatically.

| Target       | Command               | Notes                                                                                          |
| :----------- | :-------------------- | :--------------------------------------------------------------------------------------------- |
| Component    | `ng g c path/to/name` | Generates a component. Use `--inline-style` (`-s`) or `--inline-template` (`-t`) if requested. |
| Service      | `ng g s path/to/name` | Generates an `@Service` service.                                                               |
| Directive    | `ng g d path/to/name` | Generates a directive.                                                                         |
| Pipe         | `ng g p path/to/name` | Generates a pipe.                                                                              |
| Guard        | `ng g g path/to/name` | Generates a functional route guard.                                                            |
| Environments | `ng g environments`   | Scaffolds `src/environments/` and updates `angular.json` with file replacements.               |
| Interface    | `ng g i path/to/name` | Generates a TypeScript interface.                                                              |
| Interceptor  | `ng g interceptor path/to/name` | Generates a functional HTTP interceptor.                                              |
| Resolver     | `ng g resolver path/to/name` | Generates a functional route resolver.                                                     |
| Enum         | `ng g e path/to/name` | Generates a TypeScript enum.                                                                   |
| Class        | `ng g cl path/to/name` | Generates a TypeScript class.                                                                 |

_Note: There is no command to generate a single route definition. Generate a component, then manually add it to the `Routes` array in `app.routes.ts`._

Note the path each generate command prints so you know exactly where the new files landed. Generate with the CLI first, then augment the generated code.

### 4. Development Server & Proxying

Start the local development server with hot-module replacement (HMR):

```bash
ng serve
```

#### Backend API Proxying

To proxy API requests during development (e.g., rerouting `/api` to a local Node server):

1. Create `src/proxy.conf.json`:
   ```json
   {
     "/api/**": {"target": "http://localhost:3000", "secure": false}
   }
   ```
2. Update `angular.json` under the `serve` target:
   ```json
   "serve": {
     "builder": "@angular/build:dev-server",
     "options": { "proxyConfig": "src/proxy.conf.json" }
   }
   ```

### 5. Building the Application

Compile the application into an output directory (default: `dist/<project-name>/browser`). Modern Angular uses the `@angular/build:application` builder (esbuild-based).

```bash
ng build
```

- `ng build` defaults to the production configuration, which enables Ahead-of-Time (AOT) compilation, minification, and tree-shaking.
- Target specific configurations defined in `angular.json` using `--configuration`: `ng build --configuration=staging`.

### 6. Testing

- **Unit Tests**: Run `ng test` to execute unit tests via the configured test runner (e.g., Karma or Vitest).
- **End-to-End (E2E)**: Run `ng e2e`. If no E2E framework is configured, the CLI will prompt to install one (Cypress, Playwright, Puppeteer, etc.).

### 7. Deployment

To deploy an application, you must first add a deployment builder, then run the deploy command:

```bash
# Example for Firebase
ng add @angular/fire
ng deploy
```

## Automatic Migrations & Code Modernization

When tasked with refactoring or modernizing an existing codebase, always prefer using the official automated schematics available in `@angular/core` over manual text replacement.

### Discovering Migrations

To view all available schematics for the installed version of the core framework, run:
`ng generate @angular/core: --help`

### Common Migration Schematics

Use the following commands to apply specific syntax updates. You can scope these commands to a specific project or directory using the `--project <name>` or `--path <dir>` flags.

| Feature to Modernize      | Command to Execute                                          |
| :------------------------ | :---------------------------------------------------------- |
| **Built-in Control Flow** | `ng generate @angular/core:control-flow`                    |
| **Signal-based Inputs**   | `ng generate @angular/core:signal-input-migration`          |
| **Signal Queries**        | `ng generate @angular/core:signal-queries-migration`        |
| **Functional Outputs**    | `ng generate @angular/core:output-migration`                |
| **`inject()` Function**   | `ng generate @angular/core:inject`                          |
| **Self-Closing Tags**     | `ng generate @angular/core:self-closing-tag`                |
| **Standalone**            | `ng generate @angular/core:standalone` (See workflow below) |

### Specialized Workflow: Migrating to Standalone

The Standalone migration is an interactive, multi-step refactoring. You **MUST** perform this in three discrete stages, verifying that the application builds and runs correctly after each stage completes:

1. **Phase 1**: Run `ng generate @angular/core:standalone` and select the option to **Convert all components, directives and pipes to standalone**.
2. **Phase 2**: Verify the build with `ng build`. Run the command again and select **Remove unnecessary NgModule classes**.
3. **Phase 3**: Verify the build with `ng build`. Run the final pass and select **Bootstrap the application using standalone APIs**.

## Angular CLI MCP Server

The Angular CLI includes a Model Context Protocol (MCP) server that enables AI assistants (like Cursor, Gemini CLI, JetBrains AI, etc.) to interact directly with the Angular CLI. It provides tools for project analysis, guided migrations, and running builds/tests.

### Available Tools (Default)

When the MCP server is enabled, AI agents have access to the following tools:

| Name                        | Description                                                                                               |
| :-------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `ai_tutor`                  | Launches an interactive AI-powered Angular tutor.                                                         |
| `devserver_start`           | Asynchronously starts a dev server (`ng serve`). Returns immediately.                                     |
| `devserver_stop`            | Stops the dev server.                                                                                     |
| `devserver_wait_for_build`  | Returns the logs of the most recent build in a running dev server.                                        |
| `get_best_practices`        | Retrieves the Angular Best Practices Guide (crucial for standalone components, typed forms, etc.).        |
| `list_projects`             | Lists all applications and libraries in the workspace by reading `angular.json`.                          |
| `onpush_zoneless_migration` | Analyzes code and provides a plan to migrate it to `OnPush` change detection (prerequisite for zoneless). |
| `run_target`                | Executes a configured target.                                                                             |
| `search_documentation`      | Searches the official documentation at `https://angular.dev`.                                             |

### Configuration

To use the MCP server, you configure your host environment (IDE or CLI) to run `npx @angular/cli mcp`.

#### Antigravity IDE

Create a file named `.antigravity/mcp.json` in your project's root:

```json
{
  "mcpServers": {
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}
```

#### Gemini CLI

Create `.gemini/settings.json` in the project root:

```json
{
  "mcpServers": {
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}
```

#### Cursor

Create `.cursor/mcp.json` in the project root (or globally at `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}
```

#### VS Code

Create `.vscode/mcp.json`:

```json
{
  "servers": {
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}
```

### Command Options

You can pass arguments to the MCP server in the `args` array of your configuration:

- `--read-only`: Only registers tools that do not modify the project.
- `--local-only`: Only registers tools that do not require an internet connection.

Example for read-only mode:

```json
"args": ["-y", "@angular/cli", "mcp", "--read-only"]
```

## Environment configuration

### Configuration strategies

Angular supports two main configuration strategies:

- **Build-time configuration** using environment files
- **Runtime configuration** by loading values at application startup

Choose the approach based on your deployment requirements.

---

### Build-time configuration

Environment files define configuration values that are replaced at build time.

> **Security note:** Environment files are bundled into the client-side application.
> They are visible to anyone who can load the page.
> Never store sensitive information like API keys, secrets, or credentials in environment files.
> These values can be easily accessed by users.

Generate environment files using the CLI:

```bash
ng generate environments
```

This creates environment-specific files such as:

```ts
// environment.ts
export const environment = {
  apiUrl: 'https://api.example.com',
};
```

```ts
// environment.development.ts
export const environment = {
  apiUrl: 'http://localhost:3000',
};
```

Import the environment where needed:

```ts
import {environment} from '../environments/environment';

const apiUrl = environment.apiUrl;
```

The Angular CLI replaces the appropriate file based on the build configuration.

If you need a development-mode check, use `isDevMode()` from `@angular/core` instead of relying on a manually maintained `production` flag.

> Changes to environment files require rebuilding the application.

---

### Runtime configuration (advanced)

In some scenarios, applications need to load configuration at runtime instead of build time.

This allows the same build artifact to be deployed across multiple environments without rebuilding.

A common approach is to load a JSON configuration file from the `assets` folder during application
initialization.

#### Example

```json
// src/assets/config.json
{
  "apiUrl": "https://api.example.com"
}
```

Load the configuration before the application starts:

```ts
import {Service, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {tap} from 'rxjs';

interface AppConfig {
  apiUrl: string;
}

@Service()
export class AppConfigService {
  private config!: AppConfig;

  private readonly http = inject(HttpClient);

  loadConfig() {
    return this.http.get<AppConfig>('/assets/config.json').pipe(
      tap((data) => {
        this.config = data;
      }),
    );
  }

  get apiUrl(): string {
    return this.config.apiUrl;
  }
}
```

Register the loader during application bootstrap:

```ts
import {provideAppInitializer, inject} from '@angular/core';

provideAppInitializer(() => {
  const config = inject(AppConfigService);
  return config.loadConfig();
});
```

This ensures configuration is available before the application renders.

> Runtime configuration is an advanced pattern and is not required for most applications.

---

### Choosing a strategy

| Criteria               | Build-time | Runtime      |
| ---------------------- | ---------- | ------------ |
| Change without rebuild | No         | Yes          |
| Startup performance    | Faster     | Slight delay |
| Complexity             | Low        | Moderate     |
| Deployment flexibility | Limited    | High         |

Use build-time configuration for most applications, and runtime configuration when you need to
deploy the same build across multiple environments.
