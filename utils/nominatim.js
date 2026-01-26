// Nominatim API Utility for Address Lookups
// Documentation: https://nominatim.org/release-docs/develop/api/

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

// Reverse Geocoding: Convert coordinates to address
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const url = `${NOMINATIM_BASE_URL}/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "EcodarshiniBackend/1.0",
        "Accept-Language": "en",
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      display_name: data.display_name,
      road: data.address?.road || data.address?.neighbourhood || null,
      city: data.address?.city || data.address?.town || data.address?.village || null,
      state: data.address?.state || null,
      country: data.address?.country || null,
      postcode: data.address?.postcode || null,
      osm_id: data.osm_id || null,
      osm_type: data.osm_type || null,
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon),
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    throw error;
  }
};

// Search: Convert address text to coordinates
export const searchAddress = async (query) => {
  try {
    const url = `${NOMINATIM_BASE_URL}/search?format=jsonv2&q=${encodeURIComponent(query)}&addressdetails=1&limit=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "EcodarshiniBackend/1.0",
        "Accept-Language": "en",
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];

    return {
      display_name: result.display_name,
      road: result.address?.road || result.address?.neighbourhood || null,
      city: result.address?.city || result.address?.town || result.address?.village || null,
      state: result.address?.state || null,
      country: result.address?.country || null,
      postcode: result.address?.postcode || null,
      osm_id: result.osm_id || null,
      osm_type: result.osm_type || null,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };
  } catch (error) {
    console.error("Address search error:", error);
    throw error;
  }
};

// Lookup: Get details by OSM ID
export const lookupOsmId = async (osmType, osmId) => {
  try {
    // osmType should be N (node), W (way), or R (relation)
    const typePrefix = osmType.charAt(0).toUpperCase();
    const url = `${NOMINATIM_BASE_URL}/lookup?format=jsonv2&osm_ids=${typePrefix}${osmId}&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "EcodarshiniBackend/1.0",
        "Accept-Language": "en",
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];

    return {
      display_name: result.display_name,
      road: result.address?.road || result.address?.neighbourhood || null,
      city: result.address?.city || result.address?.town || result.address?.village || null,
      state: result.address?.state || null,
      country: result.address?.country || null,
      postcode: result.address?.postcode || null,
      osm_id: result.osm_id || null,
      osm_type: result.osm_type || null,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };
  } catch (error) {
    console.error("OSM lookup error:", error);
    throw error;
  }
};
