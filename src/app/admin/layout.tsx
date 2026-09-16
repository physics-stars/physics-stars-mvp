import { getCurrentUser } from "@/server/services/current-user";
import { DashboardHeader } from "@/components/shared/DashboardHeader";

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
      {children}
    </div>
  );
}
