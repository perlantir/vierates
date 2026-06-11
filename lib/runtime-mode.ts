export function isProductionRuntime(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
}

export function demoRuntimeAllowed(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.DEMO_MODE === "true" && !isProductionRuntime(env);
}

export function e2eRuntimeAllowed(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.VIERATES_E2E === "true" && !isProductionRuntime(env);
}
