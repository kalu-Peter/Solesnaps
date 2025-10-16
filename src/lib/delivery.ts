import { DeliveryLocation } from "@/types/cart";

export async function fetchDeliveryLocations(): Promise<DeliveryLocation[]> {
  const res = await fetch("http://localhost:5000/api/delivery");
  if (!res.ok) throw new Error("Failed to fetch delivery locations");
  const data = await res.json();
  return data.data.locations; // Extract locations from the nested response structure
}
