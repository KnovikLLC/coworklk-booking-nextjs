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
