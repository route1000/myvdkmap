"use client";
import Link from "next/link";
import { CityNavLink } from "@/components/map/CityNavLink";
import { usePathname } from "next/navigation";
import { Heart, House, UserRound } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FavoritesPopover } from "./FavoritesPopover";
const links = [
  {href: "/", label: "Главная"},
  {href: "/#map", label: "Карта города"},
  {href: "/report", label: "Обращения"},
  {href: "/bill", label: "Квитанции"},
  {href: "/changes", label: "Работы"},
];
export function CityHeader({mapMode = false}: {mapMode?: boolean}) {
  const path = usePathname();
  return <header className="city-header city-header-v3"><CityNavLink href="/" className="city-brand" aria-label="Мой дом — на главную"><span className="brand-symbol"><House size={24}/></span><span><strong>мой дом<span>.</span></strong><small>ВЛАДИВОСТОК</small></span></CityNavLink><nav aria-label="Главное меню" className="header-navigation">{links.map(l=><CityNavLink key={l.href} href={l.href} className={`header-link ${l.href === "/#map" ? (mapMode || path.startsWith('/d/') || path.startsWith('/house/') || path.startsWith('/issue/') ? 'is-active' : '') : l.href === '/' ? (path==='/' && !mapMode ? 'is-active' : '') : path.startsWith(l.href) ? 'is-active' : ''}`}>{l.label}</CityNavLink>)}</nav><div className="header-tools"><FavoritesPopover side="bottom" align="end"><button className="header-icon" aria-label="Мои дома"><Heart size={20}/></button></FavoritesPopover><ThemeToggle className="header-theme"/><Link href="/me" className="header-account"><UserRound size={18}/><span>Мой кабинет</span></Link></div></header>;
}
