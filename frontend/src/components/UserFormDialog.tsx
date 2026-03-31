import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { createUserSchema, editUserSchema } from "shared";
import { RiLoaderLine, RiAddLine } from "@remixicon/react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import type { User } from "@/components/UsersTable";

type CreateProps = {
  mode: "create";
};

type EditProps = {
  mode: "edit";
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type UserFormDialogProps = CreateProps | EditProps;

interface FormData {
  name: string;
  email: string;
  password: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyResolver = any;

export default function UserFormDialog(props: UserFormDialogProps) {
  const isEdit = props.mode === "edit";
  const [internalOpen, setInternalOpen] = useState(false);
  const [serverError, setServerError] = useState("");
  const queryClient = useQueryClient();

  const open = isEdit ? props.open : internalOpen;
  const setOpen = isEdit ? props.onOpenChange : setInternalOpen;

  const form = useForm<FormData>({
    resolver: zodResolver(isEdit ? editUserSchema : createUserSchema) as AnyResolver,
    defaultValues: {
      name: isEdit ? props.user.name : "",
      email: isEdit ? props.user.email : "",
      password: "",
    },
  });

  const editUserId = isEdit ? props.user.id : null;
  const editUserName = isEdit ? props.user.name : "";
  const editUserEmail = isEdit ? props.user.email : "";

  useEffect(() => {
    if (isEdit && open) {
      form.reset({
        name: editUserName,
        email: editUserEmail,
        password: "",
      });
    }
  }, [isEdit, open, editUserId, editUserName, editUserEmail, form]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEdit
        ? axios.put(
            `${import.meta.env.VITE_API_URL}/api/users/${props.user.id}`,
            data,
            { withCredentials: true },
          )
        : axios.post(`${import.meta.env.VITE_API_URL}/api/users`, data, {
            withCredentials: true,
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      form.reset();
      setServerError("");
      toast.success(isEdit ? "User updated successfully" : "User created successfully");
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        setServerError(
          error.response?.data?.error ||
            `Failed to ${isEdit ? "update" : "create"} user`,
        );
      } else {
        setServerError(`Failed to ${isEdit ? "update" : "create"} user`);
      }
    },
  });

  const onSubmit = (data: FormData) => {
    setServerError("");
    mutation.mutate(data);
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      form.reset();
      setServerError("");
    }
  };

  const formContent = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit User" : "Create User"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update the user's details. Leave password empty to keep it unchanged."
            : "Add a new user to the system."}
        </DialogDescription>
      </DialogHeader>
      <form autoComplete="off" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="John Doe"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  autoComplete="off"
                  placeholder="user@example.com"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="password"
                  autoComplete="new-password"
                  placeholder={isEdit ? "Leave empty to keep unchanged" : "Password"}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        <DialogFooter className="mt-4">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <RiLoaderLine className="animate-spin" />}
            {mutation.isPending
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save Changes"
                : "Create User"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );

  if (isEdit) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {formContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <RiAddLine />
          Create User
        </Button>
      </DialogTrigger>
      {formContent}
    </Dialog>
  );
}
