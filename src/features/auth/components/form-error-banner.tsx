import { CircleAlertIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

export function FormErrorBanner({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1 duration-200">
      <CircleAlertIcon />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
