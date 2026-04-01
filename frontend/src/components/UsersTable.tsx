import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { RiEditLine, RiDeleteBinLine } from "@remixicon/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Role } from "shared";
import type { RoleType } from "shared";
import UserFormDialog from "@/components/UserFormDialog";

export interface User {
  id: string;
  email: string;
  name: string;
  role: RoleType;
  createdAt: string;
  deletedAt: string | null;
}

interface UsersTableProps {
  users: User[] | undefined;
  isPending: boolean;
  showDeleted: boolean;
}

function RoleBadge({ role }: { role: RoleType }) {
  const isAdmin = role === Role.ADMIN;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-xl border ${
      isAdmin
        ? "bg-primary/10 text-primary border-primary/20"
        : "bg-stone-100 text-stone-600 border-stone-200"
    }`}>
      {role}
    </span>
  );
}

export default function UsersTable({
  users,
  isPending,
  showDeleted,
}: UsersTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
        withCredentials: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeletingUser(null);
      toast.success("User deleted successfully");
    },
    onError: (error) => {
      setDeletingUser(null);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || "Failed to delete user"
        : "Failed to delete user";
      toast.error(message);
    },
  });

  const filteredUsers = showDeleted
    ? users
    : users?.filter((u) => !u.deletedAt);

  return (
    <>
      <Card className="rounded-2xl shadow-sm shadow-border/30">
        <CardContent className="p-0">
          {isPending ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-44" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-7 w-14 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : filteredUsers?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              No users found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => {
                  const isDeleted = !!user.deletedAt;
                  return (
                    <TableRow
                      key={user.id}
                      className={cn(
                        "hover:bg-accent/50 transition-colors",
                        isDeleted && "opacity-50"
                      )}
                    >
                      <TableCell className="font-medium">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <RoleBadge role={user.role} />
                          {isDeleted && (
                            <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-xl border bg-red-50 text-red-600 border-red-200">
                              Deleted
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {new Date(user.createdAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </TableCell>
                      <TableCell>
                        {!isDeleted && (
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setEditingUser(user)}
                              aria-label={`Edit ${user.name}`}
                            >
                              <RiEditLine />
                            </Button>
                            {user.role !== Role.ADMIN && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setDeletingUser(user)}
                                aria-label={`Delete ${user.name}`}
                              >
                                <RiDeleteBinLine />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editingUser && (
        <UserFormDialog
          mode="edit"
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => {
            if (!open) setEditingUser(null);
          }}
        />
      )}

      <AlertDialog
        open={!!deletingUser}
        onOpenChange={(open) => {
          if (!open) setDeletingUser(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deletingUser?.name}
              </span>
              ? They will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="rounded-xl"
              onClick={() => {
                if (deletingUser) {
                  deleteMutation.mutate(deletingUser.id);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
