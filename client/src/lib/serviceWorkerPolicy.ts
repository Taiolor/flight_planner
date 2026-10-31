export const SERVICE_WORKER_CACHE_PREFIX = "smartfly-";

export function shouldRegisterServiceWorker(
  isProduction: boolean,
  isSupported: boolean
): boolean {
  return isProduction && isSupported;
}

export function getDevelopmentCacheNames(cacheNames: readonly string[]): string[] {
  return cacheNames.filter(name => name.startsWith(SERVICE_WORKER_CACHE_PREFIX));
}
