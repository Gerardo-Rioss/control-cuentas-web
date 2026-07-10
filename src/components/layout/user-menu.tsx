"use client";

import { useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
        <User className="h-4 w-4" />
      </div>
      <div className="hidden md:block">
        <p className="text-sm font-medium">{session.user.name}</p>
        <p className="text-xs text-muted-foreground">{session.user.email}</p>
      </div>
      <button
        onClick={() => signOut({ redirectTo: "/login" })}
        className="ml-auto rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        title="Cerrar sesión"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
