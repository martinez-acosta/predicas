export const theme = {
  // Acento único, sobrio
  accent: "#2563EB",
  accentSoft: "#EFF4FF",
  accentBorder: "#D6E2FF",

  // Superficies
  background: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceMuted: "#F6F7F9",

  // Texto
  text: "#18181B",
  textSecondary: "#52525B",
  textMuted: "#8A8F98",

  // Líneas
  border: "#ECECEF",
  borderStrong: "#E0E0E4",

  // Estados (tenues)
  success: "#0F9D58",
  successSoft: "#ECF7F0",
  successBorder: "#CDEBD9",
  warning: "#B7791F",
  warningSoft: "#FBF4E6",
  warningBorder: "#F0E3C4",
  danger: "#DC2626",

  // Estados de prédica
  statusSummarized: "#0F9D58",
  statusSummarizedSoft: "#ECF7F0",
  statusTranscribed: "#2563EB",
  statusTranscribedSoft: "#EFF4FF",
  statusPending: "#8A8F98",
  statusPendingSoft: "#F2F3F5",

  // Radios
  radiusSm: "8px",
  radiusMd: "12px",
  radiusLg: "16px",
  radiusFull: "999px",

  // Sombras suaves
  shadowSm: "0 1px 2px rgba(16, 24, 40, 0.04)",
  shadowMd: "0 4px 16px rgba(16, 24, 40, 0.06)",
  shadowLg: "0 12px 32px rgba(16, 24, 40, 0.10)",

  // Transiciones
  transitionFast: "0.15s ease",
  transitionMed: "0.22s cubic-bezier(0.4, 0, 0.2, 1)",

  // Compat (referencias antiguas)
  secondaryColor: "#2563EB",
  primaryColor: "#2563EB",
  backgroundColor: "#FAFAFA",
  surfaceColor: "#FFFFFF",
  textColor: "#18181B",
  lineColor: "#ECECEF",
  softBlue: "#EFF4FF",
  ink: "#18181B",
} as const;
