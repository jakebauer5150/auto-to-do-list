# Milestone 1 implementation notes

## Hosting and Canvas authorization

For this milestone, the app is a static browser prototype opened directly from `index.html`; task data stays in that browser's local storage. Before Canvas integration, first investigate whether the target institution supports an OAuth public-client flow suitable for a browser app. The browser app must never contain a client secret or a manually copied private credential. If the institution does not support that route, revisit the browser-only deployment assumption before proceeding; a trusted server-side OAuth exchange would require changing the hosting architecture.

Canvas access is not implemented here. Completion marks are local to this app and do not update Canvas.

## Task storage

Tasks use the shared fields: `id`, `title`, `dueDate`, `source`, `courseName`, `estimatedMinutes`, `completed`, and `createdAt`. A first visit opens to an empty list. The optional, clearly labeled preview list makes sorting, overdue dates, both task sources, completion, and undated items visible. Clearing the examples removes only preview entries and preserves tasks the user added. Saved data is validated on load; malformed or unreadable data falls back to an empty list.

## Milestone 2 — Custom tasks

The quick-add form requires a task title and due date. An estimate in minutes is optional. New tasks use the shared task shape, are saved in local storage, and appear in due-date order. Their completion checkbox is app-local and can be toggled to reopen the task. A list-level overdue message appears when at least one incomplete task is past due.

## Milestone 3 — Canvas dashboard paste

The Canvas importer accepts copied text only; it does not connect to Canvas. It normalizes regular line breaks, escaped `\n` sequences, and backslash-separated clipboard text. It scans date headings such as `Today`, `Tomorrow, November 21`, and `Monday, November 23`, then pairs an `Assignment` or `Page` descriptor with the next readable title and its `Due:` or `To Do:` line. Canvas navigation, loading indicators, point values, and status-only lines such as `Submitted` are ignored. Items without a recognized calendar date, title, and due marker are skipped with a clear no-results message when nothing can be parsed.

Parsed items appear in an editable review list before import. The user can change title, course, and due date, or uncheck items to leave them out. Exact course/title/date matches against existing Canvas tasks or earlier rows in the same paste are flagged as possible duplicates and unchecked by default; the user can deliberately reselect one. Selected Canvas items use the shared task shape and are added to the same locally stored, due-date-sorted list. Re-pasting updated dashboard text remains available after import. Canvas completion checkboxes remain app-local.
