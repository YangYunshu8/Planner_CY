(function (global) {
    'use strict';

    const KEYS = {
        token: 'planner_token',
        user: 'planner_user',
        todos: 'planner_todos',
        habits: 'planner_habits',
        events: 'planner_events'
    };
    const API_ROOT = '/api';
    const DATA_KEYS = new Set([KEYS.todos, KEYS.habits, KEYS.events]);

    function currentUserId() {
        const user = readRaw(KEYS.user, null);
        return user?.userId ?? user?.user_id ?? null;
    }

    function storageKey(key) {
        if (!DATA_KEYS.has(key)) return key;
        const userId = currentUserId();
        return `${key}_${userId === null ? 'guest' : `user_${userId}`}`;
    }

    function readRaw(key, fallback = []) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return value ?? fallback;
        } catch (_error) {
            return fallback;
        }
    }

    function read(key, fallback = []) {
        return readRaw(storageKey(key), fallback);
    }

    function write(key, value) {
        localStorage.setItem(storageKey(key), JSON.stringify(value));
        return value;
    }

    function clearCurrentData() {
        DATA_KEYS.forEach((key) => localStorage.removeItem(storageKey(key)));
        // Remove old, unscoped cache keys so they can never leak into another account.
        DATA_KEYS.forEach((key) => localStorage.removeItem(key));
        localStorage.removeItem('myTodos');
        localStorage.removeItem('myHabits');
    }

    function clearSession() {
        clearCurrentData();
        localStorage.removeItem(KEYS.token);
        localStorage.removeItem(KEYS.user);
    }

    function localId(prefix) {
        if (global.crypto && typeof global.crypto.randomUUID === 'function') {
            return `${prefix}-${global.crypto.randomUUID()}`;
        }
        return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function ensureIds(items, prefix) {
        let changed = false;
        const result = items.map((item) => {
            if (item.id !== undefined && item.id !== null) return item;
            changed = true;
            return { ...item, id: localId(prefix) };
        });
        return { result, changed };
    }

    function migrateLegacyData() {
        if (localStorage.getItem(storageKey(KEYS.todos)) === null && localStorage.getItem('myTodos') !== null) {
            write(KEYS.todos, readRaw('myTodos', []));
        }
        if (localStorage.getItem(storageKey(KEYS.habits)) === null && localStorage.getItem('myHabits') !== null) {
            write(KEYS.habits, readRaw('myHabits', []));
        }
        DATA_KEYS.forEach((key) => {
            if (localStorage.getItem(storageKey(key)) === null && localStorage.getItem(key) !== null) {
                write(key, readRaw(key, []));
            }
            localStorage.removeItem(key);
        });
        if (localStorage.getItem('myTodos') !== null) {
            localStorage.removeItem('myTodos');
        }
        if (localStorage.getItem('myHabits') !== null) {
            localStorage.removeItem('myHabits');
        }

        const migrations = [
            [KEYS.todos, 'todo'],
            [KEYS.habits, 'habit'],
            [KEYS.events, 'event']
        ];
        migrations.forEach(([key, prefix]) => {
            const { result, changed } = ensureIds(read(key, []), prefix);
            if (changed) write(key, result);
        });
    }

    function token() {
        return localStorage.getItem(KEYS.token) || '';
    }

    async function request(path, options = {}) {
        const headers = { Accept: 'application/json', ...(options.headers || {}) };
        if (options.body !== undefined) headers['Content-Type'] = 'application/json';
        if (token()) headers.Authorization = `Bearer ${token()}`;

        const response = await fetch(`${API_ROOT}${path}`, {
            ...options,
            headers,
            body: options.body === undefined ? undefined : JSON.stringify(options.body)
        });
        let payload = {};
        try { payload = await response.json(); } catch (_error) { /* empty response */ }

        if (response.status === 401 || response.status === 403) {
            clearSession();
        }
        if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`);
        return payload;
    }

    function isServerId(id) {
        return Number.isInteger(Number(id)) && String(id).trim() !== '';
    }

    function toIsoDate(value) {
        if (!value) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        const parts = value.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[0]}-${parts[1]}`;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function toDisplayDate(value) {
        const iso = toIsoDate(value);
        if (!iso) return '';
        const [year, month, day] = iso.split('-');
        return `${month}/${day}/${year}`;
    }

    function toDateString(value) {
        const iso = toIsoDate(value);
        if (!iso) return '';
        const [year, month, day] = iso.split('-').map(Number);
        return new Date(year, month - 1, day).toDateString();
    }

    function getTodos() { return read(KEYS.todos, []); }
    function getHabits() { return read(KEYS.habits, []); }
    function getEvents() { return read(KEYS.events, []); }

    async function loadTodos() {
        if (!token()) return getTodos();
        const response = await request('/todos');
        return write(KEYS.todos, response.data.map((todo) => ({
            id: todo.id,
            title: todo.title,
            color: todo.color,
            date: todo.due_date || '',
            done: Boolean(todo.is_done)
        })));
    }

    async function saveTodo(todo) {
        const todos = getTodos();
        const existingIndex = todos.findIndex((item) => String(item.id) === String(todo.id));
        let saved = { ...todo, id: todo.id || localId('todo'), done: Boolean(todo.done) };
        if (token()) {
            const body = { title: saved.title, color: saved.color, due_date: saved.date || null, is_done: saved.done };
            if (existingIndex >= 0 && isServerId(saved.id)) {
                await request(`/todos/${saved.id}`, { method: 'PUT', body });
            } else {
                const response = await request('/todos', { method: 'POST', body });
                saved.id = response.data.todo_id;
            }
        }
        if (existingIndex >= 0) todos[existingIndex] = saved;
        else todos.push(saved);
        write(KEYS.todos, todos);
        return saved;
    }

    async function setTodoDone(id, done) {
        const todos = getTodos();
        const index = todos.findIndex((item) => String(item.id) === String(id));
        if (index < 0) throw new Error('Todo not found');
        if (token() && isServerId(id)) {
            await request(`/todos/${id}/done`, { method: 'PATCH', body: { is_done: Boolean(done) } });
        }
        todos[index] = { ...todos[index], done: Boolean(done) };
        write(KEYS.todos, todos);
        return todos[index];
    }

    async function deleteTodo(id) {
        if (token() && isServerId(id)) await request(`/todos/${id}`, { method: 'DELETE' });
        write(KEYS.todos, getTodos().filter((item) => String(item.id) !== String(id)));
    }

    async function loadEvents(start, end) {
        if (!token()) return getEvents();
        const query = start && end ? `?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}` : '';
        const response = await request(`/events${query}`);
        return write(KEYS.events, response.data.map((event) => ({
            id: event.id,
            title: event.title,
            details: event.details || '',
            date: toDisplayDate(event.event_date),
            startTime: (event.start_time || '').slice(0, 5),
            endTime: (event.end_time || '').slice(0, 5),
            color: event.colour || '#F2D7D9'
        })));
    }

    async function saveEvent(event) {
        const events = getEvents();
        const existingIndex = events.findIndex((item) => String(item.id) === String(event.id));
        let saved = { ...event, id: event.id || localId('event') };
        if (token()) {
            const body = {
                title: saved.title,
                details: saved.details || '',
                event_date: toIsoDate(saved.date),
                start_time: saved.startTime || null,
                end_time: saved.endTime || null,
                colour: saved.color
            };
            if (existingIndex >= 0 && isServerId(saved.id)) {
                await request(`/events/${saved.id}`, { method: 'PUT', body });
            } else {
                const response = await request('/events', { method: 'POST', body });
                saved.id = response.data.event_id;
            }
        }
        if (existingIndex >= 0) events[existingIndex] = saved;
        else events.push(saved);
        write(KEYS.events, events);
        return saved;
    }

    async function deleteEvent(id) {
        if (token() && isServerId(id)) await request(`/events/${id}`, { method: 'DELETE' });
        write(KEYS.events, getEvents().filter((item) => String(item.id) !== String(id)));
    }

    async function loadHabits(start, end) {
        if (!token()) return getHabits();
        const [habitResponse, logResponse] = await Promise.all([
            request('/habits'),
            request(`/habits/logs?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
        ]);
        const datesByHabit = new Map();
        logResponse.data.forEach((log) => {
            const key = String(log.habit_id);
            const dates = datesByHabit.get(key) || [];
            dates.push(toDateString(log.completed_date));
            datesByHabit.set(key, dates);
        });
        return write(KEYS.habits, habitResponse.data.map((habit) => ({
            id: habit.id,
            title: habit.title,
            color: habit.color,
            completedDates: datesByHabit.get(String(habit.id)) || []
        })));
    }

    async function saveHabit(habit) {
        const habits = getHabits();
        const existingIndex = habits.findIndex((item) => String(item.id) === String(habit.id));
        let saved = { ...habit, id: habit.id || localId('habit'), completedDates: habit.completedDates || [] };
        if (token()) {
            const body = { title: saved.title, color: saved.color };
            if (existingIndex >= 0 && isServerId(saved.id)) {
                await request(`/habits/${saved.id}`, { method: 'PUT', body });
            } else {
                const response = await request('/habits', { method: 'POST', body });
                saved.id = response.data.habit_id;
            }
        }
        if (existingIndex >= 0) habits[existingIndex] = saved;
        else habits.push(saved);
        write(KEYS.habits, habits);
        return saved;
    }

    async function toggleHabitDate(id, dateString, checked) {
        const habits = getHabits();
        const index = habits.findIndex((item) => String(item.id) === String(id));
        if (index < 0) throw new Error('Habit not found');
        const iso = toIsoDate(dateString);
        if (token() && isServerId(id)) {
            if (checked) await request(`/habits/${id}/logs`, { method: 'POST', body: { completed_date: iso } });
            else await request(`/habits/${id}/logs/${iso}`, { method: 'DELETE' });
        }
        const dates = new Set(habits[index].completedDates || []);
        if (checked) dates.add(toDateString(iso));
        else dates.delete(toDateString(iso));
        habits[index] = { ...habits[index], completedDates: [...dates] };
        write(KEYS.habits, habits);
        return habits[index];
    }

    async function deleteHabit(id) {
        if (token() && isServerId(id)) await request(`/habits/${id}`, { method: 'DELETE' });
        write(KEYS.habits, getHabits().filter((item) => String(item.id) !== String(id)));
    }

    async function login(loginValue, password) {
        const response = await request('/users/login', { method: 'POST', body: { login: loginValue, password } });
        clearSession();
        localStorage.setItem(KEYS.token, response.data.token);
        write(KEYS.user, response.data.user);
        clearCurrentData();
        return response.data.user;
    }

    async function register(username, email, password) {
        await request('/users/register', { method: 'POST', body: { username, email, password } });
        return login(email, password);
    }

    function logout() {
        clearSession();
    }

    async function deleteAccount() {
        await request('/users/me', { method: 'DELETE' });
        clearSession();
    }

    migrateLegacyData();

    global.PlannerData = {
        ready: () => Promise.resolve(),
        request,
        getUser: () => read(KEYS.user, null),
        isAuthenticated: () => Boolean(token()),
        login,
        register,
        logout,
        deleteAccount,
        getTodos,
        loadTodos,
        saveTodo,
        setTodoDone,
        deleteTodo,
        getEvents,
        loadEvents,
        saveEvent,
        deleteEvent,
        getHabits,
        loadHabits,
        saveHabit,
        toggleHabitDate,
        deleteHabit,
        toIsoDate,
        toDisplayDate,
        toDateString
    };
})(window);
