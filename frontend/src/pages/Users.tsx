import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import UsersTable, { type User } from "@/components/UsersTable";
import UserFormDialog from "@/components/UserFormDialog";

export default function Users() {
  const [showDeleted, setShowDeleted] = useState(false);

  const {
    data: users,
    isPending,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      axios
        .get<{ users: User[] }>(`${import.meta.env.VITE_API_URL}/api/users`, {
          withCredentials: true,
        })
        .then((res) => res.data.users),
  });

  const errorMessage = error
    ? axios.isAxiosError(error)
      ? error.response?.data?.error || error.message
      : "Failed to fetch users"
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Users</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-deleted"
              checked={showDeleted}
              onCheckedChange={(checked) => setShowDeleted(checked === true)}
            />
            <Label
              htmlFor="show-deleted"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Show deleted
            </Label>
          </div>
          <UserFormDialog mode="create" />
        </div>
      </div>

      <ErrorAlert message={errorMessage} className="mb-6" />

      <UsersTable users={users} isPending={isPending} showDeleted={showDeleted} />
    </div>
  );
}
