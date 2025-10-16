
export interface CartItem {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  quantity: number;
  size?: string;
  color?: string;
}

export interface DeliveryLocation {
  id: number;
  city: string;
  shopping_amount: number;
  pick_up_location: string;
  pick_up_phone: string;
  status: string;
}

export interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  selectedDeliveryLocation?: DeliveryLocation;
  setDeliveryLocation: (location: DeliveryLocation) => void;
  shippingCost: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}