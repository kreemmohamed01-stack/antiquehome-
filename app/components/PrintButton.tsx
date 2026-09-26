"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      className="oc-btn oc-btn--dark"
      onClick={() => window.print()}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 8.4V3.6h10v4.8"></path>
        <rect x="3.6" y="8.4" width="16.8" height="9.2" rx="1.6"></rect>
        <rect x="7" y="13.2" width="10" height="7.2"></rect>
      </svg>
      <span>Print Receipt</span>
    </button>
  );
}
