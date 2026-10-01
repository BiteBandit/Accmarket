import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  // 1. Check if user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const apiKey = process.env.DIDIT_API_KEY;
  const workflowId = process.env.DIDIT_WORKFLOW_ID;
  
  // Custom domain callback URL routing them back to the upgrade page
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const callbackUrl = `https://accmarket.name.ng/dashboard/settings/upgrade-to-seller`; // Updated callback route

  if (!apiKey || !workflowId) {
    console.error("Missing Didit environment variables.");
    return NextResponse.json(
      { error: "Server configuration error: Missing Didit keys." },
      { status: 500 }
    );
  }

  try {
    // 2. Call Didit v3 Session API endpoint
    const response = await fetch("https://verification.didit.me/v3/session/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        callback: callbackUrl,
        vendor_data: user.id, // Binds the session back to the Supabase user ID
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create Didit verification session.");
    }

    // Didit returns a hosted verification URL and session token
    const verificationUrl = data.url || data.verification_url;

    if (!verificationUrl) {
      throw new Error("Verification URL was not returned by Didit.");
    }

    // 3. Redirect user to Didit's hosted identity verification flow
    return NextResponse.redirect(verificationUrl);

  } catch (err: any) {
    console.error("Didit session error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error during verification routing." },
      { status: 500 }
    );
  }
}
