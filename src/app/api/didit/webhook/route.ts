import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Verifies Didit V2 signature using the raw body, timestamp, and destination secret key.
 */
function verifyDiditSignature(rawBody: string, signature: string | null, timestamp: string | null, secret: string | undefined): boolean {
  if (!signature || !timestamp || !secret) return false;

  try {
    // 1. Validate timestamp freshness (within 5 minutes / 300 seconds)
    const currentTime = Math.floor(Date.now() / 1000);
    const webhookTime = parseInt(timestamp, 10);
    if (isNaN(webhookTime) || Math.abs(currentTime - webhookTime) > 300) {
      console.error("Webhook timestamp out of bounds or invalid.");
      return false;
    }

    // 2. Recompute HMAC-SHA256 signature using canonical raw body and timestamp
    const hmacInput = `${timestamp}.${rawBody}`;
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(hmacInput)
      .digest("hex");

    // 3. Constant-time comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature);
    const computedBuffer = Buffer.from(computedSignature);

    if (sigBuffer.length !== computedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, computedBuffer);
  } catch (err) {
    console.error("Error during signature verification:", err);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // 1. Read the raw request body text strictly before parsing JSON
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature-v2");
    const timestamp = request.headers.get("x-timestamp");
    const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET;

    // 2. Enforce signature validation if secret is provided
    if (webhookSecret) {
      const isValid = verifyDiditSignature(rawBody, signature, timestamp, webhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature or expired timestamp" }, { status: 401 });
      }
    }

    // 3. Parse JSON body safely after validation
    const payload = JSON.parse(rawBody);
    const { event_id, session_id, status, webhook_type, vendor_data } = payload;
    const sessionData = payload.data || payload;
    const userId = vendor_data || sessionData.vendor_data || sessionData.metadata?.user_id;

    if (!userId) {
      return NextResponse.json({ error: "Missing vendor_data / user ID in webhook payload" }, { status: 400 });
    }

    // Optional: Idempotency check using event_id to prevent duplicate processing
    if (event_id) {
      const { data: existingEvent } = await supabase
        .from("processed_events")
        .select("event_id")
        .eq("event_id", event_id)
        .single();

      if (existingEvent) {
        // Already processed this event; return 2xx immediately
        return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
      }

      // Record event id to prevent reprocessing
      await supabase.from("processed_events").insert({ event_id }).catch(() => {});
    }

    // 4. Map exact case-sensitive statuses from Didit
    let dbStatus = "pending";
    if (status === "Approved") {
      dbStatus = "success";
    } else if (["Declined", "Rejected", "Failed", "Expired", "Kyc Expired"].includes(status)) {
      dbStatus = "rejected";
    } else if (status === "In Review") {
      dbStatus = "pending_review";
    }

    // 5. Update user_verifications table
    const { error: updateError } = await supabase
      .from("user_verifications")
      .update({
        status: dbStatus,
        session_id: session_id,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Database update error:", updateError);
    }

    // 6. Handle profile role / KYC updates based on strict case matches
    if (status === "Approved") {
      await supabase
        .from("profiles")
        .update({ 
          role: "seller", 
          kyc_status: "verified", 
          updated_at: new Date().toISOString() 
        })
        .eq("id", userId);

      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Seller Verification Approved!",
        message: "Your identity verification was successful. Your account has been verified and upgraded to a seller account.",
        is_read: false,
      });
    } else if (["Declined", "Rejected", "Failed", "Expired", "Kyc Expired"].includes(status)) {
      await supabase
        .from("profiles")
        .update({ 
          kyc_status: "rejected", 
          updated_at: new Date().toISOString() 
        })
        .eq("id", userId);

      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Verification Failed",
        message: `Your identity verification status changed to: ${status}. You can retry from your settings.`,
        is_read: false,
      });
    }

    // 7. Return 2xx status rapidly as recommended by Didit docs
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { error: err.message || "Internal webhook error" },
      { status: 500 }
    );
  }
}
