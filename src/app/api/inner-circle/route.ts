import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required." },
        { status: 400 }
      );
    }

    // Automatically extract everything before the '@' as the first name
    const namePart = email.split("@")[0];
    // Capitalize the first letter and clean up dots/underscores for a cleaner look
    const formattedName = namePart
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase());

    // Adds contact to your Resend audience with the extracted name
    const { data, error } = await resend.contacts.create({
      email: email,
      firstName: formattedName,
      unsubscribed: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  }
}
