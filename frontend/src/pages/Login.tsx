import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session) {
      navigate("/", { replace: true });
    }
  }, [session, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError("");

    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setServerError(error.message ?? "Sign in failed");
      return;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-svh p-6">
      <div className="w-full max-w-[380px] text-left">
        <h1 className="text-3xl font-medium text-foreground mb-1">Sign in</h1>
        <p className="text-muted-foreground mb-6">Ticket Management System</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {serverError && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2.5 rounded-md text-sm">
              {serverError}
            </div>
          )}

          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            Email
            <input
              type="email"
              {...register("email")}
              placeholder="admin@example.com"
              className={`px-3 py-2.5 border rounded-md text-[15px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 ${
                errors.email ? "border-destructive" : "border-input"
              }`}
            />
            {errors.email && (
              <span className="text-destructive text-xs mt-1">{errors.email.message}</span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            Password
            <input
              type="password"
              {...register("password")}
              placeholder="Password"
              className={`px-3 py-2.5 border rounded-md text-[15px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 ${
                errors.password ? "border-destructive" : "border-input"
              }`}
            />
            {errors.password && (
              <span className="text-destructive text-xs mt-1">{errors.password.message}</span>
            )}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2.5 bg-primary text-primary-foreground rounded-md text-[15px] font-medium cursor-pointer mt-1 hover:not-disabled:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
