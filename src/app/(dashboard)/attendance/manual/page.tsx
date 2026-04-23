import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { isEntrance } from "@/lib/auth/roles";
import ManualAttendanceClient from "./manual-attendance-page";

export default async function ManualAttendancePage() {
  const user = await getUser();
  if (!isEntrance(user.role)) redirect("/");

  return <ManualAttendanceClient />;
}
