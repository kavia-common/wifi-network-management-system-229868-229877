import React, { useMemo, useState } from "react";
import { Button } from "./Button";

/**
 * columns: [{ key, header, render(row), sortable }]
 * rows: array
 */

// PUBLIC_INTERFACE
export function DataTable({ columns, rows, initialSort = null, filterPlaceholder = "Filter…", pageSize = 10, rowKey = (r) => r.id }) {
  /** Generic table with client-side sort/filter/pagination. */
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, query]);

  const sorted = useMemo(() => {
    if (!sort?.key) return filtered;
    const dir = sort.dir === "desc" ? -1 : 1;
    const key = sort.key;
    return [...filtered].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return -1 * dir;
      if (bv == null) return 1 * dir;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  const onToggleSort = (col) => {
    if (!col.sortable) return;
    setPage(1);
    setSort((prev) => {
      if (!prev || prev.key !== col.key) return { key: col.key, dir: "asc" };
      return { key: col.key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  };

  return (
    <div>
      <div className="op-tableControls">
        <div style={{ flex: 1, minWidth: 220 }}>
          <input className="op-input" value={query} placeholder={filterPlaceholder} onChange={(e) => (setPage(1), setQuery(e.target.value))} />
        </div>
        <div className="op-pagination">
          <span style={{ color: "var(--op-muted)", fontSize: 12 }}>
            {sorted.length} items • page {safePage}/{totalPages}
          </span>
          <Button size="sm" variant="ghost" onClick={() => setPage(1)} disabled={safePage === 1}>
            First
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
            Prev
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
            Next
          </Button>
        </div>
      </div>

      <div className="op-tableWrap" role="region" aria-label="Data table">
        <table className="op-table">
          <thead>
            <tr>
              {columns.map((c) => {
                const isSorted = sort?.key === c.key;
                const sortGlyph = !c.sortable ? "" : isSorted ? (sort.dir === "asc" ? " ▲" : " ▼") : " ↕";
                return (
                  <th key={c.key}>
                    <button
                      className="op-btn sm ghost"
                      onClick={() => onToggleSort(c)}
                      disabled={!c.sortable}
                      aria-label={c.sortable ? `Sort by ${c.header}` : c.header}
                      style={{ padding: "6px 8px" }}
                    >
                      {c.header}
                      <span style={{ color: "var(--op-muted)" }}>{sortGlyph}</span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={rowKey(r)}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(r) : String(r[c.key] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
