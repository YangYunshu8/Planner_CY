(function (global) {
    'use strict';

    const modalIds = ['modal-login', 'modal-register', 'modal-profile'];

    function element(id) { return document.getElementById(id); }
    function closeAll() { modalIds.forEach((id) => element(id)?.classList.remove('open')); }
    function showError(error) { alert(error?.message || 'Something went wrong. Please try again.'); }
    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;

    global.closeAllAuthModals = closeAll;
    global.openLoginModal = () => { closeAll(); element('modal-login')?.classList.add('open'); };
    global.closeLoginModal = () => element('modal-login')?.classList.remove('open');
    global.openRegisterModal = () => { closeAll(); element('modal-register')?.classList.add('open'); };
    global.closeRegisterModal = () => element('modal-register')?.classList.remove('open');
    global.closeProfileModal = () => element('modal-profile')?.classList.remove('open');

    global.toggleProfile = () => {
        const user = global.PlannerData.getUser();
        if (!global.PlannerData.isAuthenticated() || !user) return global.openLoginModal();
        const username = user.username || user.name || '';
        if (element('profile-name-display')) element('profile-name-display').textContent = username || '—';
        if (element('profile-name-input')) element('profile-name-input').value = username;
        if (element('profile-email-input')) element('profile-email-input').value = user.email || '';
        closeAll();
        element('modal-profile')?.classList.add('open');
    };

    global.doLogin = async () => {
        const loginInput = element('login-username');
        const passwordInput = element('login-password');
        const loginValue = loginInput?.value.trim();
        const password = passwordInput?.value || '';
        if (!loginValue || !password) return alert('Please fill all fields');
        const button = element('modal-login')?.querySelector('.auth-btn-primary');
        if (button?.disabled) return;
        if (button) button.disabled = true;
        try {
            await global.PlannerData.login(loginValue, password);
            global.closeLoginModal();
            location.reload();
        } catch (error) {
            showError(error);
            if (button) button.disabled = false;
        }
    };

    global.doRegister = async () => {
        const name = element('reg-name')?.value.trim();
        const email = element('reg-email')?.value.trim();
        const password = element('reg-password')?.value || '';
        if (!name || !email || !password) return alert('Please fill all fields');
        if (!EMAIL_PATTERN.test(email)) return alert('Please enter a valid email address');
        if (!STRONG_PASSWORD_PATTERN.test(password)) {
            return alert('Password must be 8–72 characters and include an uppercase letter, a lowercase letter, and a number');
        }
        const button = element('modal-register')?.querySelector('.auth-btn-primary');
        if (button?.disabled) return;
        if (button) button.disabled = true;
        try {
            await global.PlannerData.register(name, email, password);
            global.closeRegisterModal();
            location.reload();
        } catch (error) {
            showError(error);
            if (button) button.disabled = false;
        }
    };

    global.doLogout = () => {
        global.PlannerData.logout();
        global.closeProfileModal();
        location.reload();
    };

    global.doDeleteAccount = async () => {
        const confirmed = global.confirm('Delete your account and all events, todos, and habits? This cannot be undone.');
        if (!confirmed) return;
        const button = element('delete-account-btn');
        if (button?.disabled) return;
        if (button) button.disabled = true;
        try {
            await global.PlannerData.deleteAccount();
            global.closeProfileModal();
            location.reload();
        } catch (error) {
            showError(error);
            if (button) button.disabled = false;
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        // The profile only contains account details, so remove the unused avatar artwork.
        document.querySelectorAll('#modal-profile .auth-avatar').forEach((avatar) => avatar.remove());
        const profileCard = element('modal-profile')?.querySelector('.auth-card');
        const logoutButton = profileCard?.querySelector('.auth-btn-logout');
        if (profileCard && logoutButton && !element('delete-account-btn')) {
            const deleteButton = document.createElement('button');
            deleteButton.id = 'delete-account-btn';
            deleteButton.type = 'button';
            deleteButton.className = 'auth-btn auth-btn-delete';
            deleteButton.textContent = 'DELETE ACCOUNT';
            deleteButton.addEventListener('click', global.doDeleteAccount);
            logoutButton.insertAdjacentElement('afterend', deleteButton);
        }
        const registerEmail = element('reg-email');
        if (registerEmail) registerEmail.setAttribute('autocomplete', 'email');
        const registerPassword = element('reg-password');
        if (registerPassword) {
            registerPassword.setAttribute('autocomplete', 'new-password');
            registerPassword.setAttribute('minlength', '8');
            registerPassword.setAttribute('maxlength', '72');
            registerPassword.title = '8–72 characters with uppercase, lowercase, and a number';
        }
        const loginLabel = element('login-username')?.previousElementSibling;
        if (loginLabel) loginLabel.textContent = 'Username or email';
        if (element('login-username')) element('login-username').placeholder = 'Enter username or email';
        modalIds.forEach((id) => {
            const modal = element(id);
            if (modal && !modal.dataset.bound) {
                modal.dataset.bound = 'true';
                modal.addEventListener('click', (event) => {
                    if (event.target === modal) modal.classList.remove('open');
                });
            }
        });
    });
})(window);
