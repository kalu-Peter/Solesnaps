export interface CartItem {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  category: string;
  quantity: number;
  size?: string;
  color?: string;
}

export interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}