import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  actionHref?: string;
  actionLabel?: string;
  body: string;
  title: string;
};

export function EmptyState({
  actionHref,
  actionLabel,
  body,
  title,
}: EmptyStateProps) {
  return (
    <div className="vr-card px-6 py-8 text-center">
      <h2 className="font-sans text-2xl font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-muted">
        {body}
      </p>
      {actionHref && actionLabel ? (
        <div className="mt-5">
          <Button href={actionHref}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
