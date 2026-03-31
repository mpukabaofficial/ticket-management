import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorAlertProps {
  message: string | null | undefined;
  className?: string;
}

export function ErrorAlert({ message, className }: ErrorAlertProps) {
  if (!message) return null;

  return (
    <Alert variant="destructive" className={className}>
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
