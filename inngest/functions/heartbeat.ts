import { inngest } from "@/inngest/client";

export const heartbeat = inngest.createFunction(
  { id: "heartbeat", triggers: [{ cron: "*/15 * * * *" }] },
  async () => {
    return {
      ok: true,
      service: "vierates",
      checkedAt: new Date().toISOString(),
    };
  },
);
