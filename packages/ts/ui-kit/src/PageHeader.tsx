import { forwardRef } from "react";

/** @req FR-UI-02, P1A-AC-05: Shared route heading and focus destination. */
export const PageHeader = forwardRef<
  HTMLHeadingElement,
  {
    title: string;
    eyebrow?: string;
  }
>(function PageHeader({ title, eyebrow }, ref) {
  return (
    <div className="workspace-heading">
      <div>
        {eyebrow && <p className="workspace-eyebrow">{eyebrow}</p>}
        <h1 ref={ref} tabIndex={-1}>
          {title}
        </h1>
      </div>
    </div>
  );
});
