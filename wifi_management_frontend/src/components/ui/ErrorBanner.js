import React from "react";
import Button from "./Button";

/**
 * Small error banner suitable for inline page errors.
 */

// PUBLIC_INTERFACE
function ErrorBanner({ title = "Something went wrong", message, onRetry, className = "" }) {
  /** Renders an error banner with optional retry action. */
  return (
    <div className={["error-banner", className].filter(Boolean).join(" ")} role="alert">
      <div className="error-banner-title">{title}</div>
      {message ? <div className="error-banner-message">{message}</div> : null}
      {onRetry ? (
        <div className="error-banner-actions">
          <Button variant="ghost" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default ErrorBanner;
