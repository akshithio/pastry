import { useEffect, useState } from "react";

const getInitialState = () => {
  if (typeof window === "undefined") return false;
  const savedState = localStorage.getItem("sidebarCollapsed");
  return savedState !== null ? (JSON.parse(savedState) as boolean) : false;
};

export const useSidebarCollapse = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(getInitialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const newState = !prev;

      if (typeof window !== "undefined") {
        localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
      }
      return newState;
    });
  };

  return {
    isSidebarCollapsed,
    handleToggleSidebarCollapse,
    isHydrated,
  };
};
