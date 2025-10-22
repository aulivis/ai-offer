export type ProfilePersistenceState = {
  hasProfile: boolean;
  loadError: Error | null;
};

export type ProfileMutationAction = 'insert' | 'update';

export function resolveProfileMutationAction(state: ProfilePersistenceState): ProfileMutationAction {
  return state.hasProfile || state.loadError ? 'update' : 'insert';
}
