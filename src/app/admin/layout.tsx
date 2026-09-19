import { LayoutDashboard, Map, Users } from "lucide-react";
import { getCurrentUser } from "@/server/services/current-user";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { SubNav } from "@/components/shared/SubNav";

// Estructura comuna de les pàgines d'administració. Vegeu el comentari a
// `app/teacher/layout.tsx`: el control d'accés real es fa a cada pàgina.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        displayName={user?.displayName ?? ""}
        roleLabel="Administració"
        homeHref="/admin"
      />
      <SubNav
        items={[
          { href: "/admin", label: "Resum", icon: <LayoutDashboard className="h-4 w-4" /> },
          { href: "/admin/global", label: "Usuaris i aules", icon: <Users className="h-4 w-4" /> },
          { href: "/admin/worlds", label: "Mons i nivells", icon: <Map className="h-4 w-4" /> },
        ]}
      />
      {children}
    </div>
  );
}
