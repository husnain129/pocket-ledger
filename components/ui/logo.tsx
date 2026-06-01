import Svg, { Circle, Path, Rect } from "react-native-svg";

type Props = {
  size?: number;
};

export function PocketLedgerLogo({ size = 64 }: Props) {
  return (
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      {/* Background */}
      <Rect x="0" y="0" width="100" height="100" rx="22" fill="#0f766e" />

      {/* Wallet body */}
      <Rect
        x="18"
        y="30"
        width="64"
        height="44"
        rx="9"
        fill="rgba(255,255,255,0.10)"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="2.5"
      />

      {/* Wallet top flap */}
      <Rect
        x="18"
        y="30"
        width="64"
        height="15"
        rx="9"
        fill="rgba(255,255,255,0.20)"
      />

      {/* Bar 1 — short */}
      <Rect x="26" y="62" width="11" height="10" rx="2.5" fill="#34d399" />
      {/* Bar 2 — medium */}
      <Rect x="44" y="54" width="11" height="18" rx="2.5" fill="#34d399" />
      {/* Bar 3 — tall */}
      <Rect x="62" y="46" width="11" height="26" rx="2.5" fill="#34d399" />

      {/* Upward trend line */}
      <Path
        d="M31.5 62 L49.5 54 L67.5 46"
        stroke="#fbbf24"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Trend dot */}
      <Circle cx="67.5" cy="46" r="4" fill="#fbbf24" />
    </Svg>
  );
}
