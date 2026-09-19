import { Eye, GraduationCap, LayoutDashboard } from "lucide-react";
import { getCurrentUser } from "@/server/services/current-user";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { SubNav } from "@/components/shared/SubNav";

/*
 * Estructura comuna de les pàgines de professorat: capçalera i
 * navegació entre seccions.
 * IMPORTANT: aquest layout NO fa cap comprovació d'autorització (només
 * llegeix l'usuari per mostrar-lo a la capçalera) perquè els layouts no
 * es tornen a executar en cada navegació entre pàgines germanes; el
 * control d'accés real (`requireRole("TEACHER")`) es fa a cada pàgina.
 */
export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        displayName={user?.displayName ?? ""}
        homeHref="/teacher"
      />
      <SubNav
        items={[
          { href: "/teacher", label: "Resum", icon: <LayoutDashboard className="h-4 w-4" /> },
          { href: "/teacher/aules", label: "Aules", icon: <GraduationCap className="h-4 w-4" /> },
          { href: "/teacher/contingut", label: "Contingut", icon: <Eye className="h-4 w-4" /> },
        ]}
      />
      {children}
    </div>
  );
}
