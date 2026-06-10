import { PostHog } from "posthog-node";

import { getEnv } from "@/lib/env";

let postHogClient: PostHog | undefined;

export function getPostHogClient(): PostHog {
  if (!postHogClient) {
    const env = getEnv();
    postHogClient = new PostHog(env.POSTHOG_KEY, {
      host: "https://us.i.posthog.com",
      flushAt: env.DEMO_MODE ? 1 : 20,
    });
  }

  return postHogClient;
}
