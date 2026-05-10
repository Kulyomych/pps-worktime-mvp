import type { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
}

export const PageLayout = ({ children }: PageLayoutProps) => (
  <div className="page-root">
    <div className="page-layout">{children}</div>
  </div>
);
