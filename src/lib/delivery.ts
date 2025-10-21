import { DeliveryLocation } from "@/types/cart";
import { supabaseDb } from './supabase';

export async function fetchDeliveryLocations(): Promise<DeliveryLocation[]> {
  const { data: locations, error } = await supabaseDb.getDeliveryLocations();
  if (error) {
    console.error('Failed to fetch delivery locations:', error.message);
    throw new Error("Failed to fetch delivery locations");
  }
  console.log('Delivery locations:', locations);
  return locations || [];
}
