const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function webFile(name) {
    return fs.readFileSync(path.join(__dirname, '..', 'Web9', name), 'utf8');
}

test('dashboard provides all four planning summaries', () => {
    const dashboard = webFile('Dashboard.html');
    ['stat-open-todos', 'stat-events', 'stat-habits', 'stat-week'].forEach(id => {
        assert.match(dashboard, new RegExp(`id="${id}"`));
    });
});

test('daily planner uses 24 hours and a current-time marker', () => {
    const planner = webFile('Daily_Planner.html');
    assert.match(planner, /length:\s*24/);
    assert.match(planner, /const START_HOUR = 0/);
    assert.match(planner, /renderCurrentTimeLine/);
});

test('todo page includes completed tasks and undo support', () => {
    const todo = webFile('todo_list.html');
    assert.match(todo, /id="completed-box"/);
    assert.match(todo, /actionLabel:\s*'Undo'/);
    assert.match(todo, /renderCompletedTodos/);
});

test('habit dates and checkboxes share the same grid', () => {
    const css = webFile('habit_tracker.css');
    const sharedGrid = /minmax\(80px, 1\.2fr\) repeat\(7, minmax\(36px, 1fr\)\)/g;
    assert.equal((css.match(sharedGrid) || []).length, 2);
});

test('shared design includes dark mode, toasts and mobile navigation', () => {
    const css = webFile('shared.css');
    const ui = webFile(path.join('js', 'ui.js'));
    assert.match(css, /html\[data-theme="dark"\]/);
    assert.match(css, /@media \(max-width: 720px\)/);
    assert.match(ui, /function toast/);
});

