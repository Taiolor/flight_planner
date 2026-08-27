export const productionCspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "blob:", "https://cdn.jsdelivr.net", "https://maps.googleapis.com"],
  styleSrc: ["'self'", "https://fonts.googleapis.com"],
  // Alguns componentes do React e o SDK do mapa aplicam estilos calculados via
  // atributo style. Scripts inline e blocos <style> continuam bloqueados.
  styleSrcAttr: ["'unsafe-inline'"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  imgSrc: [
    "'self'",
    "data:",
    "blob:",
    "https://d36hbw14aib5lz.cloudfront.net",
    "https://maps.googleapis.com",
    "https://maps.gstatic.com",
    "https://*.googleusercontent.com",
    "https://*.tile.openstreetmap.org",
    "https://*.basemaps.cartocdn.com",
  ],
  connectSrc: ["'self'", "https://maps.googleapis.com", "https://maps.gstatic.com"],
  frameSrc: ["'self'", "https://www.google.com"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'self'"],
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
