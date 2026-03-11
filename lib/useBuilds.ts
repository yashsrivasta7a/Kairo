import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

export function useBuilds() {
  const builds = useQuery(api.builds.listForCurrentUser) ?? [];
  const isLoading = builds === undefined;

  const options = builds.map((build) => ({
    label: build.slug || build.appName || 'Build',
    value: build.id,
  }));

  return {
    builds,
    options,
    isLoading,
    error: null,
    // userId: user?.id,
  };
}
