type SectionHeadProps = {
  eyebrow?: string;
  sub?: string;
  title: string;
};

export function SectionHead({ eyebrow, sub, title }: SectionHeadProps) {
  return (
    <div className="mb-8 max-w-3xl">
      {eyebrow ? <p className="vr-eyebrow text-text-muted">{eyebrow}</p> : null}
      <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
        {title}
      </h2>
      {sub ? <p className="mt-4 text-lg leading-8 text-text">{sub}</p> : null}
    </div>
  );
}
