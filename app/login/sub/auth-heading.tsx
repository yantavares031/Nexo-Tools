export function AuthHeading({ title, description }: { title: string; description: string }) {
  return (
    <>
      <span className="mb-2 block h-[3px] w-[72px] rounded-full bg-accent" aria-hidden />
      <h1 className="text-[28px] font-semibold tracking-tight text-neutral-950">{title}</h1>
      <p className="mt-1.5 text-sm text-neutral-500">{description}</p>
    </>
  );
}
