import { describe, it, expect, beforeEach } from 'vitest';
import { createServer, json, cors } from '../src/index';

describe('createServer', () => {
  it('creates server instance', () => {
    const app = createServer({ port: 0 });
    expect(app).toBeDefined();
    app.close();
  });
});

describe('json middleware', () => {
  it('is function', () => { expect(typeof json).toBe('function'); });
});

describe('cors middleware', () => {
  it('is function', () => { expect(typeof cors).toBe('function'); });
});
