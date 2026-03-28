import type { ReactNode } from "react";

type SectionBoxProps = {
  title: string;
  children: ReactNode;
  /** Shown inside the panel below the top border (e.g. primary action aligned end). */
  toolbar?: ReactNode;
};

export default function SectionBox({ title, children, toolbar }: SectionBoxProps) {
  return (
    <div className="relative">
      <h2 className="absolute left-4 top-0 z-10 -translate-y-1/2 pr-3 sm:left-6 max-w-[calc(100%-2rem)] truncate text-left text-base font-bold tracking-wide text-crt-phosphor-bright sm:text-lg crt-text-plain bg-crt-panel">
        {title}
      </h2>
      <div className="crt-panel relative z-0 rounded-sm p-4 pt-8 sm:p-6 sm:pt-10">
        {toolbar ? (
          <div className="flex flex-col sm:flex-row sm:justify-end mb-4 gap-3">
            {toolbar}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
