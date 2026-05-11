import { describe, it, expect } from 'vitest';
import { json, cors } from '../src/index';

describe('Server utils', () => {
  it('json middleware', () => {
    expect(typeof json).toBe('function');
  });
  it('cors middleware', () => {
    expect(typeof cors).toBe('function');
  });
});
