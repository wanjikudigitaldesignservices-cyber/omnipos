import { NextRequest, NextResponse } from "next/server";
import { queryBusinessCopilot } from "@/lib/ai/copilot-engine";
import { db } from "@/db";
import { tenants, aiConversations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * WhatsApp Cloud API Webhook Endpoint
 * Allows African SME store owners to chat with OmniPOS AI Copilot directly via WhatsApp.
 */

// GET endpoint: Webhook Verification handshake with Meta
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || "omnipos_copilot_webhook_secret_2026";

  if (mode === "subscribe" && token === expectedToken) {
    console.log("WhatsApp Webhook verified successfully.");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification token mismatch" }, { status: 403 });
}

// POST endpoint: Incoming WhatsApp message processor
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Parse Meta WhatsApp Cloud API structure
    const entry = payload?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messageObj = value?.messages?.[0];

    if (!messageObj) {
      // Could be status update webhook (delivered, read, etc.)
      return NextResponse.json({ status: "acknowledged_status_update" });
    }

    const senderPhone = messageObj.from; // e.g. "254712345678"
    const messageText = messageObj.text?.body?.trim();

    if (!messageText) {
      return NextResponse.json({ status: "ignored_non_text" });
    }

    // Resolve tenant: Look up by owner phone or fallback to active tenant
    let targetTenant = await db.query.tenants.findFirst({
      orderBy: [desc(tenants.createdAt)],
    });

    if (!targetTenant) {
      return NextResponse.json({ error: "No active tenant store found" }, { status: 404 });
    }

    // Process user query with Multilingual Sheng/Swahili Copilot engine
    const copilotResult = await queryBusinessCopilot({
      tenantId: targetTenant.id,
      currency: targetTenant.currency,
      storeName: targetTenant.name,
      message: messageText,
    });

    // Save interaction to ai_conversations ledger
    try {
      await db.insert(aiConversations).values({
        tenantId: targetTenant.id,
        channel: "WHATSAPP",
        title: `WhatsApp from ${senderPhone}: "${messageText.slice(0, 30)}..."`,
        messagesJson: [
          { role: "user", text: messageText, senderPhone, timestamp: new Date() },
          { role: "model", text: copilotResult.reply, language: copilotResult.language, timestamp: new Date() },
        ],
        lastInteractedAt: new Date(),
      });
    } catch (dbErr) {
      console.warn("Could not save WhatsApp interaction to DB:", dbErr);
    }

    // Send WhatsApp reply back via Meta Cloud API if WHATSAPP_ACCESS_TOKEN and PHONE_NUMBER_ID are configured
    const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (whatsappToken && phoneNumberId) {
      try {
        await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${whatsappToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: senderPhone,
            type: "text",
            text: {
              body: copilotResult.reply,
            },
          }),
        });
      } catch (sendErr) {
        console.error("Failed to forward response to WhatsApp Meta API:", sendErr);
      }
    }

    return NextResponse.json({
      success: true,
      processedMessage: messageText,
      reply: copilotResult.reply,
      language: copilotResult.language,
      toolCalls: copilotResult.toolCallsExecuted,
    });
  } catch (error: any) {
    console.error("WhatsApp Webhook processing error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
