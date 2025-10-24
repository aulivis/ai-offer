import { describe, expect, it } from 'vitest';

import { normalizePlan, resolveEffectivePlan } from '../subscription';

describe('normalizePlan', () => {
  it('treats nullish input as free', () => {
    expect(normalizePlan(null)).toBe('free');
    expect(normalizePlan(undefined)).toBe('free');
  });

  it('normalises starter and standard to standard', () => {
    expect(normalizePlan('starter')).toBe('standard');
    expect(normalizePlan('standard')).toBe('standard');
    expect(normalizePlan('Standard')).toBe('standard');
  });

  it('preserves explicit pro plans', () => {
    expect(normalizePlan('pro')).toBe('pro');
    expect(normalizePlan('Pro')).toBe('pro');
  });
});

describe('resolveEffectivePlan', () => {
  it('relies solely on the stored plan when determining access', () => {
    expect(resolveEffectivePlan('pro')).toBe('pro');
    expect(resolveEffectivePlan('standard')).toBe('standard');
    expect(resolveEffectivePlan('starter')).toBe('standard');
    expect(resolveEffectivePlan('free')).toBe('free');
    expect(resolveEffectivePlan(null)).toBe('free');
  });
});
