import Link from "next/link";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-turquoise/10 text-turquoise"><MapPin size={30} /></span>
      <p className="text-xs tracking-widest text-muted-foreground">404 · МЫ НЕМНОГО ЗАБЛУДИЛИСЬ</p>
      <h1 className="text-3xl font-semibold tracking-tight">Такого адреса здесь нет</h1>
      <p className="max-w-sm text-sm text-muted-foreground">Возможно, ссылка устарела. Найдите нужный дом или район на карте Владивостока.</p>
      <Link href="/" className="mt-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Вернуться на карту</Link>
    </main>
  );
}
