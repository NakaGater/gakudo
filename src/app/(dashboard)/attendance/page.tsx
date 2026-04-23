import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { isEntrance } from "@/lib/auth/roles";
import QrScannerPage from "./qr-scanner-page";

export default async function AttendancePage() {
  const user = await getUser();
  if (!isEntrance(user.role)) redirect("/");

  return <QrScannerPage />;
}
