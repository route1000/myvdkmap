"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-work/10 text-work"><RefreshCw size={28} /></span>
      <h1 className="text-2xl font-semibold tracking-tight">Не удалось открыть страницу</h1>
      <p className="max-w-sm text-sm text-muted-foreground">Попробуйте ещё раз. Если ошибка повторяется, вернитесь к карте.</p>
      <button onClick={reset} className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Попробовать ещё раз</button>
      <Link href="/" className="text-sm text-turquoise underline underline-offset-4">На карту города</Link>
    </main>
  );
}
