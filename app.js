(function () {
  'use strict';

  const STORAGE_KEY = 'next-up.tasks.v1';
  const listElement = document.querySelector('#task-list');
  const emptyElement = document.querySelector('#empty-state');
  const overdueNote = document.querySelector('#overdue-note');
  const summaryElement = document.querySelector('#task-summary');
  const recommendationList = document.querySelector('#recommendation-list');
  const recommendationEmpty = document.querySelector('#recommendation-empty');
  const quickAddForm = document.querySelector('#quick-add-form');
  const formFeedback = document.querySelector('#form-feedback');

  function localDateOffset(days) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  function isTask(value) {
    if (!value || typeof value !== 'object') return false;
    const dueDateValid = value.dueDate === null || (typeof value.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.dueDate) && (() => {
      const [year, month, day] = value.dueDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    })());
    return typeof value.id === 'string' && value.id.length > 0 &&
      typeof value.title === 'string' && value.title.trim().length > 0 && dueDateValid &&
      (value.source === 'custom' || value.source === 'canvas') &&
      (value.courseName === null || typeof value.courseName === 'string') &&
      (value.estimatedMinutes === null || (typeof value.estimatedMinutes === 'number' && Number.isFinite(value.estimatedMinutes) && value.estimatedMinutes >= 0)) &&
      typeof value.completed === 'boolean' && typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt));
  }

  function loadTasks() {
    let saved;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return { tasks: [] };
    }
    if (saved === null) {
      return { tasks: [] };
    }
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || !parsed.every(isTask)) return { tasks: [] };
      const tasks = parsed.filter((task) => !task.id.startsWith('preview-'));
      if (tasks.length !== parsed.length) saveTasks(tasks);
      return { tasks };
    } catch (_) {
      return { tasks: [] };
    }
  }

  function saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (_) {
      return false;
    }
  }

  function dateValue(isoDate) {
    if (!isoDate) return Number.POSITIVE_INFINITY;
    const parts = isoDate.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]).getTime();
  }

  function sortTasks(tasks) {
    return [...tasks].sort((a, b) => {
      const dueDifference = dateValue(a.dueDate) - dateValue(b.dueDate);
      if (dueDifference !== 0) return dueDifference;
      const createdDifference = Date.parse(a.createdAt) - Date.parse(b.createdAt);
      if (Number.isFinite(createdDifference) && createdDifference !== 0) return createdDifference;
      return a.id.localeCompare(b.id);
    });
  }

  function formatToday(date) {
    return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekdayNames = 'Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday';

  function toIsoDate(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  function parseMonthDay(value, previousDate) {
    const monthPattern = monthNames.join('|');
    const match = value.match(new RegExp(`^(${monthPattern})\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?$`, 'i'));
    if (!match) return null;
    const month = monthNames.findIndex((name) => name.toLowerCase() === match[1].toLowerCase());
    const day = Number(match[2]);
    let year = match[3] ? Number(match[3]) : (previousDate ? previousDate.getFullYear() : new Date().getFullYear());
    if (!match[3] && previousDate && month < previousDate.getMonth()) year += 1;
    const parsed = new Date(year, month, day);
    if (parsed.getFullYear() !== year || parsed.getMonth() !== month || parsed.getDate() !== day) return null;
    return parsed;
  }

  function readDateHeading(lines, index, previousDate) {
    const line = lines[index].trim();
    if (/^Today$/i.test(line)) {
      const following = lines[index + 1] ? parseMonthDay(lines[index + 1].trim(), previousDate) : null;
      if (following) return { date: following, consumed: 1 };
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return { date: today, consumed: 0 };
    }
    if (/^Tomorrow$/i.test(line)) {
      const following = lines[index + 1] ? parseMonthDay(lines[index + 1].trim(), previousDate) : null;
      if (following) return { date: following, consumed: 1 };
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return { date: tomorrow, consumed: 0 };
    }

    const labeled = line.replace(new RegExp(`^(?:${weekdayNames})\\s*,\\s*`, 'i'), '').replace(/^Tomorrow,?\s*/i, '');
    const parsed = parseMonthDay(labeled, previousDate);
    return parsed ? { date: parsed, consumed: 0 } : null;
  }

  function isCanvasDescriptor(line) {
    return /^.+\s+(?:Assignment|Page)$/i.test(line.trim());
  }

  function getCanvasDescriptor(line) {
    const match = line.trim().match(/^(.+?)\s+(Assignment|Page)$/i);
    return match ? { courseName: match[1].trim(), itemType: match[2] } : null;
  }

  function isCanvasNoise(line) {
    return !line || /^(?:Skip To Content|Dashboard|Account|Courses|Groups|Calendar|Inbox|History|BYU Canvas Info\s*&\s*Help|Load prior dates|Load more|By Instructure|Privacy Policy|Cookie Notice|Acceptable Use Policy|Facebook|X\.com|Nothing Planned Yet|Graded|Submitted|Replies?)$/i.test(line) ||
      /^\d+$/.test(line) || /^loading\s*\d+\s*items?\s*loaded$/i.test(line) || /^\d+(?:\.\d+)?\s*(?:pts?|points?)$/i.test(line);
  }

  function parseCanvasDashboard(text) {
    let normalized = String(text || '').replace(/\\n/g, '\n').replace(/\\+/g, '\n').replace(/\r/g, '\n');
    normalized = normalized.replace(/loading\s*\d+\s*items?\s*loaded/gi, '\n');
    const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean);
    const parsed = [];
    let activeDate = null;

    for (let index = 0; index < lines.length; index += 1) {
      const dateHeading = readDateHeading(lines, index, activeDate);
      if (dateHeading) {
        activeDate = dateHeading.date;
        index += dateHeading.consumed;
        continue;
      }

      const descriptor = getCanvasDescriptor(lines[index]);
      if (!descriptor) continue;
      const titleLines = [];
      let dueDate = null;
      for (let scan = index + 1; scan < lines.length; scan += 1) {
        const line = lines[scan];
        if (readDateHeading(lines, scan, activeDate) || isCanvasDescriptor(line)) break;
        if (/^(?:Due|To Do):/i.test(line)) {
          if (activeDate) dueDate = toIsoDate(activeDate);
          break;
        }
        if (!titleLines.length && !isCanvasNoise(line) && !/^(?:Due|To Do):/i.test(line)) titleLines.push(line);
      }

      if (titleLines.length && dueDate) {
        parsed.push({
          id: `canvas-review-${parsed.length + 1}`,
          title: titleLines[0],
          dueDate,
          courseName: descriptor.courseName || '',
          itemType: descriptor.itemType,
          included: true,
          isDuplicate: false
        });
      }
    }
    return parsed;
  }

  function taskFingerprint(task) {
    const normalize = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
    return [normalize(task.courseName), normalize(task.title), task.dueDate || ''].join('|');
  }

  function createReviewRow(item) {
    const row = document.createElement('div');
    row.className = 'review-row';
    item.row = row;

    const include = document.createElement('input');
    include.type = 'checkbox';
    include.className = 'review-include';
    include.checked = item.included;
    include.setAttribute('aria-label', `Import ${item.title}`);
    include.addEventListener('change', () => {
      item.included = include.checked;
    });

    const fields = document.createElement('div');
    fields.className = 'review-fields';

    const titleWrap = document.createElement('label');
    titleWrap.className = 'review-field review-title-field';
    const titleLabel = document.createElement('span');
    titleLabel.textContent = `${item.itemType} title`;
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.maxLength = 180;
    titleInput.required = true;
    titleInput.value = item.title;
    const duplicateBadge = document.createElement('span');
    duplicateBadge.className = 'duplicate-badge';
    duplicateBadge.textContent = 'Possible duplicate';
    duplicateBadge.hidden = true;
    titleWrap.append(titleLabel, titleInput, duplicateBadge);

    const courseField = document.createElement('label');
    courseField.className = 'review-field';
    const courseLabel = document.createElement('span');
    courseLabel.textContent = 'Course';
    const courseInput = document.createElement('input');
    courseInput.type = 'text';
    courseInput.maxLength = 120;
    courseInput.value = item.courseName;
    courseField.append(courseLabel, courseInput);

    const dateField = document.createElement('label');
    dateField.className = 'review-field review-date-field';
    const dateLabel = document.createElement('span');
    dateLabel.textContent = 'Due date';
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.required = true;
    dateInput.value = item.dueDate;
    dateField.append(dateLabel, dateInput);

    titleInput.addEventListener('input', () => {
      item.title = titleInput.value;
      refreshDuplicateWarnings();
    });
    courseInput.addEventListener('input', () => {
      item.courseName = courseInput.value;
      refreshDuplicateWarnings();
    });
    dateInput.addEventListener('input', () => {
      item.dueDate = dateInput.value;
      refreshDuplicateWarnings();
    });

    item.includeInput = include;
    item.duplicateBadge = duplicateBadge;
    fields.append(titleWrap, courseField, dateField);
    row.append(include, fields);
    return row;
  }

  function refreshDuplicateWarnings() {
    const existing = new Set(state.tasks.filter((task) => task.source === 'canvas').map(taskFingerprint));
    const seenInPaste = new Set();
    let duplicateCount = 0;
    state.reviewItems.forEach((item) => {
      const fingerprint = taskFingerprint(item);
      const duplicate = existing.has(fingerprint) || seenInPaste.has(fingerprint);
      if (duplicate && !item.isDuplicate) item.included = false;
      item.isDuplicate = duplicate;
      if (duplicate) duplicateCount += 1;
      seenInPaste.add(fingerprint);
      item.row.classList.toggle('is-duplicate', duplicate);
      item.duplicateBadge.hidden = !duplicate;
      item.includeInput.checked = item.included;
      item.includeInput.setAttribute('aria-label', `${item.included ? 'Include' : 'Do not include'} ${item.title}${duplicate ? ', possible duplicate' : ''}`);
    });
    const count = state.reviewItems.length;
    document.querySelector('#review-summary').textContent = `${count} ${count === 1 ? 'item' : 'items'} found${duplicateCount ? ` · ${duplicateCount} possible ${duplicateCount === 1 ? 'duplicate' : 'duplicates'}` : ''}`;
  }

  function renderReview() {
    const list = document.querySelector('#review-list');
    list.replaceChildren(...state.reviewItems.map(createReviewRow));
    document.querySelector('#review-feedback').textContent = '';
    document.querySelector('#review-panel').hidden = state.reviewItems.length === 0;
    refreshDuplicateWarnings();
  }

  function formatDueDate(isoDate) {
    const parts = isoDate.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(parts[0], parts[1] - 1, parts[2]);
    target.setHours(0, 0, 0, 0);
    const difference = Math.round((target - today) / 86400000);
    if (difference === 0) return { label: 'Due today', className: 'is-today' };
    if (difference === -1) return { label: 'Due yesterday', className: 'is-overdue' };
    if (difference < 0) return { label: `Overdue · ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)}`, className: 'is-overdue' };
    if (difference === 1) return { label: 'Due tomorrow', className: '' };
    return { label: `Due ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)}`, className: '' };
  }

  function makeTaskRow(task) {
    const row = document.createElement('article');
    row.className = `task-row${task.completed ? ' is-completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-check';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `${task.completed ? 'Reopen' : 'Complete'}: ${task.title}`);
    checkbox.addEventListener('change', () => {
      setTaskCompletion(task, checkbox.checked);
    });

    const main = document.createElement('div');
    main.className = 'task-main';
    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;
    const detail = document.createElement('div');
    detail.className = 'task-detail';
    const badge = document.createElement('span');
    badge.className = `source-badge${task.source === 'canvas' ? ' canvas' : ''}`;
    badge.textContent = task.source === 'canvas' ? 'CANVAS' : 'CUSTOM';
    detail.append(badge);
    if (task.courseName) {
      const course = document.createElement('span');
      course.className = 'course-name';
      course.textContent = task.courseName;
      detail.append(course);
    }
    if (typeof task.estimatedMinutes === 'number') {
      const estimate = document.createElement('span');
      estimate.textContent = `${task.estimatedMinutes} min`;
      detail.append(estimate);
    }
    main.append(title, detail);

    const date = document.createElement('div');
    date.className = 'task-date';
    if (task.completed) {
      const label = document.createElement('span');
      label.className = 'due-label is-completed';
      label.textContent = 'Completed';
      date.append(label);
    } else if (task.dueDate) {
      const due = formatDueDate(task.dueDate);
      const label = document.createElement('span');
      label.className = `due-label ${due.className}`.trim();
      label.textContent = due.label;
      date.append(label);
    } else {
      const label = document.createElement('span');
      label.className = 'due-label';
      label.textContent = 'No due date';
      date.append(label);
    }

    row.append(checkbox, main, date);
    return row;
  }

  function setTaskCompletion(task, completed) {
    task.completed = completed;
    saveTasks(state.tasks);
    render();
  }

  function makeRecommendationCard(task, index) {
    const card = document.createElement('article');
    card.className = 'recommendation-card';

    const top = document.createElement('div');
    top.className = 'recommendation-card-top';
    const rank = document.createElement('span');
    rank.className = 'recommendation-rank';
    rank.textContent = String(index + 1).padStart(2, '0');
    const due = document.createElement('span');
    due.className = 'recommendation-due';
    if (task.dueDate) {
      const dueLabel = formatDueDate(task.dueDate);
      due.textContent = dueLabel.label;
      if (dueLabel.className) due.classList.add(dueLabel.className);
    } else {
      due.textContent = 'No due date';
    }
    top.append(rank, due);

    const title = document.createElement('h4');
    title.className = 'recommendation-title';
    title.textContent = task.title;
    const course = document.createElement('p');
    course.className = 'recommendation-course';
    course.textContent = task.courseName || (task.source === 'canvas' ? 'Canvas assignment' : 'Personal task');

    const footer = document.createElement('div');
    footer.className = 'recommendation-footer';
    const source = document.createElement('span');
    source.className = `recommendation-source${task.source === 'canvas' ? ' canvas' : ''}`;
    source.textContent = task.source === 'canvas' ? 'CANVAS' : 'CUSTOM';
    footer.append(source);
    if (typeof task.estimatedMinutes === 'number') {
      const estimate = document.createElement('span');
      estimate.className = 'recommendation-duration';
      estimate.textContent = `${task.estimatedMinutes} min`;
      footer.append(estimate);
    }

    const complete = document.createElement('button');
    complete.type = 'button';
    complete.className = 'recommendation-complete';
    complete.textContent = 'Mark done';
    complete.setAttribute('aria-label', `Complete ${task.title}`);
    complete.addEventListener('click', () => setTaskCompletion(task, true));

    card.append(top, title, course, footer, complete);
    return card;
  }

  function renderRecommendations() {
    const recommendations = sortTasks(state.tasks).filter((task) => !task.completed).slice(0, 3);
    recommendationList.replaceChildren(...recommendations.map(makeRecommendationCard));
    recommendationList.hidden = recommendations.length === 0;
    recommendationEmpty.hidden = recommendations.length > 0;
    if (recommendations.length) {
      recommendationEmpty.textContent = '';
    } else if (state.tasks.length) {
      recommendationEmpty.textContent = 'You’re all caught up. Reopen a completed task in the list when you’re ready to work on it again.';
    } else {
      recommendationEmpty.textContent = 'Add a custom task or import Canvas assignments to see your next priorities here.';
    }
  }

  function render() {
    renderRecommendations();
    const sorted = sortTasks(state.tasks);
    listElement.replaceChildren(...sorted.map(makeTaskRow));
    const remaining = state.tasks.filter((task) => !task.completed).length;
    summaryElement.innerHTML = `<strong>${remaining}</strong> ${remaining === 1 ? 'task' : 'tasks'} to do`;
    emptyElement.hidden = state.tasks.length > 0;
    listElement.hidden = state.tasks.length === 0;
    const today = localDateOffset(0);
    const overdueCount = state.tasks.filter((task) => !task.completed && task.dueDate && task.dueDate < today).length;
    overdueNote.hidden = overdueCount === 0;
    overdueNote.textContent = overdueCount === 1
      ? 'You have 1 overdue task. Overdue tasks are shown first in your list.'
      : `You have ${overdueCount} overdue tasks. Overdue tasks are shown first in your list.`;
  }

  const state = { ...loadTasks(), reviewItems: [] };
  document.querySelector('#today-date').textContent = formatToday(new Date());
  quickAddForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const titleInput = document.querySelector('#task-title-input');
    const dueDateInput = document.querySelector('#task-due-input');
    const estimateInput = document.querySelector('#task-estimate-input');
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.setCustomValidity('Enter a task name.');
      titleInput.reportValidity();
      titleInput.setCustomValidity('');
      return;
    }

    const id = window.crypto && typeof window.crypto.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const task = {
      id,
      title,
      dueDate: dueDateInput.value,
      source: 'custom',
      courseName: null,
      estimatedMinutes: estimateInput.value === '' ? null : Number(estimateInput.value),
      completed: false,
      createdAt: new Date().toISOString()
    };
    state.tasks.push(task);
    saveTasks(state.tasks);
    quickAddForm.reset();
    formFeedback.textContent = 'Task added and sorted by due date.';
    titleInput.focus();
    render();
  });

  const canvasText = document.querySelector('#canvas-text');
  const importFeedback = document.querySelector('#import-feedback');
  const reviewPanel = document.querySelector('#review-panel');
  canvasText.addEventListener('input', () => {
    if (state.reviewItems.length) {
      state.reviewItems = [];
      reviewPanel.hidden = true;
      document.querySelector('#review-list').replaceChildren();
      importFeedback.textContent = 'Pasted text changed. Choose Find assignments to review the new text.';
    } else {
      importFeedback.textContent = '';
    }
  });
  document.querySelector('#parse-canvas').addEventListener('click', () => {
    const rawText = canvasText.value;
    if (!rawText.trim()) {
      state.reviewItems = [];
      reviewPanel.hidden = true;
      importFeedback.textContent = 'Paste copied Canvas dashboard text above, then choose Find assignments.';
      return;
    }

    state.reviewItems = parseCanvasDashboard(rawText);
    if (!state.reviewItems.length) {
      reviewPanel.hidden = true;
      importFeedback.textContent = 'No dated assignments or to-do items were recognized. Check that the copied text includes Canvas item headings and Due or To Do lines, then try again.';
      return;
    }
    importFeedback.textContent = '';
    renderReview();
  });
  document.querySelector('#cancel-review').addEventListener('click', () => {
    state.reviewItems = [];
    reviewPanel.hidden = true;
    document.querySelector('#review-list').replaceChildren();
    importFeedback.textContent = 'Review cleared. You can paste updated dashboard text above.';
  });
  document.querySelector('#import-selected').addEventListener('click', () => {
    const selected = state.reviewItems.filter((item) => item.included);
    const feedback = document.querySelector('#review-feedback');
    if (!selected.length) {
      feedback.textContent = 'Select at least one item to import.';
      return;
    }
    if (selected.some((item) => !item.title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(item.dueDate))) {
      feedback.textContent = 'Each selected item needs a title and a valid due date.';
      return;
    }

    const createdAt = new Date().toISOString();
    const importedTasks = selected.map((item) => ({
      id: window.crypto && typeof window.crypto.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `canvas-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      title: item.title.trim(),
      dueDate: item.dueDate,
      source: 'canvas',
      courseName: item.courseName.trim() || null,
      estimatedMinutes: null,
      completed: false,
      createdAt
    }));
    state.tasks.push(...importedTasks);
    saveTasks(state.tasks);
    const excludedCount = state.reviewItems.length - selected.length;
    state.reviewItems = [];
    reviewPanel.hidden = true;
    document.querySelector('#review-list').replaceChildren();
    importFeedback.textContent = `Imported ${importedTasks.length} Canvas ${importedTasks.length === 1 ? 'item' : 'items'}${excludedCount ? `; ${excludedCount} left out` : ''}. Paste updated dashboard text whenever you’re ready.`;
    render();
  });
  render();
})();
