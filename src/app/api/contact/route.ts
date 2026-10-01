import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required." },
        { status: 400 }
      );
    }

    const data = await resend.emails.send({
      // Use your custom domain here after verification:
      from: "Accmarket Support <support@accmarket.name.ng>", 
      to: [process.env.SUPPORT_EMAIL || "your-personal-email@gmail.com"],
      subject: `[Support Inquiry] ${subject || "New Message"}`,
      replyTo: email, // This allows you to just hit "Reply" in your inbox to email the customer back!
      text: `
You have received a new support message from AccMarket:

Name: ${name || "Not provided"}
Email: ${email}
Subject: ${subject || "Not provided"}

Message:
${message}
      `,
    });

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to send email:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}
