import { UserManagementClient } from "./client";

export const metadata = {
  title: "User Management | Admin | ABFI Platform",
  description: "Manage platform users, roles, and permissions",
};

export default function AdminUsersPage() {
  return <UserManagementClient />;
}
