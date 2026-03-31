import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import UsersTable, { type User } from "@/components/UsersTable";
import CreateUserForm from "@/components/CreateUserForm";

export default function Users() {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Users</h1>
        <CreateUserForm />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {axios.isAxiosError(error)
              ? error.response?.data?.error || error.message
              : "Failed to fetch users"}
          </AlertDescription>
        </Alert>
      )}

      <UsersTable users={users} isPending={isPending} />
    </div>
  );
}
