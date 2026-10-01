import { describe, expect, it } from 'vitest';

describe('Tooling Smoke Test', () => {
  it('happy-dom environment is active', () => {
    expect(window).toBeDefined();
    expect(document).toBeDefined();
    const div = document.createElement('div');
    div.id = 'app';
    document.body.appendChild(div);
    expect(document.getElementById('app')).toBe(div);
  });
});
