import { createContext, useContext, useState, useMemo } from 'react';

type HeaderContextProps = {
  isHeaderVisible: boolean;
  toggleHeader: () => void;
};

const HeaderContext = createContext<HeaderContextProps | null>(null);

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
}

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const toggleHeader = () => {
    setIsHeaderVisible(prev => !prev);
  };

  const contextValue = useMemo(
    () => ({
      isHeaderVisible,
      toggleHeader,
    }),
    [isHeaderVisible]
  );

  return (
    <HeaderContext.Provider value={contextValue}>
      {children}
    </HeaderContext.Provider>
  );
}
