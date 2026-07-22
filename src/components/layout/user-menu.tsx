"use client";

import { useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="hidden md:block space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
        <User className="h-4 w-4" />
      </div>
      <div className="hidden md:block">
        <p className="text-sm font-medium leading-tight">{session.user.name}</p>
        <p className="text-xs text-muted-foreground">{session.user.email}</p>
      </div>
      <button
        onClick={() => signOut({ redirectTo: "/login" })}
        className="ml-2 rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        title="Cerrar sesión"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
