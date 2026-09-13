"use client";

import styles from "./LoggedOutExperience.module.css";

// Placeholder signature stroke. Once Staw provides a real signature asset
// (SVG or PNG), swap the <path> below for an <img> of the real asset and
// drop the stroke-draw animation, or keep a similar reveal if the asset
// is itself an SVG path.
export default function FounderSignature() {
  return (
    <svg
      className={styles.signature}
      viewBox="0 0 220 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 50 C 20 15, 34 15, 40 40 C 46 60, 54 30, 62 30 C 70 30, 66 55, 78 50 C 92 44, 96 20, 108 20 C 122 20, 118 55, 132 50 C 146 45, 150 22, 160 25 C 170 28, 168 48, 180 45 C 192 42, 196 25, 210 30"
        stroke="#1B34E8"
        strokeWidth="3"
        strokeLinecap="round"
        className={styles.signaturePath}
      />
    </svg>
  );
}
