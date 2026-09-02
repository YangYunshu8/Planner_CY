const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

function cleanText(value, maxLength = 255) {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, maxLength);
}

function normalizeEmail(value) {
    return cleanText(value, 254).toLowerCase();
}

function isValidEmail(value) {
    return EMAIL_PATTERN.test(normalizeEmail(value));
}

function isValidColor(value) {
    return typeof value === 'string' && HEX_COLOR_PATTERN.test(value);
}

function isValidDate(value) {
    if (value === null || value === undefined || value === '') return true;
    if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
}

function isValidTime(value) {
    return value === null || value === undefined || value === ''
        || (typeof value === 'string' && TIME_PATTERN.test(value));
}

function toBoolean(value) {
    return value === true || value === 1 || value === '1';
}

module.exports = {
    cleanText,
    normalizeEmail,
    isValidEmail,
    isValidColor,
    isValidDate,
    isValidTime,
    toBoolean
};

