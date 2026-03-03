import db from './client';

export function usePublicBuilds() {
  const { data, isLoading, error } = db.useQuery({
    builds: {
      $: {
        where: { public: true },
      },
    },
  });

  const builds = (data?.builds ?? []).slice().sort((a: any, b: any) => {
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });

  return { builds, isLoading, error };
}

