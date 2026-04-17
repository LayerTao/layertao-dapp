"use client";

import { useState } from "react";
import { 
  Network,
  Brain,
  Target,
  Zap,
  Activity,
  Cpu
} from "lucide-react";

export type SubnetOption = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  iconString: string;
  available: boolean;
};

export function SubnetIcon({ 
  iconString, 
  className 
}: { 
  iconString: string; 
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (iconString === "default" || hasError) {
    if (iconString === "lium") return <Cpu className={className} />;
    if (iconString === "targon") return <Zap className={className} />;
    return <Network className={className} />;
  }

  return (
    <img 
      src={`/assets/subnets/${iconString}.svg`}
      alt="Subnet icon"
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

export function RoutingVisual({ 
  activeSubnet, 
  step,
  subnets,
  isUnifiedProtocol
}: { 
  activeSubnet: string; 
  step: 'idle' | 'routing' | 'processing' | 'received';
  subnets: SubnetOption[];
  isUnifiedProtocol?: boolean;
}) {
  const activeIndex = subnets.findIndex(s => s.id === activeSubnet);
  const isActiveIndexFound = activeIndex !== -1;
  const safeActiveIndex = isActiveIndexFound ? activeIndex : 1;
  
  // This state persists the cool "ANALYZING INTENT" visualization even after the target subnet is selected
  const isUnified = activeSubnet === "unified" || isUnifiedProtocol;
  
  const activeTitle = isActiveIndexFound 

    ? subnets[activeIndex].title 
    : (isUnified ? "LayerTao Central Intelligence" : "Subnet");

  // By using strict 1/3 widths for the columns below, 
  // the centers mathematically align perfectly to these percentages.
  const startX = safeActiveIndex === 0 ? 16.666 : safeActiveIndex === 1 ? 50 : 83.333;
  const endX = 50; 
  
  // Smooth S-Curve
  const pathData = `M ${startX} 0 C ${startX} 50, ${endX} 50, ${endX} 100`;

  const statusConfig = {
    idle: {
      title: "SYSTEM READY",
      description: "Select a subnet and send a message to start routing.",
      icon: Activity,
      color: "text-muted-foreground",
      bg: "bg-muted/10",
      border: "border-border/50",
    },
    routing: {
      title: isUnified ? "ANALYZING INTENT" : "ROUTING QUERY",
      description: isUnified 
        ? `LayerTao Intelligence is analyzing your query to determine the optimal compute layer...`
        : `Optimizing path and routing your request to ${activeTitle}...`,
      icon: isUnified ? Zap : Network,
      color: isUnified ? "text-[#71E3AA]" : "text-primary",
      bg: isUnified ? "bg-[#71E3AA]/5" : "bg-primary/5",
      border: isUnified ? "border-[#71E3AA]/30" : "border-primary/20",
    },
    processing: {
      title: isUnified ? "GENERATING RESPONSE" : "PROCESSING",
      description: isUnified
        ? `LayerTao Intelligence routed the task to ${activeTitle} and is synthesizing the generation.`
        : `Subnet ${activeIndex + 1} (${activeTitle}) is generating a response.`,
      icon: isUnified ? Zap : Brain,
      color: isUnified ? "text-fuchsia-400" : "text-amber-500",
      bg: isUnified ? "bg-fuchsia-400/5" : "bg-amber-500/5",
      border: isUnified ? "border-fuchsia-400/30" : "border-amber-500/20",
    },
    received: {
      title: "ROUTING SUCCESSFUL",
      description: `The query has been successfully routed to ${activeTitle} and response received.`,
      icon: Target,
      color: "text-[#71E3AA]", // Updated to match the light green from your screenshot
      bg: "bg-[#71E3AA]/5",
      border: "border-[#71E3AA]/20",
    }
  };

  const currentStatus = statusConfig[step];
  const Icon = currentStatus.icon;

  return (
    <div className="flex flex-col gap-0">
      {/* Subnet Icons Flex Row - Using strict 1/3 widths ensures perfect alignment with SVG */}
      <div className="flex w-full relative z-10">
        {subnets.map((subnet) => {
          const isActive = subnet.id === activeSubnet;
          return (
            <div key={subnet.id} className="w-1/3 px-1.5 flex flex-col items-center gap-2">
              <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground/60"
              }`}>
                {subnet.title}
              </span>
              
              <div className={`aspect-square w-full rounded-2xl transition-all duration-300 relative ${
                isActive 
                  ? "scale-[1.03]" 
                  : "border border-border/40 bg-muted/5 opacity-40"
              }`}>
                {isActive ? (
                  // Gradient Border Wrapper 
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#71E3AA] to-[#7175E3] p-[1.5px]">
                    <div className="w-full h-full rounded-[15.5px] bg-[#090A0F] flex items-center justify-center">
                      <SubnetIcon 
                        iconString={subnet.iconString} 
                        className="h-7 w-7 text-white" 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full rounded-2xl flex items-center justify-center">
                    <SubnetIcon 
                      iconString={subnet.iconString} 
                      className="h-7 w-7 text-muted-foreground" 
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connecting Logic Container */}
      <div className="h-14 w-full relative pointer-events-none -mt-1">
        {/* Background Track Line (Visible when idle) */}
        {step === 'idle' && (
          <svg 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none" 
            className="absolute inset-0 w-full h-full overflow-visible"
          >
            <path 
              d={pathData} 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              className="text-border opacity-30"
            />
          </svg>
        )}

        {/* Active Line & HTML Anchored Dots */}
        {step !== 'idle' && (
          <>
            <svg 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none" 
              className="absolute inset-0 w-full h-full overflow-visible"
            >
               {isUnified && (
                 <defs>
                   <linearGradient id="unified-pulse" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor="#71E3AA">
                       <animate attributeName="stop-color" values="#71E3AA; #718FD5; #71E3AA" dur="2s" repeatCount="indefinite" />
                     </stop>
                     <stop offset="100%" stopColor="#718FD5">
                       <animate attributeName="stop-color" values="#718FD5; #71E3AA; #718FD5" dur="2s" repeatCount="indefinite" />
                     </stop>
                   </linearGradient>
                 </defs>
               )}
               <path 
                 d={pathData} 
                 fill="none" 
                 stroke={isUnified && (step === 'routing' || step === 'processing') ? "url(#unified-pulse)" : "#718FD5"} 
                 strokeWidth={isUnified && (step === 'routing' || step === 'processing') ? "2" : "1.5"}
                 vectorEffect="non-scaling-stroke"
                 className={`transition-all duration-500 ${isUnified && (step === 'routing' || step === 'processing') ? 'opacity-80 drop-shadow-[0_0_8px_rgba(113,227,170,0.6)]' : ''}`}
               />
            </svg>
            
            {/* Origin Dot (Anchored perfectly to top edge) */}
            <div 
              className={`absolute top-0 h-1.5 w-1.5 rounded-full -translate-x-1/2 -translate-y-1/2 ${
                isUnified && (step === 'routing' || step === 'processing') ? 'bg-[#71E3AA] shadow-[0_0_12px_#71E3AA] animate-pulse' : 'bg-[#718FD5] shadow-[0_0_8px_#718FD5]'
              }`} 
              style={{ left: `${startX}%` }} 
            />
            
            {/* Destination Dot (Anchored perfectly to bottom edge) */}
            <div 
              className={`absolute bottom-0 h-1.5 w-1.5 rounded-full -translate-x-1/2 translate-y-1/2 ${
                isUnified && (step === 'routing' || step === 'processing') ? 'bg-[#71E3AA] shadow-[0_0_12px_#71E3AA] animate-pulse' : 'bg-[#718FD5] shadow-[0_0_8px_#718FD5]'
              }`} 
              style={{ left: `${endX}%` }} 
            />
          </>
        )}
      </div>

      {/* Status Box */}
      <div className={`relative rounded-[24px] border ${currentStatus.border} ${currentStatus.bg} p-5 transition-all duration-500 overflow-hidden group z-10`}>
        {step !== 'idle' && (
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon className="h-12 w-12 animate-pulse" />
          </div>
        )}
        
        <div className="flex flex-col items-center text-center gap-3 relative z-10">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${currentStatus.bg} border ${currentStatus.border} transition-colors duration-500`}>
            <Icon className={`h-5 w-5 ${currentStatus.color}`} />
          </div>
          <div>
            <h3 className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-1.5 transition-colors duration-500 ${currentStatus.color}`}>
              {currentStatus.title}
            </h3>
            <p className="text-[12px] leading-relaxed text-muted-foreground font-medium max-w-[200px] mx-auto transition-colors duration-500">
              {currentStatus.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}