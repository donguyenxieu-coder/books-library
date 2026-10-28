export function AuthHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8 space-y-2">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
