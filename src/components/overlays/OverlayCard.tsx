import type { ReactNode } from 'react';

type OverlayCardProps = {
  title: string;
  description: ReactNode;
  actionLabel: string;
  onClose: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

export function OverlayCard({
  title,
  description,
  actionLabel,
  onClose,
  secondaryActionLabel,
  onSecondaryAction
}: OverlayCardProps) {
  return (
    <div className="overlay-backdrop">
      <div className="overlay-card" data-desktop-interactive="true">
        <h3>{title}</h3>
        <div className="overlay-copy">{description}</div>
        <div className="overlay-actions">
          {secondaryActionLabel && onSecondaryAction ? (
            <button className="toy-button toy-button--muted" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </button>
          ) : null}
          <button className="toy-button toy-button--accent" onClick={onClose}>
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
