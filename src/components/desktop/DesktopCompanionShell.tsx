import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { getPetSpeciesMeta } from '../../domain/pet/pet-species';
import { ActionControls } from '../controls/ActionControls';
import { PetAvatar } from '../pet/PetAvatar';
import type { DesktopInteractiveRegion, DesktopPetState } from '../../types/desktop';
import type { PetAction, PetRuntimeState } from '../../types/pet';
import type { RecentAction } from '../../types/ui';

type DesktopCompanionShellProps = {
  pet: PetRuntimeState;
  recentAction: RecentAction | null;
  runtime: DesktopPetState | null;
  panelOpen: boolean;
  onTogglePanel: () => void;
  onAction: (action: PetAction) => void;
  onInteractiveRegionsChange: (regions: DesktopInteractiveRegion[]) => void;
  onStartDragging: (screenX: number) => void;
  overlayOpen: boolean;
};

export function DesktopCompanionShell({
  pet,
  recentAction,
  runtime,
  panelOpen,
  onTogglePanel,
  onAction,
  onInteractiveRegionsChange,
  onStartDragging,
  overlayOpen
}: DesktopCompanionShellProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const pressRef = useRef<{
    startX: number;
    startY: number;
    dragged: boolean;
    active: boolean;
  }>({ startX: 0, startY: 0, dragged: false, active: false });
  const avatarRef = useRef<HTMLDivElement | null>(null);
  const actionBarRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const controlsVisible = panelOpen || overlayOpen || actionsOpen;

  useEffect(() => {
    if (panelOpen) {
      setActionsOpen(false);
    }
  }, [panelOpen]);

  useEffect(() => {
    const interactiveRefs = controlsVisible
      ? [avatarRef, actionBarRef, panelRef]
      : [avatarRef];

    const publishRegions = () => {
      const elements = [
        ...interactiveRefs
          .map((ref) => ref.current)
          .filter((element): element is HTMLElement => Boolean(element)),
        ...Array.from(
          document.querySelectorAll<HTMLElement>('[data-desktop-interactive="true"]')
        )
      ].filter((element, index, all) => all.indexOf(element) === index);

      const regions = elements.map((element) => {
          const rect = element.getBoundingClientRect();

          return {
            x: Math.max(0, rect.left - 6),
            y: Math.max(0, rect.top - 6),
            width: rect.width + 12,
            height: rect.height + 12
          };
        });

      onInteractiveRegionsChange(regions);
    };

    publishRegions();

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(publishRegions);
    });

    const observedElements = [
      ...interactiveRefs
        .map((ref) => ref.current)
        .filter((element): element is HTMLElement => Boolean(element)),
      ...Array.from(document.querySelectorAll<HTMLElement>('[data-desktop-interactive="true"]'))
    ].filter((element, index, all) => all.indexOf(element) === index);

    observedElements.forEach((element) => {
      observer.observe(element);
    });

    window.addEventListener('resize', publishRegions);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', publishRegions);
      onInteractiveRegionsChange([]);
    };
  }, [
    controlsVisible,
    onInteractiveRegionsChange,
    overlayOpen,
    panelOpen
  ]);

  useEffect(() => {
    function handleWindowMouseMove(event: MouseEvent) {
      if (!pressRef.current.active) {
        return;
      }

      const deltaX = Math.abs(event.screenX - pressRef.current.startX);
      const deltaY = Math.abs(event.screenY - pressRef.current.startY);

      if (!pressRef.current.dragged && (deltaX > 8 || deltaY > 8)) {
        pressRef.current.dragged = true;
        onStartDragging(event.screenX);
      }
    }

    function handleWindowMouseUp() {
      if (!pressRef.current.active) {
        return;
      }

      const wasDragged = pressRef.current.dragged;
      pressRef.current.active = false;
      pressRef.current.dragged = false;

      if (!wasDragged) {
        setActionsOpen((current) => !current);
      }
    }

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [onStartDragging]);

  function handleAvatarMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    pressRef.current = {
      startX: event.screenX,
      startY: event.screenY,
      dragged: false,
      active: true
    };
  }

  function handleQuickAction(action: PetAction) {
    onAction(action);
    setActionsOpen(false);
  }

  return (
    <main
      className={`desktop-companion ${panelOpen ? 'is-panel-open' : ''} ${controlsVisible ? 'is-revealed' : ''}`}
    >
      <section className={`desktop-companion__pet desktop-companion__pet--${runtime?.movementMode ?? 'wander'}`}>
        <div
          className="desktop-companion__avatar"
          onMouseDown={handleAvatarMouseDown}
          ref={avatarRef}
        >
          <PetAvatar pet={pet} recentAction={recentAction} />
        </div>

        {actionsOpen ? (
          <section className="desktop-companion__quick-actions" ref={actionBarRef}>
            <ActionControls pet={pet} onAction={handleQuickAction} variant="desktop-floating" />
          </section>
        ) : null}
      </section>

      {panelOpen ? (
        <aside className="desktop-companion__panel" ref={panelRef}>
          <button className="toy-button toy-button--muted" onClick={onTogglePanel} type="button">
            收起
          </button>
        </aside>
      ) : null}
    </main>
  );
}
