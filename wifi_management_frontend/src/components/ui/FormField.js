import React, { useId } from "react";

/**
 * Field wrapper that standardizes label/help/error patterns.
 */

// PUBLIC_INTERFACE
function FormField({
  label,
  help,
  error,
  children,
  id: idProp,
  className = "",
}) {
  /** Wraps an input control with label, help text, and error message. */
  const reactId = useId();
  const id = idProp || `field-${reactId}`;
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  // We clone the child control to supply id/aria props without additional libs.
  const control =
    React.isValidElement(children)
      ? React.cloneElement(children, {
          id: children.props.id || id,
          "aria-invalid": error ? "true" : children.props["aria-invalid"],
          "aria-describedby": [children.props["aria-describedby"], helpId, errorId]
            .filter(Boolean)
            .join(" ") || undefined,
        })
      : children;

  return (
    <div className={["field", className].filter(Boolean).join(" ")}>
      {label ? (
        <label className="label" htmlFor={id}>
          {label}
        </label>
      ) : null}

      {control}

      {help ? (
        <div className="help-text" id={helpId}>
          {help}
        </div>
      ) : null}

      {error ? (
        <div className="field-error" id={errorId} role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}

export default FormField;
