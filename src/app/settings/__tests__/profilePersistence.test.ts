import { describe, expect, it } from 'vitest';

import { resolveProfileMutationAction } from '../profilePersistence';

describe('resolveProfileMutationAction', () => {
  it('prefers insert when no profile exists and there was no load error', () => {
    expect(
      resolveProfileMutationAction({
        hasProfile: false,
        loadError: null,
      }),
    ).toBe('insert');
  });

  it('prefers update when a profile was loaded successfully', () => {
    expect(
      resolveProfileMutationAction({
        hasProfile: true,
        loadError: null,
      }),
    ).toBe('update');
  });

  it('prefers update when loading the profile failed previously to avoid duplicate inserts', () => {
    expect(
      resolveProfileMutationAction({
        hasProfile: false,
        loadError: new Error('temporary failure'),
      }),
    ).toBe('update');
  });
});
