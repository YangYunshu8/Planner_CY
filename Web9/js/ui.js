(function (global) {
    'use strict';

    const THEME_KEY = 'planner_theme';

    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem(THEME_KEY, theme);
        const button = document.querySelector('.theme-toggle-fab');
        if (button) {
            const dark = theme === 'dark';
            button.innerHTML = `<i class="fa-${dark ? 'solid fa-sun' : 'regular fa-moon'}"></i>`;
            button.setAttribute('aria-label', dark ? 'Use light mode' : 'Use dark mode');
            button.title = dark ? 'Light mode' : 'Dark mode';
        }
    }

    function preferredTheme() {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === 'dark' || saved === 'light') return saved;
        return global.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function toggleTheme() {
        applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    }

    function getToastContainer() {
        let container = document.getElementById('planner-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'planner-toast-container';
            container.className = 'toast-container';
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }
        return container;
    }

    function toast(message, options = {}) {
        if (typeof options === 'string') options = { type: options };
        const item = document.createElement('div');
        item.className = `planner-toast toast-${options.type || 'info'}`;
        item.setAttribute('role', 'status');

        const text = document.createElement('span');
        text.className = 'toast-message';
        text.textContent = String(message || 'Done');
        item.appendChild(text);

        if (options.actionLabel && typeof options.onAction === 'function') {
            const action = document.createElement('button');
            action.type = 'button';
            action.className = 'toast-action';
            action.textContent = options.actionLabel;
            action.addEventListener('click', async () => {
                action.disabled = true;
                try { await options.onAction(); } finally { item.remove(); }
            });
            item.appendChild(action);
        }

        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'toast-close';
        close.setAttribute('aria-label', 'Close notification');
        close.innerHTML = '&times;';
        close.addEventListener('click', () => item.remove());
        item.appendChild(close);

        getToastContainer().appendChild(item);
        requestAnimationFrame(() => item.classList.add('toast-visible'));
        const timeout = global.setTimeout(() => {
            item.classList.remove('toast-visible');
            global.setTimeout(() => item.remove(), 180);
        }, options.duration || 4200);
        item.addEventListener('mouseenter', () => global.clearTimeout(timeout), { once: true });
        return item;
    }

    function setActiveNavigation() {
        const current = location.pathname.split('/').pop() || 'Dashboard.html';
        document.querySelectorAll('.sidebar a.nav-item').forEach(link => {
            const active = link.getAttribute('href') === current;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
    }

    applyTheme(preferredTheme());
    global.PlannerUI = { toast, toggleTheme, applyTheme };
    global.toggleTheme = toggleTheme;
    global.alert = (message) => toast(message, { type: 'error' });

    document.addEventListener('DOMContentLoaded', () => {
        setActiveNavigation();
        const themeButton = document.createElement('button');
        themeButton.type = 'button';
        themeButton.className = 'theme-toggle-fab';
        themeButton.addEventListener('click', toggleTheme);
        document.body.appendChild(themeButton);
        applyTheme(document.documentElement.dataset.theme || preferredTheme());
    });
})(window);

