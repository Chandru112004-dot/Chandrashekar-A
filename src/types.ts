export interface Product {
  id: string;
  name: string;
  localName: string; // e.g., "Pyaz (Onion)" or "Doodh (Fresh Milk)"
  category: string;
  price: number; // in ₹
  unit: string;  // e.g. "1 kg", "500 ml", "1 packet"
  stock: number;
  image: string; // URL or emoji-based visual representation
  description: string;
  shopId?: string;
  reviews?: {
    id: string;
    reviewerName: string;
    rating: number; // out of 5 stars
    text: string;
    createdAt: string;
  }[];
}

export interface City {
  id: string;
  name: string;
}

export interface Shop {
  id: string;
  name: string;
  cityName: string;
  gstin: string;
  email: string;
  details?: string;
  address?: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  status: 'Idle' | 'Delivering' | 'Offline';
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'Placed' | 'Packing' | 'On the Way' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryCity: string;
  deliveryAddress: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    unit: string;
  }[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  riderName?: string;
  riderPhone?: string;
  etaMinutes?: number;
  appliedCoupon?: string;
  discountAmount?: number;
}

export interface TrackingStep {
  latitude: number;
  longitude: number;
  heading: number;
  status: OrderStatus;
  progress: number; // 0 to 100
  milestoneDescription: string;
}
