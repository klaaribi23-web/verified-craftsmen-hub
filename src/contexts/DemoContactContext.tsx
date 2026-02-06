import { createContext, useContext, useState, ReactNode } from "react";

interface DemoContactContextType {
  isContactShared: boolean;
  shareContacts: () => void;
}

const DemoContactContext = createContext<DemoContactContextType>({
  isContactShared: false,
  shareContacts: () => {},
});

export const useDemoContact = () => useContext(DemoContactContext);

export const DemoContactProvider = ({ children }: { children: ReactNode }) => {
  const [isContactShared, setIsContactShared] = useState(false);

  const shareContacts = () => setIsContactShared(true);

  return (
    <DemoContactContext.Provider value={{ isContactShared, shareContacts }}>
      {children}
    </DemoContactContext.Provider>
  );
};
