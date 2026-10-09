import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    
    // Create Supabase client using @supabase/ssr with awaited cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // 1. Authenticate user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // 2. Fetch Didit credentials from environment variables
    const apiKey = process.env.DIDIT_API_KEY;
    const workflowId = process.env.DIDIT_WORKFLOW_ID;

    if (!apiKey || !workflowId) {
      console.error("Missing Didit environment variables on server.");
      return NextResponse.json(
        { error: "Server configuration error for verification." },
        { status: 500 }
      );
    }

    // 3. Call Didit Sessions API with a 15-second timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const diditResponse = await fetch("https://verification.didit.me/v3/session/", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        vendor_data: userId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const diditData = await diditResponse.json();

    if (!diditResponse.ok) {
      console.error("Didit API Error:", diditData);
      return NextResponse.json(
        { error: diditData?.message || "Failed to initialize verification session with Didit." },
        { status: diditResponse.status }
      );
    }

    // Return session URL back to frontend
    return NextResponse.json({
      url: diditData.url,
      sessionId: diditData.session_id,
    });

  } catch (error: any) {
    console.error("Route error in /api/didit/verify:", error);
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Didit verification service took too long to respond." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
