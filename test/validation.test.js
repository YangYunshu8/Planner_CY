const test = require('node:test');
const assert = require('node:assert/strict');
const {
    cleanText,
    normalizeEmail,
    isValidEmail,
    isValidColor,
    isValidDate,
    isValidTime,
    toBoolean
} = require('../Planner_backend/utils/validation');

test('cleans and limits user-entered text', () => {
    assert.equal(cleanText('  Study Java  ', 20), 'Study Java');
    assert.equal(cleanText('123456', 4), '1234');
    assert.equal(cleanText(null), '');
});

test('normalizes and validates email addresses', () => {
    assert.equal(normalizeEmail('  USER@Example.COM '), 'user@example.com');
    assert.equal(isValidEmail('student@example.com'), true);
    assert.equal(isValidEmail('not-an-email'), false);
});

test('validates dates including leap years', () => {
    assert.equal(isValidDate('2028-02-29'), true);
    assert.equal(isValidDate('2027-02-29'), false);
    assert.equal(isValidDate('2026-13-01'), false);
    assert.equal(isValidDate(null), true);
});

test('validates time and six-digit hex colours', () => {
    assert.equal(isValidTime('23:45'), true);
    assert.equal(isValidTime('24:00'), false);
    assert.equal(isValidColor('#F2D7D9'), true);
    assert.equal(isValidColor('pink'), false);
});

test('converts database and JSON boolean values consistently', () => {
    assert.equal(toBoolean(true), true);
    assert.equal(toBoolean(1), true);
    assert.equal(toBoolean('1'), true);
    assert.equal(toBoolean('false'), false);
});

