// Hand-authored request/response DTOs matching docs/cowork-booking-architecture.md §4.
// (lib/types/database.types.ts holds the generated raw DB row types.)

export interface SpacePricingDTO {
  id: string;
  duration: string;
  slot_type: string;
  price: number;
  description: string | null;
  includes_data_gb: number;
}

export interface SpaceDTO {
  id: string;
  name: string;
  type: string;
  capacity: number;
  description: string | null;
  image_url: string | null;
  amenities: string[];
  requires_specific_seat: boolean;
  total_inventory: number;
  pricing: SpacePricingDTO[];
}

export interface SpacesResponse {
  spaces: SpaceDTO[];
}

export interface AvailabilitySlot {
  available: boolean;
  remaining: number;
}

export interface AvailabilityDay {
  date: string;
  slots: Record<string, AvailabilitySlot>;
}

export interface AvailabilityResponse {
  space_id: string;
  availability: AvailabilityDay[];
}

export interface AddonDTO {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
}

export interface BookingAddonInput {
  addon_id: string;
  quantity: number;
}

export interface BookingCreateRequest {
  space_id: string;
  pricing_id: string;
  date: string;
  slot: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  addons?: BookingAddonInput[];
  payment_method: "payhere" | "qr_transfer" | "stripe";
  workspace_count?: number;
  notes?: string;
}

export interface BookingSummaryDTO {
  id: string;
  booking_number: string;
  space_name: string;
  booking_date: string;
  time_slot: string;
  base_amount: number;
  addons_amount: number;
  discount_amount: number;
  discount_reason: string | null;
  total_amount: number;
  status: string;
  guest_email: string | null;
}

export interface BookingCreateResponse {
  booking: {
    id: string;
    booking_number: string;
    total_amount: number;
    status: string;
  };
}
