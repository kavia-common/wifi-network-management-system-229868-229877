import React, { useMemo } from "react";
import Button from "./Button";

/**
 * Small error banner suitable for inline page errors.
 * Intended to be non-blocking: user can keep navigating/working.
 */

// PUBLIC_INTERFACE
function ErrorBanner({ title = "Something went wrong", message, onRetry, className = "" }) {
  /** Renders an error banner with optional retry action. */
  const titleId = useMemo(() => `error-title-${Math.random().toString(36).slice(2)}`, []);
  const messageId = useMemo(() => `error-message-${Math.random().toString(36).slice(2)}`, []);

  return (
    <div
      className={["error-banner", className].filter(Boolean).join(" ")}
      role="alert"
      aria-labelledby={titleId}
      aria-describedby={message ? messageId : undefined}
    >
      <div className="error-banner-title" id={titleId}>
        {title}
      </div>
      {message ? (
        <div className="error-banner-message" id={messageId}>
          {message}
        </div>
      ) : null}
      {onRetry ? (
        <div className="error-banner-actions">
          <Button variant="ghost" onClick={onRetry} aria-label="Retry loading">
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default ErrorBanner;
