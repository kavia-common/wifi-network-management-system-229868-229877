import React, { useMemo } from "react";

/**
 * Minimal table helpers:
 * - <TableWrap> provides the responsive scroll container.
 * - <Table> is a styled <table>.
 * - <SortableTh> provides a placeholder onSort hook.
 */

// PUBLIC_INTERFACE
function TableWrap({ children, className = "", ...rest }) {
  /** Responsive wrapper enabling horizontal scroll on narrow viewports. */
  return (
    <div className={["table-wrap", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}

// PUBLIC_INTERFACE
function Table({ children, className = "", ...rest }) {
  /** Styled table element (min-width handled by CSS). Prefer aria-label or <caption> for accessibility. */
  return (
    <table className={["table", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </table>
  );
}

// PUBLIC_INTERFACE
function SortableTh({ children, sortKey, sortState, onSort, align = "left", style, ...rest }) {
  /**
   * Table header cell that can trigger sort changes.
   * This is a "hook placeholder": it doesn't implement sorting logic itself.
   */
  const isSortable = typeof onSort === "function" && typeof sortKey === "string" && sortKey.length > 0;

  const ariaSort = useMemo(() => {
    if (!isSortable || !sortState || sortState.key !== sortKey) return "none";
    return sortState.direction === "desc" ? "descending" : "ascending";
  }, [isSortable, sortKey, sortState]);

  const indicator = useMemo(() => {
    if (!isSortable) return null;
    if (!sortState || sortState.key !== sortKey)
      return (
        <span className="sort-indicator" aria-hidden="true">
          ↕
        </span>
      );
    return sortState.direction === "desc" ? (
      <span className="sort-indicator" aria-hidden="true">
        ↓
      </span>
    ) : (
      <span className="sort-indicator" aria-hidden="true">
        ↑
      </span>
    );
  }, [isSortable, sortKey, sortState]);

  if (!isSortable) {
    return (
      <th scope="col" style={{ textAlign: align, ...style }} {...rest}>
        {children}
      </th>
    );
  }

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      style={{ textAlign: align, ...style }}
      className="th-sortable"
      {...rest}
    >
      <button type="button" className="th-sort-button" onClick={() => onSort(sortKey)}>
        <span>{children}</span>
        {indicator}
      </button>
    </th>
  );
}

export { TableWrap, Table, SortableTh };
