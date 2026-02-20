import { useUser } from '@clerk/clerk-expo';
import db from './client';

export function useBuilds() {
  const { user } = useUser();
  const { data, isLoading, error } = db.useQuery(
    user ? { builds: { $: { where: { 'owner.clerkId': user.id } } } } : null
  );

  const builds = data?.builds ?? [];
  const options = builds.map((b: any) => ({ label: b.slug || b.id || 'Build', value: b.id }));

  return { builds, options, isLoading, error, userId: user?.id };
}