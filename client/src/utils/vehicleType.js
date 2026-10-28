/**
 * FixIt Now - Shared Vehicle Type Label Formatter
 * Standardizes vehicle type labels across Partner Dashboard, Partner Profile, and Admin Views.
 *
 * Mappings:
 * - 'bike_scooter' -> "Bike / Scooter"
 * - 'car'          -> "Car"
 */

export const VEHICLE_TYPE_LABELS = {
  bike_scooter: 'Bike / Scooter',
  car: 'Car',
};

export const VEHICLE_TYPE_OPTIONS = [
  { value: 'bike_scooter', label: 'Bike / Scooter' },
  { value: 'car', label: 'Car' },
];

export function formatVehicleType(vehicleType) {
  if (!vehicleType) return 'Bike / Scooter';
  const norm = String(vehicleType).toLowerCase().trim();
  return VEHICLE_TYPE_LABELS[norm] || 'Bike / Scooter';
}

export default formatVehicleType;
