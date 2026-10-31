const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is required in all environments"
    );
  }
  return secret;
};

export const ENV = {
  cookieSecret: getJwtSecret(),
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  vapidPublicKey:
    process.env.VAPID_PUBLIC_KEY ?? process.env.VITE_VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  authEmail: process.env.AUTH_EMAIL ?? "",
  authPassword: process.env.AUTH_PASSWORD ?? "",
  rapidapiKey: process.env.RAPIDAPI_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
};
