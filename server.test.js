const request = require('supertest');
const app = require('./server');

describe('Initial Test', () => {
  test('should pass', () => {
    console.log('Test is running!');
    expect(true).toBe(true);
  });
});