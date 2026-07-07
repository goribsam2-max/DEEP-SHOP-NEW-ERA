import React from 'react';

export const useTranslate = (text: string) => {
  return text;
};

// Component for wrapping text
export const Tr = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
