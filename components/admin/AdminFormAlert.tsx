type Props = {
  message: string | null | undefined;
  variant?: "error" | "success";
};

export function AdminFormAlert({ message, variant = "error" }: Props) {
  if (!message?.trim()) return null;
  const styles =
    variant === "success"
      ? "border-emerald-300 bg-emerald-50 text-emerald-950"
      : "border-red-300 bg-red-50 text-red-950";
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${styles}`} role="alert">
      {message}
    </div>
  );
}
