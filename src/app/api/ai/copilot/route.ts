import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { queryBusinessCopilot } from "@/lib/ai/copilot-engine";
import { db } from "@/db";
import { aiConversations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized session." }, { status: 401 });
    }

    const body = await req.json();
    const message = body.message;
    const conversationId = body.conversationId;
    const history = body.history || [];

    if (!message || typeof message !== "string") {
      return NextResponse.json({ success: false, error: "Prompt message is required." }, { status: 400 });
    }

    const tenant = session.tenant;

    const result = await queryBusinessCopilot({
      tenantId: tenant.id,
      currency: tenant.currency,
      storeName: tenant.name,
      message,
      conversationHistory: history,
    });

    // Optionally save/update conversation in database
    try {
      if (conversationId) {
        const existing = await db.query.aiConversations.findFirst({
          where: eq(aiConversations.id, conversationId),
        });

        if (existing) {
          const currentMessages = Array.isArray(existing.messagesJson) ? existing.messagesJson : [];
          await db
            .update(aiConversations)
            .set({
              messagesJson: [
                ...currentMessages,
                { role: "user", text: message, timestamp: new Date() },
                { role: "model", text: result.reply, timestamp: new Date() },
              ],
              lastInteractedAt: new Date(),
            })
            .where(eq(aiConversations.id, conversationId));
        }
      }
    } catch (saveErr) {
      console.warn("Could not persist conversation history to DB:", saveErr);
    }

    return NextResponse.json({
      success: true,
      reply: result.reply,
      language: result.language,
      toolCallsExecuted: result.toolCallsExecuted,
      dataPayload: result.dataPayload,
    });
  } catch (error: any) {
    console.error("API /api/ai/copilot Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process AI copilot query." },
      { status: 500 }
    );
  }
}
