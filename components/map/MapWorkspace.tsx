"use client";
import dynamic from "next/dynamic";
import { AtlasHUD } from "./AtlasHUD";
import { cn } from "@/lib/utils";
const AtlasMap=dynamic(()=>import('./AtlasMap'),{ssr:false});
export function MapWorkspace({className}:{className?:string}) {
 return <div className={cn('atlas-workspace fixed inset-0 overflow-hidden',className)}><AtlasMap/><AtlasHUD/></div>;
}
