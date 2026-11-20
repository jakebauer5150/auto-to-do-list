# Milestone 1 Draft — App Foundation

## Objective

Create the smallest usable foundation for the Canvas-aware to-do list: a browser app with a shared task model, local persistence, and one list that combines task sources and sorts dated items by urgency.

## User outcome

When the app opens, the user can see saved tasks in one place, with the soonest due dates first. Tasks remain available after the browser is reopened. A task can represent either a custom item or a Canvas assignment, even before the Canvas connection is implemented.

## Scope

- Create the initial HTML page, CSS, and JavaScript entry point.
- Define one task shape for both custom tasks and Canvas assignments.
- Store custom task data and app-local completion state in browser storage.
- Render the combined task list, including an empty state.
- Sort dated tasks by earliest due date; show overdue tasks first and undated tasks after dated tasks.
- Keep completion state local to this app.
- Record a safe Canvas authorization approach for the browser-only constraint before Canvas integration begins.

## Shared task shape

```js
{
  id: "stable-app-generated-id",
  title: "Read chapter 4",
  dueDate: "2026-11-20", // ISO calendar date, or null when the source has no due date
  source: "custom", // "custom" | "canvas"
  courseName: null, // Canvas course name; null for custom tasks
  estimatedMinutes: null, // optional; recommendations must not depend on this
  completed: false, // app-local state only
  createdAt: "2026-11-13T18:00:00.000Z"
}
```

The app should preserve a stable `id` and keep source-specific details optional. Canvas fields should not be required to render a custom task.

## Canvas access decision

The app must not contain a Canvas client secret or a manually copied private credential in source files. Canvas's OAuth documentation describes exchanging the authorization code using a client ID and client secret. A static browser app cannot keep a client secret confidential, so the intended deployment and authorization route must be confirmed before Milestone 3.

For Milestone 1, document the deployment assumption and choose one route to investigate:

1. A small trusted server component handles the OAuth code exchange and protects the client secret; or
2. An institution-supported public-client authorization flow is confirmed to work for the target Canvas instance.

If neither route fits the browser-only requirement, revisit the architecture before committing to Canvas integration. Do not silently substitute an embedded client secret or a broad personal access token.

Reference: [Canvas OAuth2 documentation](https://canvas.instructure.com/doc/api/file.oauth.html).

## Acceptance criteria

- The app opens directly in a modern browser without a build step.
- The task list renders from a single shared task shape for both sources.
- Dated items sort chronologically, with overdue items before future items; undated items follow dated items.
- Equal due dates have a stable, predictable order.
- Custom task data and app-local completion state survive a browser refresh.
- A missing or invalid saved-data value does not prevent the page from opening; the app presents an empty usable list.
- The initial view includes a clear empty state and makes the list structure understandable before any tasks are added.
- No Canvas write operation is included, and the app does not claim that local completion marks an assignment complete in Canvas.
- The Canvas authorization route and hosting assumption are recorded for the next milestone.

## Not included in this milestone

- The custom-task entry form and full edit/delete workflow.
- Live Canvas authorization, course discovery, or assignment retrieval.
- Recommendations, calendar availability, recurring tasks, or variety-aware prioritization.
- Any submission or status update back to Canvas.

## Suggested implementation sequence

1. Establish the page shell and task-list layout.
2. Implement task normalization, date sorting, and stable tie handling.
3. Add browser storage with safe handling for empty or unreadable saved data.
4. Render empty, dated, overdue, and undated task states using sample in-memory tasks.
5. Record the hosting and Canvas authorization decision needed before integration work.

## Decisions to carry forward

- Target browser and minimum screen width.
- Whether browser storage uses `localStorage` for the first draft or another local store.
- Where the app will be hosted, since this affects the viable Canvas authorization route.
- Whether tasks without due dates should remain visible at the end of the list (assumed yes here).
