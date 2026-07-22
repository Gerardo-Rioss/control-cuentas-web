import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenuWrapper } from "./user-menu-wrapper";
import { PageTransition } from "@/components/layout/page-transition";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-end gap-4 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 px-6">
          <div className="flex-1" />
          <UserMenuWrapper />
        </header>
        <main className="flex-1 p-4 md:p-6 pb-20 lg:pb-6">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
