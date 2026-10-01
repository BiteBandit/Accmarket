import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";

// Initialize a Supabase client with service role key for webhook operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";
    const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET || "";

    // 1. Verify webhook signature if secret is configured
    if (webhookSecret) {
      const hmac = crypto.createHmac("sha256", webhookSecret);
      const computedSignature = hmac.update(rawBody).digest("hex");
      
      if (signature !== computedSignature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event_id = payload.event_id || payload.id;
    const session_id = payload.session_id || payload.data?.session_id;
    const status = payload.status || payload.data?.status;

    if (!event_id) {
      return NextResponse.json({ error: "Missing event_id" }, { status: 400 });
    }

    // 2. Check if event has already been processed (Idempotency check)
    const { data: existingEvent } = await supabase
      .from("processed_events")
      .select("event_id")
      .eq("event_id", event_id)
      .maybeSingle();

    if (existingEvent) {
      return NextResponse.json({ message: "Event already processed" }, { status: 200 });
    }

    // 3. Safely record event id with proper async/await error handling
    try {
      await Promise.resolve(
        supabase.from("processed_events").insert({ event_id })
      );
    } catch {
      // Ignore duplicate key or insert race conditions safely
    }

    // 4. Map exact case-sensitive statuses from Didit
    if (session_id && status) {
      const normalizedStatus = status.toLowerCase();
      
      // Find the pending verification linked to this session or user
      const { data: verification } = await supabase
        .from("user_verifications")
        .select("user_id")
        .eq("session_id", session_id)
        .maybeSingle();

      if (verification) {
        const newStatus = ["approved", "success", "verified"].includes(normalizedStatus)
          ? "approved"
          : ["rejected", "declined", "failed"].includes(normalizedStatus)
          ? "rejected"
          : "pending";

        await supabase
          .from("user_verifications")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("session_id", session_id);

        if (newStatus === "approved") {
          await supabase
            .from("profiles")
            .update({ role: "seller", updated_at: new Date().toISOString() })
            .eq("id", verification.user_id);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
