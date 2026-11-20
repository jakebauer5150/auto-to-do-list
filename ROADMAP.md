# Roadmap

## Milestone 1 — Establish the app foundation

- Define the shared task shape for pasted Canvas assignments and custom tasks, including title, due date, source, course context where available, optional duration, and app-local completion state.
- Create the HTML page structure, CSS styling, and JavaScript entry point.
- Add browser persistence for custom tasks and app-local completion state.
- Build the combined task-list view and its due-date ordering behavior.

## Milestone 2 — Complete the custom-task workflow

- Add a quick-add form with a task-title field and calendar date selector.
- Save custom tasks and show them alongside the other task sources.
- Allow the user to check off and reopen a custom task.
- Support optional task-length estimates without requiring them to add or recommend a task.
- Show sensible empty and overdue states in the list.

## Milestone 3 — Import Canvas dashboard content

- Add a paste area for text copied from the user's Canvas calendar dashboard.
- Parse assignment titles, due dates, and course names when available.
- Show a review step so the user can confirm or correct parsed items before importing them.
- Handle empty, malformed, and duplicate pasted items clearly.
- Merge Canvas assignments and custom tasks into one chronological priority order.
- Keep Canvas completion changes local to the app; do not submit work or update Canvas.
- Provide a clear empty state and allow the user to paste updated dashboard content again.

## Milestone 4 — Add recommendations and finish the first draft

- Select a small number of top tasks from the combined list using due-date priority.
- Ensure recommendations still work when task-length estimates are missing.
- Make the recommended tasks easy to check off from the recommendation area.
- Review the key flows: add a custom task, paste and review Canvas assignments, sort together, and mark either source complete locally.
- Refine layout and responsive behavior for common browser sizes, then document how to run and configure the app.

## Later milestones

- Add repeating tasks.
- Add variety-aware recommendations based on recently completed task types.
- Consider time-slot recommendations only if the app later gains a reliable source of availability data.
