import { useUser } from '@clerk/clerk-expo';
import db from './client';

/**
 * Fetch the current Clerk user's builds from InstantDB.
 * Filters server-side via the owner link's clerkId.
 */
export function useBuilds() {
  const { user } = useUser();

  const { data, isLoading, error } = db.useQuery(
    user
      ? { builds: { $: { where: { 'owner.clerkId': user.id } } } }
      : null
  );

  return {
    builds: data?.builds ?? [],
    isLoading,
    error,
    userId: user?.id,
  };
}
