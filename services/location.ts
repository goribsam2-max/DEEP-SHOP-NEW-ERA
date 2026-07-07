
export const getReadableAddress = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'DEEP.SHOP/1.0'
      }
    });
    const data = await response.json();
    if (data.address) {
      const area = data.address.suburb || data.address.neighbourhood || data.address.village || '';
      const thana = data.address.city_district || data.address.town || '';
      const district = data.address.state_district || data.address.county || '';
      return [area, thana, district].filter(Boolean).join(', ') || 'Dhaka, Bangladesh';
    }
    return 'Dhaka, Bangladesh';
  } catch (error) {
    console.error("Geocoding Error:", error);
    return 'Dhaka, Bangladesh';
  }
};
