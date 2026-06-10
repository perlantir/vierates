type LegalTemplateProps = {
  sections: Array<[string, string]>;
  title: string;
  updated: string;
};

export function LegalTemplate({
  sections,
  title,
  updated,
}: LegalTemplateProps) {
  return (
    <main className="vr-section bg-bone">
      <div className="vr-frame vr-legal">
        <p className="vr-data text-sm text-slate">{updated}</p>
        <h1 className="mt-3 text-5xl font-semibold text-ink">{title}</h1>
        <div className="mt-8 grid gap-7">
          {sections.map(([heading, body]) => (
            <section className="border-t border-line pt-5" key={heading}>
              <h2 className="text-2xl font-semibold text-ink">{heading}</h2>
              <p className="mt-3">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
