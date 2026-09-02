const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createStorage(initial = {}) {
    const values = new Map(Object.entries(initial));
    return {
        getItem: (key) => values.has(key) ? values.get(key) : null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: (key) => values.delete(key)
    };
}

function loadPlannerData(initialStorage = {}) {
    const localStorage = createStorage(initialStorage);
    const window = { crypto: { randomUUID: () => 'fixed-id' } };
    const context = vm.createContext({ window, localStorage, fetch: async () => { throw new Error('Unexpected request'); } });
    const source = fs.readFileSync(
        path.join(__dirname, '..', 'Web9', 'js', 'planner-data.js'),
        'utf8'
    );
    vm.runInContext(source, context);
    return { data: window.PlannerData, localStorage };
}

test('migrates the original todo key and assigns a stable ID', () => {
    const { data } = loadPlannerData({
        myTodos: JSON.stringify([{ title: 'Study', color: '#F2D7D9', date: '', done: false }])
    });
    const todos = data.getTodos();
    assert.equal(todos.length, 1);
    assert.equal(todos[0].id, 'todo-fixed-id');
});

test('marking the same todo complete repeatedly never creates extra records', async () => {
    const { data } = loadPlannerData();
    const saved = await data.saveTodo({ title: 'Submit report', color: '#F2D7D9', date: '', done: false });
    await data.setTodoDone(saved.id, true);
    await data.setTodoDone(saved.id, true);
    const todos = data.getTodos();
    assert.equal(todos.length, 1);
    assert.equal(todos[0].done, true);
});

test('events and todos use one date conversion contract', () => {
    const { data } = loadPlannerData();
    assert.equal(data.toIsoDate('08/31/2026'), '2026-08-31');
    assert.equal(data.toDisplayDate('2026-08-31'), '08/31/2026');
});

