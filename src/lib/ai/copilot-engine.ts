import { db } from "@/db";
import { orders, orderItems, products, customers, registerShifts } from "@/db/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { callGemini, ToolDeclaration, ChatMessage } from "./gemini-client";

// ========================================================
// 1. READ-ONLY DATABASE QUERY FUNCTIONS (Strict Multi-Tenant)
// ========================================================

export async function getDailySales(tenantId: string, dateStr?: string) {
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const dayOrders = await db.query.orders.findMany({
    where: and(
      eq(orders.tenantId, tenantId),
      eq(orders.status, "COMPLETED"),
      gte(orders.createdAt, targetDate)
    ),
    with: {
      items: true,
      customer: true,
    },
    orderBy: [desc(orders.createdAt)],
  });

  let totalSales = 0;
  let totalCostOfGoods = 0;
  const paymentBreakdown: Record<string, number> = {
    CASH: 0,
    MOBILE_MONEY: 0,
    CARD: 0,
    CREDIT_TAB: 0,
    SPLIT: 0,
  };

  for (const o of dayOrders) {
    const amt = parseFloat(o.totalAmount) || 0;
    totalSales += amt;
    paymentBreakdown[o.paymentMethod] = (paymentBreakdown[o.paymentMethod] || 0) + amt;

    if (o.items) {
      for (const item of o.items) {
        const qty = parseFloat(item.quantity) || 0;
        const cost = parseFloat(item.unitCost) || 0;
        totalCostOfGoods += qty * cost;
      }
    }
  }

  const grossProfit = totalSales - totalCostOfGoods;
  const marginPercent = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : "0.0";

  return {
    date: targetDate.toISOString().slice(0, 10),
    orderCount: dayOrders.length,
    totalSales: Math.round(totalSales * 100) / 100,
    costOfGoods: Math.round(totalCostOfGoods * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    marginPercent: `${marginPercent}%`,
    paymentBreakdown,
  };
}

export async function getLowStockItems(tenantId: string, customThreshold?: number) {
  const allProds = await db.query.products.findMany({
    where: eq(products.tenantId, tenantId),
    with: {
      category: true,
    },
  });

  const lowStock = [];
  for (const p of allProds) {
    const qty = parseFloat(p.stockQuantity) || 0;
    const threshold = customThreshold !== undefined ? customThreshold : parseFloat(p.lowStockThreshold) || 5;

    if (qty <= threshold) {
      lowStock.push({
        id: p.id,
        name: p.name,
        category: p.category?.name || "General",
        currentStock: qty,
        unit: p.unit,
        threshold,
        sellingPrice: parseFloat(p.sellingPrice),
        costPrice: parseFloat(p.costPrice),
        isOut: qty <= 0,
      });
    }
  }

  return {
    totalAlerts: lowStock.length,
    items: lowStock.sort((a, b) => a.currentStock - b.currentStock),
  };
}

export async function getTopDebtors(tenantId: string, limit = 10) {
  const allCusts = await db.query.customers.findMany({
    where: eq(customers.tenantId, tenantId),
    orderBy: [desc(customers.creditBalance)],
  });

  const debtors = allCusts
    .filter((c) => parseFloat(c.creditBalance || "0") > 0)
    .slice(0, limit)
    .map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone || "No phone",
      creditBalance: parseFloat(c.creditBalance || "0"),
      creditLimit: parseFloat(c.creditLimit || "50000"),
      loyaltyPoints: c.loyaltyPoints,
    }));

  const totalOutstanding = debtors.reduce((sum, d) => sum + d.creditBalance, 0);

  return {
    debtorsCount: debtors.length,
    totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    topDebtors: debtors,
  };
}

export async function getProfitMargin(tenantId: string) {
  const salesData = await getDailySales(tenantId);
  const allProds = await db.query.products.findMany({
    where: eq(products.tenantId, tenantId),
  });

  let totalCostValuation = 0;
  let totalRetailValuation = 0;

  for (const p of allProds) {
    const qty = parseFloat(p.stockQuantity) || 0;
    const cost = parseFloat(p.costPrice) || 0;
    const price = parseFloat(p.sellingPrice) || 0;
    totalCostValuation += qty * cost;
    totalRetailValuation += qty * price;
  }

  const potentialGrossProfit = totalRetailValuation - totalCostValuation;
  const storeMargin =
    totalRetailValuation > 0
      ? ((potentialGrossProfit / totalRetailValuation) * 100).toFixed(1)
      : "0.0";

  return {
    todaySales: salesData.totalSales,
    todayGrossProfit: salesData.grossProfit,
    todayMargin: salesData.marginPercent,
    storewideValuation: {
      costValuation: Math.round(totalCostValuation * 100) / 100,
      retailValuation: Math.round(totalRetailValuation * 100) / 100,
      potentialProfit: Math.round(potentialGrossProfit * 100) / 100,
      catalogMarginPercent: `${storeMargin}%`,
    },
  };
}

