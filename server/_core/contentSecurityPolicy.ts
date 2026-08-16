export const productionCspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "blob:", "data:", "https://cdn.jsdelivr.net"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'", "https:", "http:", "ws:", "wss:"],
  frameSrc: ["'self'", "*"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["*"],
};

/**
 * O CSP é desabilitado apenas no desenvolvimento para suportar o preview do
 * Vite. Em produção, scripts inline e eval ficam explicitamente bloqueados.
 */
export function getContentSecurityPolicy(isDevelopment: boolean) {
  if (isDevelopment) {
    return false;
  }

  return { directives: productionCspDirectives };
}
