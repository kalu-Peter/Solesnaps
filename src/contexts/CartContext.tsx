import React, { createContext, useContext, useReducer, useEffect } from "react";
import { CartItem, CartContextType, DeliveryLocation, AppliedCoupon } from "@/types/cart";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  selectedDeliveryLocation?: DeliveryLocation;
  shippingCost: number;
  appliedCoupon?: AppliedCoupon;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "APPLY_COUPON"; payload: AppliedCoupon }
  | { type: "REMOVE_COUPON" }
  | { type: "CLEAR_CART" }
  | { type: "OPEN_CART" }
  | { type: "CLOSE_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] }
  | { type: "SET_DELIVERY_LOCATION"; payload: DeliveryLocation };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "SET_DELIVERY_LOCATION":
      console.log("Setting delivery location:", action.payload);
      console.log("Shopping amount from location:", action.payload.shopping_amount);
      const shippingCost = Number(action.payload.shopping_amount);
      console.log("Parsed shipping cost:", shippingCost);
      return {
        ...state,
        selectedDeliveryLocation: action.payload,
        shippingCost: shippingCost,
      };
    case "ADD_ITEM": {
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }

      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };

    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.id !== action.payload.id),
        };
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }

    case "CLEAR_CART":
      return {
        ...state,
        items: [],
        selectedDeliveryLocation: undefined,
        shippingCost: 0,
        appliedCoupon: undefined,
      };

    case "APPLY_COUPON":
      return {
        ...state,
        appliedCoupon: action.payload,
      };

    case "REMOVE_COUPON":
      return {
        ...state,
        appliedCoupon: undefined,
      };

    case "OPEN_CART":
      return {
        ...state,
        isOpen: true,
      };

    case "CLOSE_CART":
      return {
        ...state,
        isOpen: false,
      };

    case "LOAD_CART":
      return {
        ...state,
        items: action.payload,
      };

    default:
      return state;
  }
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isOpen: false,
    selectedDeliveryLocation: undefined,
    shippingCost: 0,
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("techstyle-cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Ensure all cart item IDs are strings to handle UUID compatibility
        const validatedCart = parsedCart.map((item: any) => ({
          ...item,
          id: String(item.id) // Convert any numeric IDs to strings
        }));
        console.log("Loading cart from localStorage, validating IDs:", validatedCart.map((item: any) => ({ id: item.id, name: item.name })));
        dispatch({ type: "LOAD_CART", payload: validatedCart });
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
        // Clear invalid cart data
        localStorage.removeItem("techstyle-cart");
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem("techstyle-cart", JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (item: Omit<CartItem, "quantity">) => {
    // Ensure ID is always a string for UUID compatibility
    const validatedItem = {
      ...item,
      id: String(item.id)
    };
    console.log("Adding item to cart with validated ID:", validatedItem.id, "name:", validatedItem.name);
    dispatch({ type: "ADD_ITEM", payload: validatedItem });
  };

  const setDeliveryLocation = (location: DeliveryLocation) => {
    dispatch({ type: "SET_DELIVERY_LOCATION", payload: location });
  };

  const removeItem = (id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
    // Also clear localStorage to reset any invalid data
    localStorage.removeItem("techstyle-cart");
  };

  const openCart = () => {
    dispatch({ type: "OPEN_CART" });
  };

  const closeCart = () => {
    dispatch({ type: "CLOSE_CART" });
  };

  const applyCoupon = (coupon: AppliedCoupon) => {
    dispatch({ type: "APPLY_COUPON", payload: coupon });
  };

  const removeCoupon = () => {
    dispatch({ type: "REMOVE_COUPON" });
  };

  const totalItems = state.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalPrice = state.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  const couponDiscount = state.appliedCoupon?.discount_amount || 0;
  const finalTotal = Math.max(0, totalPrice + state.shippingCost - couponDiscount);

  const value: CartContextType = {
    items: state.items,
    totalItems,
    totalPrice,
    appliedCoupon: state.appliedCoupon,
    couponDiscount,
    finalTotal,
    isOpen: state.isOpen,
    selectedDeliveryLocation: state.selectedDeliveryLocation,
    setDeliveryLocation,
    shippingCost: state.shippingCost,
    addItem,
    removeItem,
    updateQuantity,
    applyCoupon,
    removeCoupon,
    clearCart,
    openCart,
    closeCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
