// Header.tsx
import React from "react";

export default function Header() {
  return (
    <header className="brand-bar">
      <a href="#" className="brand-link" aria-label="Go to home">
        {/* Penguin badge (SVG) */}
        <span className="brand-badge" aria-hidden>
          <svg viewBox="0 0 64 48" className="brand-svg">
            <rect x="1.5" y="1.5" rx="8" ry="8" width="61" height="45" className="badge-outline"/>
            {/* penguin body */}
            <ellipse cx="32" cy="26" rx="12" ry="14" className="penguin-body"/>
            {/* belly */}
            <ellipse cx="32" cy="28" rx="8" ry="10" className="penguin-belly"/>
            {/* head */}
            <circle cx="32" cy="16" r="8" className="penguin-head"/>
            {/* eyes */}
            <circle cx="29" cy="15" r="1.6" className="penguin-eye"/>
            <circle cx="35" cy="15" r="1.6" className="penguin-eye"/>
            {/* beak */}
            <path d="M30.5 18 L33.5 18 L32 20.5 Z" className="penguin-beak"/>
            {/* feet */}
            <path d="M26 38 h4 v2 h-6 z" className="penguin-feet"/>
            <path d="M34 38 h4 v2 h-6 z" className="penguin-feet"/>
          </svg>
        </span>
        <span className="brand-title">
          <em className="brand-sub">pengu</em>code
        </span>
      </a>
    </header>
  );
}
