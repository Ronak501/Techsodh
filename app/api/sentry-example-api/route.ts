import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}

// A faulty API route to test Sentry's error monitoring
export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const triggerError = searchParams.get("triggerError") === "true";

  Sentry.logger.info("Sentry example API called", {
    triggerError,
  });

  if (triggerError) {
    throw new SentryExampleAPIError(
      "This error is raised on the backend called by the example page.",
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Sentry API is healthy. Add ?triggerError=true to intentionally test backend error reporting.",
  });
}
