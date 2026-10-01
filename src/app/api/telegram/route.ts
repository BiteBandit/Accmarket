import { Bot, webhookCallback } from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!supabaseUrl || !supabaseServiceKey || !token) {
  console.error("❌ Missing environment variables for Telegram bot!");
}

// Initialize Supabase Client with Service Role Key
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

// Initialize Telegram Bot
const bot = new Bot(token || '');

// Listen for messages using your original logic
bot.on("message", async (ctx) => {
  const text = ctx.message?.text?.trim() || "";
  const chatId = ctx.chat?.id;

  if (!chatId) return;

  console.log(`📥 Received message from chat ${chatId}: "${text}"`);

  if (text.startsWith("/start")) {
    const parts = text.split(" ");
    const userId = parts[1]?.trim();

    if (!userId) {
      await ctx.reply("Welcome to AccMarket Bot! 👋\n\nPlease go to your AccMarket Settings page and click 'Link Telegram' to connect your account securely.");
      return;
    }

    try {
      // 1. Verify user exists in Supabase
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError || !profile) {
        await ctx.reply("❌ We couldn't find a matching AccMarket account for this link. Please try generating a new link from your settings.");
        return;
      }

      // 2. Update profile with Telegram Chat ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          telegram_chat_id: chatId.toString(),
          telegram_notifications: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // 3. Success confirmation
      await ctx.reply(`✅ Success, @${profile.username || 'User'}!\n\nYour Telegram account has been successfully linked to AccMarket. You will now receive instant alerts right here.`);
      console.log(`Successfully linked chat ${chatId} to user ${userId}`);

    } catch (err) {
      console.error("Error linking telegram account:", err);
      await ctx.reply("⚠️ An unexpected error occurred while linking your account. Please try again later.");
    }
  }
});

// Export the web-standard webhook handler for Vercel
export const POST = webhookCallback(bot, 'std/http');

// Optional GET to verify the route is accessible
export async function GET() {
  return NextResponse.json({ status: 'Telegram bot webhook is running' });
}
