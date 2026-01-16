import React, { useMemo, useState } from "react";
import { Button } from "./Button";

// PUBLIC_INTERFACE
export function NetworkForm({ initialValues, onSubmit, onCancel, submitText = "Save" }) {
  /** Form for SSID networks: name/ssid/security/vlan/enabled. */
  const defaults = useMemo(() => {
    return (
      initialValues || {
        name: "",
        ssid: "",
        security: "WPA2",
        vlan: 1,
        enabled: true
      }
    );
  }, [initialValues]);

  const [values, setValues] = useState(defaults);

  const set = (k, v) => setValues((p) => ({ ...p, [k]: v }));

  const onSave = (e) => {
    e.preventDefault();
    if (!values.ssid.trim()) return;
    onSubmit?.({
      ...values,
      vlan: Number(values.vlan || 1),
      name: values.name?.trim() || values.ssid.trim(),
      ssid: values.ssid.trim()
    });
  };

  return (
    <form onSubmit={onSave} className="op-grid" style={{ gap: 12 }}>
      <div className="op-twoCol">
        <div className="op-grid" style={{ gap: 10 }}>
          <label>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Name</div>
            <input className="op-input" value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g., Ocean-Staff" />
          </label>

          <label>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>SSID *</div>
            <input className="op-input" value={values.ssid} onChange={(e) => set("ssid", e.target.value)} placeholder="e.g., Ocean-Guest" required />
          </label>

          <label>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Security</div>
            <select className="op-input" value={values.security} onChange={(e) => set("security", e.target.value)}>
              <option value="Open">Open</option>
              <option value="WPA2">WPA2</option>
              <option value="WPA3">WPA3</option>
            </select>
          </label>
        </div>

        <div className="op-grid" style={{ gap: 10 }}>
          <label>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>VLAN</div>
            <input className="op-input" type="number" min={1} max={4094} value={values.vlan} onChange={(e) => set("vlan", e.target.value)} />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" checked={values.enabled} onChange={(e) => set("enabled", e.target.checked)} />
            <span style={{ fontSize: 13, fontWeight: 800 }}>Enabled</span>
          </label>

          <div className="op-state" style={{ marginTop: 2 }}>
            Tip: Use <span className="op-kbd">WPA3</span> for staff SSIDs; keep Guest isolated with a dedicated VLAN.
          </div>
        </div>
      </div>

      <div className="op-actionsRow" style={{ justifyContent: "flex-end" }}>
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          {submitText}
        </Button>
      </div>
    </form>
  );
}
