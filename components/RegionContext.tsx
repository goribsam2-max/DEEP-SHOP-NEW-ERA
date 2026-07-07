import React, { createContext, useContext, useState, useEffect } from 'react';

type Region = 'BD' | 'IN' | 'PK';

interface RegionContextType {
  region: Region;
  setRegion: (region: Region) => void;
  formatPrice: (priceBdt: number) => string;
}

const RegionContext = createContext<RegionContextType>({
  region: 'BD',
  setRegion: () => {},
  formatPrice: (priceBdt) => {
    const num = typeof priceBdt === 'number' ? priceBdt : parseFloat(priceBdt as string) || 0;
    return `৳${num.toLocaleString()}`
  }
});

export const RegionProvider = ({ children }: { children: React.ReactNode }) => {
  const [region, setRegion] = useState<Region>('BD');

  useEffect(() => {
    localStorage.setItem('user_region', 'BD');
    setRegion('BD');
  }, []);

  const handleSetRegion = (newRegion: Region) => {
    setRegion('BD');
    localStorage.setItem('user_region', 'BD');
  };

  const formatPrice = (priceBdt: any) => {
    const numericPrice = typeof priceBdt === 'number' ? priceBdt : parseFloat(priceBdt as string) || 0;
    return `৳${numericPrice.toLocaleString()}`;
  };

  return (
    <RegionContext.Provider value={{ region, setRegion: handleSetRegion, formatPrice }}>
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = () => useContext(RegionContext);
