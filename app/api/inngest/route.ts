import { serve } from "inngest/next";

import { billingReconcile } from "@/inngest/functions/billing";
import { heartbeat } from "@/inngest/functions/heartbeat";
import { notificationFunctions } from "@/inngest/functions/notifications";
import { inngest } from "@/inngest/client";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [heartbeat, billingReconcile, ...notificationFunctions],
});
