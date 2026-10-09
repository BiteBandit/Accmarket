import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { encryptCredentials } from "@/lib/server/encryption";

const ALLOWED_PLATFORMS = [
  "facebook", "instagram", "tiktok", "twitter", "snapchat",
  "linkedin", "reddit", "pinterest", "discord", "twitch",
];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate seller via secure server session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
    }

    const formData = await request.formData();
    let platform = formData.get("platform")?.toString().toLowerCase() || "";
    const account_username = formData.get("account_username")?.toString() || "";
    const profile_link = formData.get("profile_link")?.toString() || "";
    const account_age = formData.get("account_age")?.toString() || "";
    const account_region = formData.get("account_region")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const price = formData.get("price")?.toString() || "";
    const loginFormatsRaw = formData.get("login_formats")?.toString();
    const login_formats = loginFormatsRaw ? JSON.parse(loginFormatsRaw) : [];
    const credentialsRaw = formData.get("credentials")?.toString();
    const credentials = credentialsRaw ? JSON.parse(credentialsRaw) : {};

    const previewFile = formData.get("preview_image") as File | null;
    const screenshotFile = formData.get("screenshot") as File | null;

    if (platform === "x") {
      platform = "twitter";
    }

    if (!platform || !ALLOWED_PLATFORMS.includes(platform)) {
      return NextResponse.json({ error: "Invalid or unsupported platform." }, { status: 400 });
    }

    if (!previewFile || !screenshotFile) {
      return NextResponse.json({ error: "Both preview image and verification screenshot are required." }, { status: 400 });
    }

    // 2. Use service role client to bypass storage RLS policies for reliable backend uploads
    const serviceClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Upload Public Preview Image
    const previewBuffer = Buffer.from(await previewFile.arrayBuffer());
    const previewExt = previewFile.name.split(".").pop() || "png";
    const previewPath = `${user.id}/${crypto.randomUUID()}.${previewExt}`;

    const { error: previewUploadErr } = await serviceClient.storage
      .from("listing-previews")
      .upload(previewPath, previewBuffer, {
        contentType: previewFile.type,
        upsert: false,
      });

    if (previewUploadErr) {
      console.error("Preview upload error:", previewUploadErr);
      return NextResponse.json({ error: "Failed to upload public preview image." }, { status: 500 });
    }

    const { data: publicUrlData } = serviceClient.storage
      .from("listing-previews")
      .getPublicUrl(previewPath);

    const publicPreviewUrl = publicUrlData.publicUrl;

    // Upload Verification Screenshot
    const screenBuffer = Buffer.from(await screenshotFile.arrayBuffer());
    const screenExt = screenshotFile.name.split(".").pop() || "png";
    const screenPath = `verification-proofs/${user.id}/${crypto.randomUUID()}.${screenExt}`;

    const { error: screenUploadErr } = await serviceClient.storage
      .from("listings")
      .upload(screenPath, screenBuffer, {
        contentType: screenshotFile.type,
        upsert: false,
      });

    if (screenUploadErr) {
      console.error("Screenshot upload error:", screenUploadErr);
      return NextResponse.json({ error: "Failed to upload verification evidence screenshot." }, { status: 500 });
    }

    // 3. Encrypt credentials securely on the server
    const vaultEncryptionData = encryptCredentials(credentials);

    // 4. Insert Listing Record
    const { data: listingData, error: listingError } = await serviceClient
      .from("listings")
      .insert({
        seller_id: user.id,
        platform,
        title: `${platform.toUpperCase()} Account - @${account_username.trim()}`,
        account_username: account_username.trim(),
        profile_link: profile_link.trim(),
        account_age: account_age.trim(),
        account_region: account_region.trim(),
        login_formats,
        description: description.trim(),
        price: Number(price),
        currency: "NGN",
        preview_image_url: publicPreviewUrl,
        verification_screenshot_path: screenPath,
        status: "pending_verification",
      })
      .select("id")
      .single();

    if (listingError || !listingData) {
      console.error("Listing insert error:", listingError);
      return NextResponse.json({ error: "Failed to persist listing record." }, { status: 500 });
    }

    const listingId = listingData.id;

    // 5. Insert Vault Record
    const { error: vaultError } = await serviceClient
      .from("listing_delivery_vault")
      .insert({
        listing_id: listingId,
        seller_id: user.id,
        encrypted_payload: vaultEncryptionData.encrypted_payload,
        encryption_nonce: vaultEncryptionData.encryption_nonce,
        encryption_auth_tag: vaultEncryptionData.encryption_auth_tag,
        encryption_key_version: vaultEncryptionData.encryption_key_version,
        payload_schema_version: vaultEncryptionData.payload_schema_version,
      });

    if (vaultError) {
      console.error("Vault insert error, compensating:", vaultError);
      await serviceClient.from("listings").delete().eq("id", listingId);
      return NextResponse.json({ error: "Failed to securely store account delivery vault credentials." }, { status: 500 });
    }

    return NextResponse.json({ success: true, listing_id: listingId });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
  }
}
