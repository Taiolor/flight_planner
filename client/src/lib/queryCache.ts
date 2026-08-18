export const queryCachePolicies = {
  default: {
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  },
  session: {
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  },
  annualPlanning: {
    staleTime: 2 * 60_000,
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: false,
  },
  quotes: {
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  },
  apiUsage: {
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  },
  financial: {
    staleTime: 2 * 60_000,
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: false,
  },
  admin: {
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  },
  staticPublicKey: {
    staleTime: Infinity,
    gcTime: 24 * 60 * 60_000,
    refetchOnWindowFocus: false,
  },
} as const;
