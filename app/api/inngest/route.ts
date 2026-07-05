import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { generateExamOrderPdfFunction } from "@/lib/inngest/order-pdf";

// Serve Inngest handlers dynamically for GET, POST, and PUT actions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateExamOrderPdfFunction,
  ],
});
