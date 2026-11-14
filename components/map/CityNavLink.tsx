"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";

/** Same-page map links notify the hash subscriber; normal routes stay client-side. */
export function CityNavLink({ href, onClick, ...props }: ComponentProps<typeof Link>) {
  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    const plain = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    if (plain && location.pathname === "/") {
      if (href === "/#map") {
        event.preventDefault();
        location.hash = "map";
        return;
      }
      if (href === "/" && location.hash === "#map") {
        event.preventDefault();
        location.assign("/");
        return;
      }
    }
    onClick?.(event);
  }
  return <Link {...props} href={href} onClick={navigate} />;
}
