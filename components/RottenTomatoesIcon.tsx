import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export function RottenTomatoesIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("fill-current", className)} {...props}>
      <path d="M10.6 4.2c.7-1.5 2.1-2.5 3.9-2.8.3 1.4-.2 2.8-1.3 3.8 1.3-.6 2.8-.7 4.3-.2-.4 1.4-1.5 2.5-3 3.1 3.9.4 6.7 3.2 6.7 6.9 0 4.3-3.8 7.5-9.2 7.5S2.8 19.3 2.8 15c0-3.8 3-6.7 7-6.9C8.4 7.4 7.4 6.4 7 5c1.3-.4 2.6-.3 3.6.2v-1Z" />
      <path d="M10.8 8.4c.4-1.4.1-2.8-.7-4 .9.5 1.7 1.3 2.1 2.2.7-.9 1.8-1.5 3.2-1.8-.5 1.2-1.4 2.2-2.6 2.8.9-.2 2-.1 3.1.4-1.4.8-3.1 1-5.1.4Z" className="fill-[#00c896]" />
    </svg>
  );
}
