# Project Plan: Canvas-Aware To-Do List

## Goal

Build a small browser-based to-do app that helps the user choose what to work on next while keeping one dependable, date-prioritized list of coursework and personal tasks.

## First-draft scope

- Use only HTML, CSS, and JavaScript; the app runs in a browser.
- Let the user paste the contents of their Canvas calendar dashboard into the app; parse assignment titles and due dates from the pasted text.
- Let the user add custom tasks with a title and a calendar date selector.
- Show Canvas assignments and custom tasks together in one list, ordered by due date, with the most urgent items first.
- Let the user check off or reopen tasks. Completion of a Canvas assignment is recorded in this app only and does not submit or update anything in Canvas.
- Offer a small set of recommended tasks based on due-date priority. Task-length estimates may be supported as optional information, but recommendations must still work when an estimate is missing.

## Product boundaries

- Canvas calendar events are not treated as busy blocks and are not used to calculate open work periods. Canvas due dates inform task ordering.
- Repeating tasks are out of scope for this draft.
- Recommendations based on variety or recently completed task types are out of scope for this draft.
- Calendar-aware time-slot matching is out of scope for this draft.
- The app does not write assignment status, submissions, or other changes back to Canvas.

## Initial behavior assumptions

- Sort dated items by the earliest due date first; overdue work therefore appears ahead of future work.
- Custom tasks have a due date selected when they are added.
- The recommended tasks are drawn from the same combined, due-date-sorted list.
- Canvas data is supplied by copy and paste from the user's calendar dashboard; the app does not sign in to Canvas or connect to its account APIs.

## First-draft success criteria

- A user can add a dated custom task and see it in the correct place in the combined list.
- Pasted Canvas dashboard content is parsed into assignment items with due dates, with a way to review or correct the parsed results before adding them.
- The user can mark either kind of item complete in the app without changing Canvas.
- The app can surface a few high-priority tasks using due dates, including when task estimates are absent.
- The app handles empty or unrecognized pasted content with a clear message and lets the user try again.
