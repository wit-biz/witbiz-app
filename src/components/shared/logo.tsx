
import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 40"
      className={cn("h-8 w-auto", className)}
      aria-label="WitBiz Logo"
    >
      <rect className="logo-rect" x="0" y="0" width="80" height="40" fill="black" />
      
      <text
        className="logo-wit-text"
        x="40"
        y="27"
        fontSize="20"
        fill="white"
        textAnchor="middle"
        fontWeight="bold"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        WIT
      </text>
      
      <text
        x="120"
        y="27"
        fontSize="20"
        fill="black"
        textAnchor="middle"
        fontWeight="bold"
        className="logo-biz-text"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        BIZ
      </text>
      
      <style>
        {`
          .dark .logo-rect {
              fill: white;
          }
          .dark .logo-wit-text {
              fill: black;
          }
          .dark .logo-biz-text {
              fill: white;
          }
        `}
      </style>
    </svg>
  );
