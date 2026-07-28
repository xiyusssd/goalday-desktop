import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { ReactNode } from "react";

interface Props {
  id: string;
  children: ReactNode;
  className?: string;
}

/** Generic droppable region that highlights when a draggable hovers over it. */
export function Droppable({ id, children, className }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        className,
        isOver && "outline outline-2 outline-brand-400/70 bg-brand-50/60 dark:bg-brand-500/10",
      )}
    >
      {children}
    </div>
  );
}
