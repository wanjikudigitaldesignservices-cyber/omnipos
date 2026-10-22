/**
 * OmniPOS Fractional Unit & Kadogo Economy Mathematics Engine
 * Strict 4-decimal precision floating-point arithmetic for micro-retailing
 */

export interface UnitConversionSpec {
  unitName: string;
  unitCode: string;
  ratioToBulk: number; // e.g. 0.0050 for 250g from 50kg sack, 0.2500 for 250g from 1kg
  sellingPrice: number;
  costPrice: number;
  targetMarginPercent: number;
}

export interface KadogoMarginAnalysis {
  unitName: string;
  unitCode: string;
  ratioToBulk: number;
  bulkCost: number;
  allocatedUnitCost: number; // Rounded to 4 decimal places
  sellingPrice: number;
  grossMarginAmount: number;
  grossMarginPercent: number;
  isMarginEroded: boolean; // True if current margin < target margin
  marginWarning?: string;
  suggestedMinimumPrice: number;
}

/**
 * Rounds a number to exactly 4 decimal places with strict floating-point accuracy
 */
export function roundTo4(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

/**
 * Rounds a number to 2 decimal places for financial currency presentation
 */
export function roundTo2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates micro-unit allocated cost, profit margin, and erosion alerts
 * based on parent bulk cost and unit fraction ratio.
 */
export function calculateKadogoMargin(
  bulkCost: number,
  ratioToBulk: number,
  sellingPrice: number,
  targetMarginPercent = 15.0
): KadogoMarginAnalysis {
  // Allocated cost per fractional packet: e.g. 50kg sack at KES 6,500 * (0.25kg / 50kg = 0.0050) = KES 32.5000
  const allocatedUnitCost = roundTo4(bulkCost * ratioToBulk);
  const cleanSellingPrice = roundTo4(sellingPrice);
  const grossMarginAmount = roundTo4(cleanSellingPrice - allocatedUnitCost);

  const grossMarginPercent =
    cleanSellingPrice > 0
      ? roundTo2((grossMarginAmount / cleanSellingPrice) * 100)
      : 0;

  const isMarginEroded = grossMarginPercent < targetMarginPercent;

  // Minimum retail price required to achieve target margin
  // Target Margin = (Price - Cost) / Price => Price = Cost / (1 - Target Margin / 100)
  const divisor = Math.max(0.01, 1 - targetMarginPercent / 100);
  const suggestedMinimumPrice = roundTo2(allocatedUnitCost / divisor);

  let marginWarning: string | undefined;
  if (isMarginEroded) {
    marginWarning = `Wholesale cost increase erodes profit margin to ${grossMarginPercent}% (target is ${targetMarginPercent}%). Recommended minimum price is KES ${suggestedMinimumPrice.toFixed(2)}.`;
  }

  return {
    unitName: "",
    unitCode: "",
    ratioToBulk: roundTo4(ratioToBulk),
    bulkCost: roundTo4(bulkCost),
    allocatedUnitCost,
    sellingPrice: cleanSellingPrice,
    grossMarginAmount,
    grossMarginPercent,
    isMarginEroded,
    marginWarning,
    suggestedMinimumPrice,
  };
}

/**
 * Standard preset packaging breakdown recipes for common African SME staples
 */
export const KADOGO_PRESET_TEMPLATES: Record<
  string,
  {
    bulkUnit: string;
    bulkName: string;
    fractions: Array<{
      name: string;
      code: string;
      ratio: number;
      defaultMargin: number;
    }>;
  }
> = {
  SUGAR_50KG: {
    bulkUnit: "50kg Sack",
    bulkName: "Sugar / Sukari (50kg Bag)",
    fractions: [
      { name: "0.2500kg (Robo / Quarter)", code: "0.2500_KG", ratio: 0.005, defaultMargin: 18 },
      { name: "0.5000kg (Nusu / Half kg)", code: "0.5000_KG", ratio: 0.01, defaultMargin: 15 },
      { name: "1.0000kg Packet", code: "1.0000_KG", ratio: 0.02, defaultMargin: 12 },
      { name: "2.0000kg Packet", code: "2.0000_KG", ratio: 0.04, defaultMargin: 10 },
    ],
  },
  COOKING_OIL_20L: {
    bulkUnit: "20L Jerrycan",
    bulkName: "Salit / Cooking Oil (20 Litre Jerrycan)",
    fractions: [
      { name: "100ml Kadogo Cup", code: "0.1000_LTR", ratio: 0.005, defaultMargin: 25 },
      { name: "250ml Glass Cup", code: "0.2500_LTR", ratio: 0.0125, defaultMargin: 20 },
      { name: "500ml Kasuku", code: "0.5000_LTR", ratio: 0.025, defaultMargin: 18 },
      { name: "1.0000L Bottle", code: "1.0000_LTR", ratio: 0.05, defaultMargin: 14 },
    ],
  },
  RICE_25KG: {
    bulkUnit: "25kg Bag",
    bulkName: "Pishori / Basmati Rice (25kg Sack)",
    fractions: [
      { name: "0.5000kg Packet", code: "0.5000_KG", ratio: 0.02, defaultMargin: 16 },
      { name: "1.0000kg Packet", code: "1.0000_KG", ratio: 0.04, defaultMargin: 14 },
      { name: "2.0000kg Bag", code: "2.0000_KG", ratio: 0.08, defaultMargin: 12 },
    ],
  },
  BAR_SOAP_BALE: {
    bulkUnit: "10-Bar Carton",
    bulkName: "Laundry Bar Soap (Carton of 10 long bars)",
    fractions: [
      { name: "Single Long Bar", code: "1.0000_BAR", ratio: 0.1, defaultMargin: 15 },
      { name: "Half Bar (Nusu Bar)", code: "0.5000_BAR", ratio: 0.05, defaultMargin: 22 },
      { name: "Quarter Bar (Robo Bar)", code: "0.2500_BAR", ratio: 0.025, defaultMargin: 28 },
    ],
  },
};
