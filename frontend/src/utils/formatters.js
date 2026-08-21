/**
 * TripPulse Data Formatting & Helper Utilities
 * Provides safe, robust formatting for currency, dates, city names,
 * smart trip titles (eliminating glitch values like 'nn'), and destination visuals.
 */

// Curated high-resolution photography for Indian and global destinations
const DESTINATION_IMAGES = {
  coimbatore: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
  ooty: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
  madurai: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=80',
  kanyakumari: 'https://images.unsplash.com/photo-1600100397608-f010f443b745?auto=format&fit=crop&w=1200&q=80',
  chennai: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
  munnar: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1200&q=80',
  munoor: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1200&q=80',
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
  bangalore: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80',
  kochi: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
  tokyo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
  dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
  singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80',
  london: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'
};

/**
 * Capitalizes and standardizes city and location names.
 * e.g., 'coimbatore' -> 'Coimbatore', 'kaniya kumari ' -> 'Kanyakumari'
 */
export const formatCity = (name) => {
  if (!name || typeof name !== 'string') return '';
  const clean = name.trim();
  if (!clean) return '';
  
  // Specific normalization for common variants
  const lower = clean.toLowerCase();
  if (lower.includes('kaniya') || lower.includes('kanya')) return 'Kanyakumari';
  if (lower.includes('munoor') || lower.includes('munnar')) return 'Munnar';
  
  return clean
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Intelligently resolves and formats the Trip Title.
 * Detects invalid entries (like 'nn', 'uyt', 'trip', single characters, undefined)
 * and generates a clean, premium travel title.
 */
export const formatTripTitle = (trip) => {
  if (!trip) return 'My Trip';
  
  const rawTitle = typeof trip.title === 'string' ? trip.title.trim() : '';
  const dest = formatCity(trip.destination);
  const origin = formatCity(trip.current_location);

  // Blacklist of test typos / glitch values
  const lowerTitle = rawTitle.toLowerCase();
  const isInvalid = !rawTitle || 
    rawTitle.length < 3 || 
    ['nn', 'uyt', 'test', 'trip', 'maja trip', 'null', 'undefined'].includes(lowerTitle);

  if (!isInvalid) {
    return rawTitle;
  }

  // Meaningful fallback: "Origin → Destination Trip" or "Destination Trip"
  if (origin && dest && origin.toLowerCase() !== dest.toLowerCase()) {
    return `${origin} → ${dest} Trip`;
  }
  if (dest) {
    return `${dest} Trip`;
  }
  return 'My Trip';
};

/**
 * Formats a currency number in INR format (e.g. ₹15,000).
 */
export const formatCurrency = (amount) => {
  const num = Number(amount);
  if (isNaN(num) || num === null || num === undefined) return '₹0';
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
};

/**
 * Formats a single date string (e.g. '2026-08-20' -> '20 Aug 2026').
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

/**
 * Formats a date range human-readably (e.g. '20 Aug – 23 Aug 2026').
 */
export const formatDateRange = (startDate, endDate, daysCount = null) => {
  if (!startDate) return 'Dates pending';
  const start = formatDate(startDate);
  if (!endDate || startDate === endDate) {
    return `${start}${daysCount ? ` (${daysCount} Days)` : ''}`;
  }
  const end = formatDate(endDate);
  return `${start} – ${end}${daysCount ? ` · ${daysCount} Days` : ''}`;
};

/**
 * Returns a curated, high-quality destination photo URL with guaranteed fallback.
 */
export const getDestinationImage = (destination) => {
  if (!destination || typeof destination !== 'string') return DESTINATION_IMAGES.default;
  const key = destination.trim().toLowerCase().replace(/[^a-z]/g, '');
  for (const [cityKey, url] of Object.entries(DESTINATION_IMAGES)) {
    if (key.includes(cityKey) || cityKey.includes(key)) {
      return url;
    }
  }
  return DESTINATION_IMAGES.default;
};

export default {
  formatCity,
  formatTripTitle,
  formatCurrency,
  formatDate,
  formatDateRange,
  getDestinationImage
};
