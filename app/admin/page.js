import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { styles } from "../components/styles";
import UsersTable from "./components/UsersTable";
import MoyensTable from "./components/MoyensTable";
import ListesChampsTable from "./components/ListesChampsTable";
import PiedMessageForm from "./components/PiedMessageForm";

export const metadata = { title: "Administration — Générateur DPS" };

export default async function AdminPage() {
  const headersList = await headers();
  // Vérification UX (redirection) : le middleware a déjà posé x-role d'après
  // un cookie de session validé. L'application réelle des droits se fait
  // côté serveur, indépendamment, dans chaque route /api/admin/*.
  if (headersList.get("x-role") !== "admin") {
    redirect("/");
  }

  return (
    <div style={styles.page}>
      <header style={styles.header} className="no-print">
        <div style={styles.headerTitle}>
          <span aria-hidden="true">✚</span>
          Administration des comptes
        </div>
        <div style={styles.headerActions}>
          <Link style={styles.ghostBtn} href="/">
            Retour à l&apos;application
          </Link>
        </div>
      </header>
      <main style={{ ...styles.main, display: "flex", flexDirection: "column", gap: "32px" }}>
        <UsersTable />
        <MoyensTable />
        <ListesChampsTable />
        <PiedMessageForm />
      </main>
    </div>
  );
}
