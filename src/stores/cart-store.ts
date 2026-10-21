import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  id: string; // product id
  name: string;
  sku?: string | null;
  barcode?: string | null;
  price: number;
  costPrice: number;
  quantity: number;
  unit: string;
  discount: number;
  notes?: string;
  staffMember?: string;
  modifiers?: string[];
  stockQuantity?: number;
  expiryDate?: string | null;
  batchNumber?: string | null;
}

export interface ParkedCart {
  id: string;
  label: string;
  timestamp: number;
  items: CartItem[];
  customer: {
    id: string;
    name: string;
    phone?: string | null;
    creditBalance?: number;
    creditLimit?: number;
    loyaltyPoints?: number;
  } | null;
  orderType: "WALK_IN" | "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  tableNumber: string | null;
}

export interface CartCustomer {
  id: string;
  name: string;
  phone?: string | null;
  creditBalance: number;
  creditLimit: number;
  loyaltyPoints: number;
}

export interface ActiveShiftState {
  id: string;
  openedAt: string;
  openingFloat: number;
  expectedCash: number;
  status: "OPEN" | "CLOSED";
}

interface CartStoreState {
  items: CartItem[];
  customer: CartCustomer | null;
  orderType: "WALK_IN" | "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  tableNumber: string | null;
  overallDiscount: number;
  parkedCarts: ParkedCart[];
  activeShift: ActiveShiftState | null;

  // Actions
  addItem: (product: any, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  setStaffMember: (productId: string, staff: string) => void;
  setCustomer: (customer: CartCustomer | null) => void;
  setOrderType: (orderType: "WALK_IN" | "DINE_IN" | "TAKEAWAY" | "DELIVERY") => void;
  setTableNumber: (tableNumber: string | null) => void;
  setOverallDiscount: (discount: number) => void;
  clearCart: () => void;

  // Parked Carts
  parkCurrentCart: (label?: string) => void;
  recallParkedCart: (id: string) => void;
  deleteParkedCart: (id: string) => void;

  // Active Shift
  setActiveShift: (shift: ActiveShiftState | null) => void;

  // Computeds
  getSubtotal: () => number;
  getTaxAmount: (taxRate: number) => number;
  getTotalDiscount: () => number;
  getTotalAmount: (taxRate: number) => number;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      customer: null,
      orderType: "WALK_IN",
      tableNumber: null,
      overallDiscount: 0,
      parkedCarts: [],
      activeShift: null,

      addItem: (product, qty = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex((item) => item.id === product.id);
          const price = parseFloat(product.sellingPrice || product.price || "0");
          const costPrice = parseFloat(product.costPrice || "0");
          const stock = parseFloat(product.stockQuantity || "0");

          if (existingIndex > -1) {
            const updated = [...state.items];
            const current = updated[existingIndex];
            const newQty = Math.round((current.quantity + qty) * 100) / 100;
            updated[existingIndex] = {
              ...current,
              quantity: newQty > 0 ? newQty : 1,
            };
            return { items: updated };
          }

          const newItem: CartItem = {
            id: product.id,
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            price,
            costPrice,
            quantity: qty,
            unit: product.unit || "pcs",
            discount: 0,
            stockQuantity: stock,
            expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString() : null,
            batchNumber: product.batchNumber,
          };

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((item) => item.id !== productId) };
          }
          return {
            items: state.items.map((item) =>
              item.id === productId ? { ...item, quantity: Math.round(quantity * 100) / 100 } : item
            ),
          };
        });
      },

      updateDiscount: (productId, discount) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId ? { ...item, discount: Math.max(0, discount) } : item
          ),
        }));
      },

      updateNotes: (productId, notes) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId ? { ...item, notes } : item
          ),
        }));
      },

      setStaffMember: (productId, staffMember) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId ? { ...item, staffMember } : item
          ),
        }));
      },

      setCustomer: (customer) => set({ customer }),
      setOrderType: (orderType) => set({ orderType }),
      setTableNumber: (tableNumber) => set({ tableNumber }),
      setOverallDiscount: (overallDiscount) => set({ overallDiscount }),

      clearCart: () =>
        set({
          items: [],
          customer: null,
          orderType: "WALK_IN",
          tableNumber: null,
          overallDiscount: 0,
        }),

      parkCurrentCart: (customLabel) => {
        const state = get();
        if (state.items.length === 0) return;

        const label =
          customLabel ||
          (state.orderType === "DINE_IN" && state.tableNumber
            ? `Table ${state.tableNumber}`
            : state.customer
            ? state.customer.name
            : `Order #${state.parkedCarts.length + 1} (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`);

        const newParkedCart: ParkedCart = {
          id: `parked-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          label,
          timestamp: Date.now(),
          items: [...state.items],
          customer: state.customer,
          orderType: state.orderType,
          tableNumber: state.tableNumber,
        };

        set({
          parkedCarts: [newParkedCart, ...state.parkedCarts],
          items: [],
          customer: null,
          tableNumber: null,
          orderType: "WALK_IN",
          overallDiscount: 0,
        });
      },

      recallParkedCart: (id) => {
        const state = get();
        const found = state.parkedCarts.find((p) => p.id === id);
        if (!found) return;

        // If there are currently items, park them first
        if (state.items.length > 0) {
          state.parkCurrentCart();
        }

        set((s) => ({
          items: found.items,
          customer: found.customer as any,
          orderType: found.orderType,
          tableNumber: found.tableNumber,
          parkedCarts: s.parkedCarts.filter((p) => p.id !== id),
        }));
      },

      deleteParkedCart: (id) => {
        set((state) => ({
          parkedCarts: state.parkedCarts.filter((p) => p.id !== id),
        }));
      },

      setActiveShift: (activeShift) => set({ activeShift }),

      getSubtotal: () => {
        const { items } = get();
        return items.reduce((acc, item) => {
          const itemSubtotal = item.price * item.quantity - (item.discount || 0);
          return acc + Math.max(0, itemSubtotal);
        }, 0);
      },

      getTotalDiscount: () => {
        const { items, overallDiscount } = get();
        const itemDiscounts = items.reduce((acc, item) => acc + (item.discount || 0), 0);
        return itemDiscounts + overallDiscount;
      },

      getTaxAmount: (taxRate) => {
        const subtotal = get().getSubtotal();
        const overallDiscount = get().overallDiscount;
        const taxable = Math.max(0, subtotal - overallDiscount);
        return Math.round(((taxable * taxRate) / 100) * 100) / 100;
      },

      getTotalAmount: (taxRate) => {
        const subtotal = get().getSubtotal();
        const overallDiscount = get().overallDiscount;
        const tax = get().getTaxAmount(taxRate);
        const total = subtotal - overallDiscount + tax;
        return Math.max(0, Math.round(total * 100) / 100);
      },
    }),
    {
      name: "omnipos-cart-state-v2",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
