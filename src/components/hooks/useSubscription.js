// The rebuild dropped the Pro/free subscription tier — everyone gets full
// access. Kept as a stub hook so call sites elsewhere don't need to change.
export function useSubscription() {
  return { isPro: true, status: 'active', plan: 'pro', daysRemaining: null };
}
