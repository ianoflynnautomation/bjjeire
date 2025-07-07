# BJJ Eire: Local Development & Kubernetes Setup

<!-- Badges -->
[![CI Pipeline](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml)
[![Azure DevOps Build Status](https://dev.azure.com/<ORG>/<PROJECT>/_apis/build/status/<PIPELINE_NAME>?branchName=main)](https://dev.azure.com/<ORG>/<PROJECT>/_build/latest?definitionId=<DEFINITION_ID>&branchName=main)
[![Docker Image Version (latest by date)](https://img.shields.io/docker/v/<ACR_NAME>/<API_IMAGE_NAME>?label=API%20Image&sort=date)](https://portal.azure.com/#@/resource/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP>/providers/Microsoft.ContainerRegistry/registries/<ACR_NAME>/repository)
[![Docker Image Version (latest by date)](https://img.shields.io/docker/v/<ACR_NAME>/<FRONTEND_IMAGE_NAME>?label=Frontend%20Image&sort=date)](https://portal.azure.com/#@/resource/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP>/providers/Microsoft.ContainerRegistry/registries/<ACR_NAME>/repository)

---

## Dev Container Setup

This project includes a ready-to-use [Dev Container](https://containers.dev/) configuration for rapid onboarding and consistent development environments in VS Code or GitHub Codespaces.

- **Base Image:** `mcr.microsoft.com/devcontainers/base:ubuntu`
- **Custom Features:**
  - Docker-in-Docker (for building/running containers inside the devcontainer)
  - Minikube, Helm, and kubectl (for local Kubernetes development)
  - .NET 9 SDK
  - Node.js 24 (with node-gyp dependencies)
- **VS Code Extensions:**
  - Kubernetes, Docker, YAML, C#, ESLint, Prettier, Pascal Case, .NET Test Explorer, Spell Checker
- **Ports Auto-Forwarded:**
  - 5003 (API HTTP), 5001 (API HTTPS)
  - 60742 (Frontend HTTP), 60743 (Frontend HTTPS)
  - 27017 (MongoDB)
- **Post-Create Command:** Runs `bash ./post-create-commands.sh` to finalize setup
- **Default User:** `vscode`
- **Workspace Directory:** `/workspaces/BjjEire`
- **Environment Variable:** `BJJ_PROVISIONING_METHOD=helm`

> **Tip:** Open this project in VS Code and install the "Dev Containers" extension for a seamless, pre-configured development experience.

---

## Table of Contents
- [Docker Compose Setup](#docker-compose-setup)
  - [Prerequisites](#prerequisites)
  - [File Structure](#file-structure)
  - [How to Run](#how-to-run)
- [Kubernetes Setup](#kubernetes-setup)
  - [BJJ Application Deployment to Minikube](#bjj-application-deployment-to-minikube)
  - [Prerequisites](#prerequisites-1)
  - [Local Setup and Deployment](#local-setup-and-deployment)

---

# Docker Compose Setup

This project utilizes a modular Docker Compose setup to manage different environments and optional services. The core application services are defined in a base `docker-compose.yml` file, with environment-specific configurations and optional components defined in separate override files. This approach provides flexibility for:

- Running locally with services built from source.
- Deploying to testing/staging environments by pulling pre-built images from Azure Container Registry (ACR).
- Optionally enabling comprehensive observability tools (monitoring, logging, tracing).

---

## Prerequisites

Before you begin, ensure you have the following installed:

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (includes Docker Engine and Docker Compose)
- Access to your Azure Container Registry (ACR) if you plan to use pre-built images.
- A `.env` file (see [Managing Environment Variables](#managing-environment-variables)).
- A `secrets/` directory with the necessary secret files (see [Managing Secrets](#managing-secrets)).

---

## File Structure

The Docker Compose configuration is split into the following files:

### `docker-compose.yml`
- **Base Application Services**: Defines the core `api`, `frontend`, and `mongodb` services with their common configurations (ports, volumes, environment variable placeholders, networks, health checks).
- **Global Anchors**: Contains reusable YAML anchors (`x-defaults`, `x-healthcheck-curl`, `x-healthcheck-wget`).
- **Common Volumes & Secrets**: Declares all named volumes and secrets used across all services.
- Does **not** specify `build` or `image` for `api` and `frontend`, allowing these to be overridden.

### `docker-compose.override.local.yml`
- **Local Development Override**: Specifies the `build` instruction for `api` and `frontend`, telling Docker Compose to build these images from their local Dockerfiles.
- Can also contain environment-specific overrides for local development (e.g., `ASPNETCORE_ENVIRONMENT: "Development"`).

### `docker-compose.override.acr.yml`
- **ACR Image Pull Override**: Specifies the `image` instruction for `api` and `frontend`, instructing Docker Compose to pull pre-built images from your Azure Container Registry.
- Useful for testing, staging, or production environments where images are already built and pushed by your CI/CD pipeline.

> **Warning:**
> Remember to update `youracrname.azurecr.io` with your actual ACR login server!

### `docker-compose.override.observability.yml`
- **Observability Services**: Defines all monitoring, logging, and tracing services (`mongo-exporter`, `otel-collector`, `prometheus`, `grafana`, `jaeger`, `loki`, `node_exporter`, `seq`, `etcd`, `postgres-1`, `postgres-2`, `haproxy`, `redis-primary`, `redis-replica`, `redis-sentinel-1`, `grafana-nginx`).
- These services are configured to use specific profiles: `["monitoring"]`, allowing them to be started selectively.

---

## How to Run

Docker Compose uses the `-f` flag to combine multiple Compose files. The order matters: files specified later will override definitions in earlier files for the same service.

### Running Core App Services (Local Build)

```bash
docker compose --profile app -f docker-compose.yml -f docker-compose.override.local.yml up --build --wait
```

To stop:

```bash
docker compose --profile app -f docker-compose.yml -f docker-compose.override.local.yml down
```

### Running Core App Services (ACR Images)

First, log in to your Azure Container Registry:

```bash
docker login youracrname.azurecr.io
```

(Replace `youracrname.azurecr.io` with your actual ACR login server. You'll be prompted for username/password or token.)

Then, run Docker Compose:

```bash
docker compose --profile app -f docker-compose.yml -f docker-compose.override.acr.yml up --pull always --wait
```

To stop:

```bash
docker compose --profile app -f docker-compose.yml -f docker-compose.override.acr.yml down
```

### Running Core App Services (Local Build) + Observability

```bash
docker compose --profile app --profile monitoring -f docker-compose.yml -f docker-compose.override.local.yml -f docker-compose.override.observability.yml up --build --wait
```

To stop:

```bash
docker compose --profile app --profile monitoring -f docker-compose.yml -f docker-compose.override.local.yml -f docker-compose.override.observability.yml down
```

### Running Core App Services (ACR Images) + Observability

> **Note:**
> Ensure you are logged into ACR (see [Running Core App Services (ACR Images)](#running-core-app-services-acr-images)).

```bash
docker compose --profile app --profile monitoring -f docker-compose.yml -f docker-compose.override.acr.yml -f docker-compose.override.observability.yml up --pull always --wait
```

To stop:

```bash
docker compose --profile app --profile monitoring -f docker-compose.yml -f docker-compose.override.acr.yml -f docker-compose.override.observability.yml down
```

---

# Kubernetes Setup

## BJJ Application Deployment to Minikube

This repository contains the necessary scripts and Helm charts to deploy the **BJJ application**, consisting of a **Backend API** and a **Frontend UI**, to a local **Minikube Kubernetes cluster**.

The deployment automates the following tasks:

### 🚀 Deployment Overview
- **Minikube Initialization**: Starts a Minikube cluster using the Docker driver.
- **Docker Image Management**: Builds local Docker images for the API and Frontend services and loads them into Minikube's Docker daemon.
- **Kubernetes Resource Creation**: Sets up a dedicated namespace and creates necessary secrets for certificates and database passwords.
- **Ingress Controller Deployment**: Installs the NGINX Ingress Controller to manage external access to the services.
- **Helm Chart Deployment**: Deploys the application services (API, Frontend, MongoDB) using a Helm chart configured for local development.
- **Local DNS Configuration**: Updates your `/etc/hosts` file to enable local domain access (e.g., `app.bjj.local`, `api.bjj.local`).

---

## 📋 Prerequisites

Before you begin, ensure you have the following tools installed on your system:

- **Minikube**: [Installation Guide](https://minikube.sigs.k8s.io/docs/start/)
- **Kubectl**: [Installation Guide](https://kubernetes.io/docs/tasks/tools/)
- **Helm**: [Installation Guide](https://helm.sh/docs/intro/install/)
- **Docker**: [Installation Guide](https://docs.docker.com/get-docker/)

---

## 🛠️ Local Setup and Deployment

Follow these steps to deploy the BJJ application to your local Minikube cluster:

1. **Clone the Repository**

```bash
git clone <your-repository-url>
cd <your-repository-name>
```

2. **Run the Deployment Script**

Execute the main deployment script. This script will automate all the necessary steps, from starting Minikube to deploying your application.

```bash
./setup-helm.sh
./setup-minikube.sh
```

The script will provide output at each stage of the deployment process. Please be patient, as some steps (like Minikube startup or image building) can take a few minutes.

> ⚠️ **Important Note for sudo on macOS/Linux**
> The script modifies your `/etc/hosts` file, which requires sudo permissions. You will be prompted to enter your password during this step.

---

## Helm Chart

The application's Kubernetes manifests are managed via a Helm chart located at `charts/bjj-app`.

The `values-local.yaml` file (located at `charts/bjj-app/values-local.yaml`) provides the specific configurations for this local Minikube deployment, including:

- Image names and tags
- Service types (`ClusterIP`)
- Ingress rules for `api.bjj.local` and `app.bjj.local`
- Resource requests and limits for API, Frontend, and MongoDB
- Environment variables specific to the local environment
- Persistent Volume Claim for MongoDB
- Mount paths for application certificates

---

## Local DNS (`/etc/hosts`)

The `deploy-local.sh` script automatically updates your system's `/etc/hosts` file with entries that map:

- `api.bjj.local`
- `app.bjj.local`

to your Minikube cluster's IP address. This allows you to access the application using these friendly domain names.

---

For troubleshooting, verification, and cleanup instructions, see [charts/README.md](charts/README.md).


# React Component Testing Cheatsheet (Vite + TypeScript)

This guide provides a summary of best practices for writing unit and component tests for React applications built with Vite and TypeScript, using Vitest and React Testing Library (RTL).

## Core Philosophy: Test Like a User

The goal is to write tests that resemble how users interact with your application. This ensures your tests are resilient to implementation changes (like refactoring or changing state management) and give you confidence that the application works for the user.

## 1. The Querying Priority Guide

Always try to select elements the way a user would. Use the following priority order. Use `data-testid` only as a last resort.

| Priority       | Query Type                | Why It's Good                                                                 |
|----------------|---------------------------|-------------------------------------------------------------------------------|
| **1. User-Facing** | `getByRole()`            | The most user-centric query. Tests accessibility (ARIA roles).                |
|                | `getByLabelText()`       | Excellent for form fields. Finds the input associated with a label.           |
|                | `getByPlaceholderText()` | A good fallback for form fields without visible labels.                      |
|                | `getByText()`            | Finds non-interactive elements (divs, spans, paragraphs).                    |
|                | `getByDisplayValue()`    | Finds form elements by their current value (e.g., an input with text).       |
| **2. Semantic**    | `getByAltText()`         | For images (`<img alt="...">`). Tests for accessibility.                     |
|                | `getByTitle()`           | For elements with a title attribute (e.g., tooltips).                        |
| **3. Escape Hatch** | `data-testid`            | Use only as a last resort when no other query method is feasible.             |

2. Writing Tests: Do's and Don'ts
✅ Do: Structure Tests Logically
Use describe blocks to group related tests by feature or state. Use the Arrange-Act-Assert (AAA) pattern to keep tests clean and readable.

```typescript
// Good: Clear structure
describe('MyComponent', () => {
  describe('When in a loading state', () => {
    it('should display the loading spinner', () => {
      // Arrange
      render(<MyComponent isLoading={true} />);
      // Act
      const spinner = screen.getByTestId('loading-spinner');
      // Assert
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('With data', () => {
    // ...
  });
});
```

✅ Do: Test for What the User Sees
Assert against the final, rendered output. If your component transforms data (e.g., an enum to a string, a number to a formatted currency), test the final string.

```typescript
// Component transforms a status enum to a label
render(<StatusBadge status={Status.PendingApproval} />);

// Good: Test the final output
expect(screen.getByText('Pending Approval')).toBeInTheDocument();

// Bad: This doesn't test the component's transformation logic
// expect(props.status).toBe(Status.PendingApproval);
```
❌ Don't: Test Implementation Details
Avoid testing internal state, component methods, or child component implementations.
```typescript
// Bad: Testing internal state is brittle.
// const { result } = renderHook(() => useCounter());
// expect(result.current.count).toBe(1);
```

✅ Do: Use queryBy* to Assert Absence
To verify an element is not in the DOM, use queryBy*. It returns null if not found and doesn't throw an error.

```typescript
// Good: Verifying an element is not rendered
render(<MyComponent showDetails={false} />);
expect(screen.queryByText('Detailed Information')).not.toBeInTheDocument();
```

❌ Don't: Use getBy* to Assert Absence
getBy* will throw an error if the element isn't found, which is not what you want for this kind of assertion.

```typescript
// Bad: This will throw an error and fail the test incorrectly.
// expect(screen.getByText('Detailed Information')).not.toBeInTheDocument();
```

✅ Do: Scope Queries with within
When multiple similar elements exist, first find a unique parent container and use within() to run queries only inside that container. This prevents ambiguous matches.
```typescript
render(
  <>
    <Card data-testid="card-1" title="First Card" />
    <Card data-testid="card-2" title="Second Card" />
  </>
);

const card2 = screen.getByTestId('card-2');
// Good: This query only looks inside the second card.
const heading = within(card2).getByRole('heading', { name: 'Second Card' });
expect(heading).toBeInTheDocument();
```

3. Mocking: Do's and Don'ts
✅ Do: Mock Child Components and API Calls
Isolate the component you are testing. Mocking children and API calls makes your tests faster, more stable, and focused.

API Calls: Use Mock Service Worker (MSW). It's the industry standard and lets your components work as they do in the browser without knowing they are in a test.

Child Components: Use vi.mock() to provide a simple placeholder.
```typescript
// Good: Mocking a child component
vi.mock('./../ui/complex-chart', () => ({
  ComplexChart: vi.fn(() => <div data-testid="mock-chart" />),
}));

it('should render the chart', () => {
  render(<Dashboard />);
  expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
});
```

❌ Don't: Mock Simple Utility Functions
If a component uses a simple, pure utility function (e.g., getClassCategoryLabel), import and use it in your test. This ensures your test stays in sync with the component's logic.
```typescript
import { getClassCategoryLabel } from './../../utils';
import { ClassCategory } from './../../types';

it('should display the correct label', () => {
    render(<ClassBadge category={ClassCategory.Wrestling} />);
    // Good: Using the real utility keeps the test and component aligned.
    const expectedLabel = getClassCategoryLabel(ClassCategory.Wrestling);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
});
```

4. Using data-testid The Right Way
✅ Do: Centralize Test IDs
Keep all data-testid strings in a single, shared constants file (constants/dataTestIds.ts). This makes them reusable, maintainable, and less prone to typos.
```typescript
// In constants/dataTestIds.ts
export const GymsListTestIds = {
  ROOT: (id = '') => `gyms-list-${id}`,
  LOADING: (id = '') => `gyms-list-loading-${id}`,
};

// In gym-list.test.ts
import { GymsListTestIds } from './../../constants';
screen.getByTestId(GymsListTestIds.LOADING());
```
❌ Don't: Overuse data-testid
Only use data-testid when no other accessible query works. It's an "escape hatch," not the default. Always prefer getByRole, getByLabelText, etc., first.

UI component testing, particularly with React Testing Library (RTL) and Vitest in a Vite + TypeScript environment, should focus on user interactions and observable outcomes. Below are best practices for deciding what to test and what to avoid, ensuring tests are meaningful, maintainable, and resilient to refactoring.

## What to Test?

Focus on testing the **user experience** and **behavior** of your components as a user would interact with them. Prioritize tests that verify functionality critical to the application's usability and accessibility.

1. **User-Visible Behavior**
   - Test what the user sees and interacts with, such as rendered text, buttons, links, or form fields.
   - Example: For your `GymDetails` component, verify that the location link has the correct `href` attribute based on `MOCK_GYM_FULL.location`.
     ```typescript
     const locationSection = screen.getByLabelText(/Location:/);
     const locationLink = within(locationSection).getByRole('link');
     expect(locationLink).toHaveAttribute('href', getGoogleMapsUrl(MOCK_GYM_FULL.location));
     ```

2. **Interactions and State Changes**
   - Test how the component responds to user actions like clicks, form submissions, or keyboard events.
   - Example: If a button toggles a section's visibility, test that the section appears/disappears after clicking.
     ```typescript
     const button = screen.getByRole('button', { name: /toggle details/i });
     fireEvent.click(button);
     expect(screen.getByText(/details content/i)).toBeInTheDocument();
     ```

3. **Conditional Rendering**
   - Test how the component renders under different conditions (e.g., with or without data, loading states, or error states).
   - Example: For `GymDetails`, verify that the affiliation link is not rendered if `MOCK_GYM_FULL.affiliation` is `undefined`.
     ```typescript
     const affiliationSection = screen.getByLabelText(/Affiliation:/);
     const affiliationLink = within(affiliationSection).queryByRole('link');
     if (MOCK_GYM_FULL.affiliation) {
       expect(affiliationLink).toHaveAttribute('href', MOCK_GYM_FULL.affiliation.website);
     } else {
       expect(affiliationLink).toBeNull();
     }
     ```

4. **Accessibility**
   - Ensure components are accessible by testing ARIA roles, labels, and keyboard navigation.
   - Example: Verify that interactive elements like buttons or links have appropriate ARIA roles.
     ```typescript
     expect(screen.getByRole('link', { name: /visit affiliation/i })).toBeInTheDocument();
     ```

5. **Edge Cases**
   - Test how the component handles edge cases, such as empty data, invalid inputs, or missing props.
   - Example: Render `GymDetails` with an empty `gym` object and verify a fallback UI (e.g., "No data available").
     ```typescript
     render(<GymDetails gym={{} as GymDto} />);
     expect(screen.getByText(/no data available/i)).toBeInTheDocument();
     ```

6. **Integration with External Functions**
   - Test that the component correctly calls external functions (e.g., `getGoogleMapsUrl`) with the right arguments.
   - Example: Verify that `getGoogleMapsUrl` is called with `MOCK_GYM_FULL.location`.
     ```typescript
     expect(getGoogleMapsUrl).toHaveBeenCalledWith(MOCK_GYM_FULL.location);
     ```

## What Not to Test

Avoid testing implementation details or scenarios that don't directly impact the user experience. Over-testing implementation details leads to brittle tests that break during refactoring, even if the UI behavior remains unchanged.

1. **Internal State or Implementation Details**
   - Don't test internal state, hooks, or component logic (e.g., `useState`, `useEffect`) directly. Focus on the rendered output instead.
   - Bad Example: Testing that a specific state variable is set to a value.
     ```typescript
     // Avoid: Testing internal state
     expect(component.state.someValue).toBe(true);
     ```
   - Good Example: Test the rendered output of the state change.
     ```typescript
     expect(screen.getByText(/value is true/i)).toBeInTheDocument();
     ```

2. **CSS Classes or Styling**
   - Don't test specific CSS classes or styles unless they directly affect user experience (e.g., visibility).
   - Bad Example: Testing that a div has a specific class.
     ```typescript
     expect(element).toHaveClass('gym-details-container');
     ```
   - Good Example: Test that the element is visible or hidden based on user interaction.
     ```typescript
     expect(screen.getByRole('region', { name: /details/i })).toBeVisible();
     ```

3. **Third-Party Library Internals**
   - Don't test the internals of libraries like React Router, Redux, or external APIs. Mock these dependencies and test how your component interacts with them.
   - Example: Mock `getGoogleMapsUrl` and verify it was called, not its internal logic.
     ```typescript
     jest.mock('./utils', () => ({
       getGoogleMapsUrl: jest.fn(() => 'https://maps.google.com/...'),
     }));
     ```

4. **Exact DOM Structure**
   - Avoid testing the exact DOM hierarchy or structure (e.g., specific parent-child relationships). Focus on what the user sees.
   - Bad Example: Testing that a `div` contains a specific nested `span`.
     ```typescript
     expect(screen.getByRole('region').querySelector('div > span')).toBeInTheDocument();
     ```
   - Good Example: Test the presence of the content, regardless of structure.
     ```typescript
     expect(screen.getByText(/gym details/i)).toBeInTheDocument();
     ```

5. **Unrealistic Scenarios**
   - Don't test scenarios that are impossible from a user's perspective (e.g., passing invalid prop types that TypeScript would catch).
   - Bad Example: Testing a component with a prop that violates its TypeScript interface.
     ```typescript
     render(<GymDetails gym={null} />); // TypeScript would prevent this
     ```

6. **Overly Specific Assertions**
   - Avoid overly precise assertions that make tests brittle, such as exact string matches for long text or specific render counts.
   - Bad Example: Testing the exact text content of a paragraph.
     ```typescript
     expect(screen.getByText('Elite Fighters Academy is a top-tier BJJ and MMA training facility.')).toBeInTheDocument();
     ```
   - Good Example: Use partial matches or regex for flexibility.
     ```typescript
     expect(screen.getByText(/top-tier BJJ/i)).toBeInTheDocument();
     ```

## Additional Best Practices

- **Follow the Querying Priority Guide** (from your cheatsheet):
  - Use `getByRole`, `getByLabelText`, etc., to select elements in a user-centric way.
  - Reserve `data-testid` for cases where no semantic or user-facing query is possible.

- **Keep Tests Focused**:
  - Each test should verify one specific behavior or outcome to make debugging easier.
  - Example: Separate tests for location link rendering and affiliation link rendering.

- **Mock Dependencies**:
  - Mock external dependencies (e.g., APIs, utilities) to isolate the component's behavior.
  - Example: Mock `getGoogleMapsUrl` to avoid testing its implementation.
    ```typescript
    jest.mock('./utils', () => ({
      getGoogleMapsUrl: jest.fn(() => 'https://maps.google.com/...'),
    }));
    ```

- **Use TypeScript for Safety**:
  - Leverage TypeScript to catch prop-related errors at compile time, reducing the need for runtime prop tests.
  - Example: Ensure `GymDto` has required fields or handle optional fields like `affiliation` explicitly.

- **Test for Resilience**:
  - Write tests that don't break when you refactor the component (e.g., changing from `useState` to Redux).
  - Focus on inputs (props, user events) and outputs (rendered UI, side effects).

- **Maintain Readability**:
  - Use descriptive test names and organize tests with `describe` blocks.


## Conclusion

By focusing on user-facing behavior, accessibility, and edge cases, and avoiding implementation details, your UI component tests will be robust and maintainable. Use the querying priority guide from your cheatsheet to select elements in a user-centric way, and leverage TypeScript to catch errors early. Keep tests focused, mock dependencies, and ensure they reflect real user interactions.

