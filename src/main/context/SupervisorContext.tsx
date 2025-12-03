import { createContext, useContext, useEffect, useState } from "react";

interface SupervisorContextType {
  isSupervisor: boolean;
  setIsSupervisor: (value: boolean) => void;
}

const SupervisorContext = createContext<SupervisorContextType | undefined>(
  undefined
);

export const SupervisorProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isSupervisor, setIsSupervisor] = useState<boolean>(false);

  const loadFromStorage = () => {
    const stored = localStorage.getItem("is_superuser");
    if (stored) setIsSupervisor(JSON.parse(stored));
  };

  useEffect(() => {
    loadFromStorage();

    const handleFocus = () => loadFromStorage();
    window.addEventListener("focus", handleFocus);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadFromStorage();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const updateSupervisor = (value: boolean) => {
    setIsSupervisor(value);
    localStorage.setItem("is_superuser", JSON.stringify(value));
  };

  return (
    <SupervisorContext.Provider
      value={{ isSupervisor, setIsSupervisor: updateSupervisor }}
    >
      {children}
    </SupervisorContext.Provider>
  );
};

export const useSupervisor = () => {
  const ctx = useContext(SupervisorContext);
  if (!ctx)
    throw new Error("useSupervisor must be used inside SupervisorProvider");
  return ctx;
};
