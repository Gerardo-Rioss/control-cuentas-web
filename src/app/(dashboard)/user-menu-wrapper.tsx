"use client";

import { SessionProvider } from "next-auth/react";
import { UserMenu } from "@/components/layout/user-menu";

export function UserMenuWrapper() {
  return (
    <SessionProvider>
      <UserMenu />
    </SessionProvider>
  );
}