// ========================================================
// 2. TOOL DECLARATIONS FOR GEMINI FUNCTION-CALLING
// ========================================================

export const COPILOT_TOOLS: ToolDeclaration[] = [
  {
    functionDeclarations: [
      {
        name: "getDailySales",
        description: "Returns sales revenue, transaction count, COGS, and payment tender breakdown for today or a specific date.",
        parameters: {
          type: "OBJECT",
          properties: {
            dateStr: {
              type: "STRING",
              description: "Optional ISO date (YYYY-MM-DD). Defaults to today.",
            },
          },
        },
      },
      {
        name: "getLowStockItems",
        description: "Fetches items running low or out of stock across the store catalog.",
        parameters: {
          type: "OBJECT",
          properties: {
            customThreshold: {
              type: "NUMBER",
              description: "Optional custom minimum stock threshold filter.",
            },
          },
        },
      },
      {
        name: "getTopDebtors",
        description: "Fetches customers with outstanding credit tab debt (madeni) and their credit limits.",
        parameters: {
          type: "OBJECT",
          properties: {
            limit: {
              type: "NUMBER",
              description: "Maximum number of customers to list.",
            },
          },
        },
      },
      {
        name: "getProfitMargin",
        description: "Calculates store gross profit margins, inventory valuation, and pricing efficiency.",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
    ],
  },
];

// ========================================================
// 3. MULTILINGUAL AI CONVERSATION ORCHESTRATOR
// ========================================================

const SYSTEM_INSTRUCTION = `
You are the OmniAI Business Copilot & Growth Advisor, an executive AI assistant embedded in OmniPOS for African and Kenyan SMEs.
You understand and fluently speak English, standard Swahili (Kiswahili Sanifu), and local Kenyan urban slang (Sheng).
You speak naturally to the shop owner/merchant.
- When spoken to in Sheng (e.g. "Niambie faida ya leo", "Hizi stocks gani zinaisha?", "Nani ako na deni mob?"), respond warmly in authentic, respectful Kenyan Sheng mixed with clear numbers.
- When spoken to in Swahili, respond in clear Swahili.
- When spoken to in English, respond in professional executive English.

CRITICAL RULES:
1. Always base your answers on real data fetched from tools (getDailySales, getLowStockItems, getTopDebtors, getProfitMargin).
2. Format financial figures with the merchant's currency.
3. Provide actionable business advice for small retailers (e.g., reorder timings, managing debt tabs, Kadogo packaging).
`;

/**
 * Main query entry point for the Conversational Business Copilot.
 */
export async function queryBusinessCopilot(params: {
  tenantId: string;
  currency: string;
  storeName: string;
  message: string;
  conversationHistory?: Array<{ role: "user" | "model"; text: string }>;
}): Promise<{
  reply: string;
  language: "sheng" | "swahili" | "english";
  toolCallsExecuted: string[];
  dataPayload?: any;
}> {
  const { tenantId, currency, storeName, message, conversationHistory = [] } = params;
  const q = message.trim();
  const lowerQ = q.toLowerCase();

  // Detect query language dialect
  const isSheng =
    lowerQ.includes("faida ya leo") ||
    lowerQ.includes("niaje") ||
    lowerQ.includes("zinaisha") ||
    lowerQ.includes("madeni") ||
    lowerQ.includes("deni") ||
    lowerQ.includes("mbaya") ||
    lowerQ.includes("pesa") ||
    lowerQ.includes("ngapi") ||
    lowerQ.includes("wasee") ||
    lowerQ.includes("duka") ||
    lowerQ.includes("boss") ||
    lowerQ.includes("manze");

  const isSwahili =
    !isSheng &&
    (lowerQ.includes("habari") ||
      lowerQ.includes("mauzo") ||
      lowerQ.includes("faida") ||
      lowerQ.includes("bidhaa") ||
      lowerQ.includes("wateja") ||
      lowerQ.includes("kiasi"));

  const detectedLanguage = isSheng ? "sheng" : isSwahili ? "swahili" : "english";

  // Try live Gemini 2.5 Flash if API key is present
  if (process.env.GEMINI_API_KEY) {
    const contents: ChatMessage[] = [];

    for (const msg of conversationHistory) {
      contents.push({
        role: msg.role,
        parts: [{ text: msg.text }],
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const geminiRes = await callGemini({
      contents,
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: COPILOT_TOOLS,
      temperature: 0.2,
    });

    if (!geminiRes.error && geminiRes.functionCalls && geminiRes.functionCalls.length > 0) {
      const tool = geminiRes.functionCalls[0];
      let toolResult: any = null;

      if (tool.name === "getDailySales") {
        toolResult = await getDailySales(tenantId, tool.args?.dateStr);
      } else if (tool.name === "getLowStockItems") {
        toolResult = await getLowStockItems(tenantId, tool.args?.customThreshold);
      } else if (tool.name === "getTopDebtors") {
        toolResult = await getTopDebtors(tenantId, tool.args?.limit);
      } else if (tool.name === "getProfitMargin") {
        toolResult = await getProfitMargin(tenantId);
      }

      // Second turn with tool result
      contents.push({
        role: "model",
        parts: [{ functionCall: tool }],
      });

      contents.push({
        role: "function",
        parts: [
          {
            functionResponse: {
              name: tool.name,
              response: { result: toolResult },
            },
          },
        ],
      });

      const secondTurn = await callGemini({
        contents,
        systemInstruction: SYSTEM_INSTRUCTION,
      });

      if (secondTurn.text) {
        return {
          reply: secondTurn.text,
          language: detectedLanguage,
          toolCallsExecuted: [tool.name],
          dataPayload: toolResult,
        };
      }
    } else if (geminiRes.text) {
      return {
        reply: geminiRes.text,
        language: detectedLanguage,
        toolCallsExecuted: [],
      };
    }
  }

  // ========================================================
  // DETERMINISTIC MULTILINGUAL HEURISTIC ENGINE (Zero-Downtime Fallback)
  // Ensures 100% immediate functionality offline or without API key
  // ========================================================

  let reply = "";
  let executedTool = "";
  let payload: any = null;

  if (
    lowerQ.includes("faida") ||
    lowerQ.includes("profit") ||
    lowerQ.includes("margin") ||
    lowerQ.includes("mauzo") ||
    lowerQ.includes("sales")
  ) {
    executedTool = "getDailySales";
    payload = await getDailySales(tenantId);

    if (detectedLanguage === "sheng") {
      reply = `Niaje boss! Hali ya leo kwa ${storeName}: Mauzo jumla (Gross Sales) ni ${currency} ${payload.totalSales.toLocaleString()} kutoka kwa orders ${payload.orderCount}. Faida safi ya leo (Gross Profit) ni ${currency} ${payload.grossProfit.toLocaleString()} (Margin ya ${payload.marginPercent}). Lipa na M-Pesa imeingiza ${currency} ${(payload.paymentBreakdown?.MOBILE_MONEY || 0).toLocaleString()}, na Cash kwa drawer ni ${currency} ${(payload.paymentBreakdown?.CASH || 0).toLocaleString()}. Duka inasonga safi!`;
    } else if (detectedLanguage === "swahili") {
      reply = `Habari yako! Mauzo ya leo katika ${storeName} yamefikia ${currency} ${payload.totalSales.toLocaleString()} kutokana na mauzo ${payload.orderCount}. Faida ya leo ni ${currency} ${payload.grossProfit.toLocaleString()} sawa na asilimia ${payload.marginPercent}. Pesa zilizopokelewa kwa njia ya simu (M-Pesa) ni ${currency} ${(payload.paymentBreakdown?.MOBILE_MONEY || 0).toLocaleString()}.`;
    } else {
      reply = `Today's financial performance for ${storeName}: Total revenue is ${currency} ${payload.totalSales.toLocaleString()} across ${payload.orderCount} orders. Realized gross profit is ${currency} ${payload.grossProfit.toLocaleString()} (${payload.marginPercent} margin). Mobile money collections stand at ${currency} ${(payload.paymentBreakdown?.MOBILE_MONEY || 0).toLocaleString()} and physical drawer cash is ${currency} ${(payload.paymentBreakdown?.CASH || 0).toLocaleString()}.`;
    }
  } else if (
    lowerQ.includes("stock") ||
    lowerQ.includes("bidhaa") ||
    lowerQ.includes("zinaisha") ||
    lowerQ.includes("reorder") ||
    lowerQ.includes("supply")
  ) {
    executedTool = "getLowStockItems";
    payload = await getLowStockItems(tenantId);

    if (payload.totalAlerts === 0) {
      if (detectedLanguage === "sheng") {
        reply = `Stock iko shwari kabisa boss! Hakuna bidhaa yoyote iko chini ya threshold kwa sasa. Kila kitu kwa shelf kiko full.`;
      } else if (detectedLanguage === "swahili") {
        reply = `Hali ya ghala ni nzuri sana. Hakuna bidhaa zilizopungua chini ya kiwango cha tahadhari kwa sasa.`;
      } else {
        reply = `Inventory levels are healthy across all categories. There are currently zero items below their low-stock replenishment threshold.`;
      }
    } else {
      const topItems = payload.items
        .slice(0, 3)
        .map((i: any) => `• ${i.name}: ${i.currentStock} ${i.unit} left (Alert: ${i.threshold})`)
        .join("\n");

      if (detectedLanguage === "sheng") {
        reply = `Wazi boss! Uko na bidhaa ${payload.totalAlerts} zinakaribia kwisha. Angalia hizi za juu ununue kabla wikendi:\n${topItems}\nUkitaka, tunaweza kufanya Kadogo unit conversion kwa bulk sack zilizobaki.`;
      } else if (detectedLanguage === "swahili") {
        reply = `Kuna bidhaa ${payload.totalAlerts} ambazo zimepungua kwenye ghala na zinahitaji kuagizwa upya:\n${topItems}`;
      } else {
        reply = `Notice: ${payload.totalAlerts} catalog items have reached replenishment thresholds and require reordering:\n${topItems}`;
      }
    }
  } else if (
    lowerQ.includes("deni") ||
    lowerQ.includes("debt") ||
    lowerQ.includes("madeni") ||
    lowerQ.includes("credit") ||
    lowerQ.includes("tab")
  ) {
    executedTool = "getTopDebtors";
    payload = await getTopDebtors(tenantId);

    if (payload.debtorsCount === 0) {
      if (detectedLanguage === "sheng") {
        reply = `Wasee wote wamelipa madeni zao boss! Hakuna mtu ako na deni kwa kitabu kwa sasa. Likwidity iko 100%.`;
      } else {
        reply = `Zero outstanding customer tab debt recorded in the CRM ledger. All accounts are settled.`;
      }
    } else {
      const topDebtorsList = payload.topDebtors
        .slice(0, 3)
        .map((d: any) => `• ${d.name} (${d.phone}): ${currency} ${d.creditBalance.toLocaleString()}`)
        .join("\n");

      if (detectedLanguage === "sheng") {
        reply = `Jumla ya madeni ya wateja (Customer Tabs) kwa sasa ni ${currency} ${payload.totalOutstanding.toLocaleString()} kwa wateja ${payload.debtorsCount}. Hawa ndio wako juu:\n${topDebtorsList}\nUshauri wa OmniAI: Unaweza kuwatumia automated WhatsApp repayment reminder moja kwa moja kutoka kwa mfumo!`;
      } else {
        reply = `Total outstanding tab credit balance across ${payload.debtorsCount} accounts is ${currency} ${payload.totalOutstanding.toLocaleString()}.\nKey accounts:\n${topDebtorsList}\nRecommendation: Send automated SMS/WhatsApp repayment reminders to accelerate cashflow recovery.`;
      }
    }
  } else {
    executedTool = "getProfitMargin";
    payload = await getProfitMargin(tenantId);

    if (detectedLanguage === "sheng") {
      reply = `Niko hapa kusaidia duka yako ya ${storeName} ikuwe enterprise kubwa! Unaweza kuniuliza kuhusu:\n1. "Niambie faida ya leo"\n2. "Hizi stocks gani zinaisha?"\n3. "Nani ako na deni kubwa?"\n4. "Scan supplier invoice"\nKila data tunasoma moja kwa moja kutoka kwa database ya Neon!`;
    } else {
      reply = `Welcome to OmniAI Copilot for ${storeName}! I am connected to your live POS and inventory ledger. You can ask me questions like:\n- "What is today's gross profit and cash breakdown?"\n- "Which stock items need urgent replenishment?"\n- "Who are the top customer debt tab holders?"\n- "How do I break down bulk sacks into Kadogo micro units?"`;
    }
  }

  return {
    reply,
    language: detectedLanguage,
    toolCallsExecuted: executedTool ? [executedTool] : [],
    dataPayload: payload,
  };
}
