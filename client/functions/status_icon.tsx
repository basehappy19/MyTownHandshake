// client/functions/status_icon.tsx
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import React from "react";

type IconName = keyof typeof LucideIcons;
type IconComponent = React.ComponentType<LucideProps>;

interface GetStatusIconOpts {
  icon?: string | null;       
  className?: string;        
  done?: boolean;             
}

export function getStatusIconFromDB({
  icon,
  className = "w-5 h-5 text-white",
  done = false,
}: GetStatusIconOpts) {
  if (done) {
    const DoneIcon = LucideIcons.CheckCircle as IconComponent;
    return <DoneIcon className={className} />;
  }

  if (icon && (icon as IconName) in LucideIcons) {
    const Comp = LucideIcons[icon as IconName] as unknown as IconComponent;
    return <Comp className={className} />;
  }

  const Fallback = LucideIcons.Clock as IconComponent;
  return <Fallback className={className} />;
}
