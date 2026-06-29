import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";

const panelSurface = css`
  background: ${theme.surface};
  border: 1px solid ${theme.border};
  border-radius: ${theme.radiusMd};
`;

const focusRing = css`
  &:focus-visible {
    outline: 0;
    border-color: ${theme.accent};
    box-shadow: 0 0 0 3px ${theme.accentSoft};
  }
`;

export const PageShell = styled.main`
  min-height: 100vh;
  padding: 28px;
  background: ${theme.background};

  @media (max-width: 760px) {
    padding: 16px;
  }
`;

export const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 1320px;
  margin: 0 auto 24px;

  @media (max-width: 760px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }
`;

export const BrandBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const Eyebrow = styled.span`
  color: ${theme.textMuted};
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
`;

export const Title = styled.h1`
  margin: 0;
  color: ${theme.text};
  font-size: 28px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.03em;

  @media (max-width: 560px) {
    font-size: 24px;
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

export const ActionButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 16px;
  border-radius: ${theme.radiusSm};
  color: ${theme.text};
  background: ${theme.surface};
  border: 1px solid ${theme.borderStrong};
  font-size: 14px;
  font-weight: 500;
  box-shadow: ${theme.shadowSm};
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;

  svg {
    color: ${theme.textMuted};
  }

  &:hover {
    background: ${theme.surfaceMuted};
    border-color: ${theme.textMuted};
  }
  &:active {
    transform: translateY(1px);
  }
`;

export const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: 272px minmax(0, 1fr);
  gap: 20px;
  max-width: 1320px;
  margin: 0 auto;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

export const Sidebar = styled.aside<{ $open?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (min-width: 1081px) {
    position: sticky;
    top: 28px;
    align-self: start;
  }

  @media (max-width: 760px) {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 50;
    width: min(330px, 86vw);
    padding: 16px;
    overflow-y: auto;
    background: ${theme.background};
    border-right: 1px solid ${theme.border};
    box-shadow: ${theme.shadowLg};
    transform: translateX(${({ $open }) => ($open ? "0" : "-105%")});
    transition: transform ${theme.transitionMed};
  }
`;

export const Backdrop = styled.div<{ $open?: boolean }>`
  display: none;

  @media (max-width: 760px) {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 45;
    background: rgba(16, 24, 40, 0.4);
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    pointer-events: ${({ $open }) => ($open ? "auto" : "none")};
    transition: opacity ${theme.transitionMed};
  }
`;

export const DrawerHeader = styled.div`
  display: none;

  @media (max-width: 760px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }
`;

export const DrawerTitle = styled.span`
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: ${theme.text};
`;

export const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: ${theme.radiusSm};
  border: 1px solid ${theme.border};
  background: ${theme.surface};
  color: ${theme.textSecondary};
  transition: background ${theme.transitionFast}, border-color ${theme.transitionFast};

  &:hover {
    background: ${theme.surfaceMuted};
    border-color: ${theme.borderStrong};
  }

  ${focusRing}
`;

export const MobileFilterButton = styled.button`
  display: none;

  @media (max-width: 760px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 40px;
    padding: 0 16px;
    border-radius: ${theme.radiusSm};
    color: ${theme.text};
    background: ${theme.surface};
    border: 1px solid ${theme.borderStrong};
    font-size: 14px;
    font-weight: 500;
    box-shadow: ${theme.shadowSm};

    svg {
      color: ${theme.textMuted};
    }
  }
`;

export const BackButton = styled.button`
  display: none;

  @media (max-width: 760px) {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    padding: 8px 12px 8px 8px;
    border: 1px solid ${theme.border};
    border-radius: ${theme.radiusSm};
    background: ${theme.surface};
    color: ${theme.textSecondary};
    font-size: 13px;
    font-weight: 500;

    svg {
      width: 16px;
      height: 16px;
    }

    &:active {
      background: ${theme.surfaceMuted};
    }
  }
`;

export const Panel = styled.section`
  ${panelSurface}
  padding: 18px;
`;

export const PanelTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  color: ${theme.textMuted};
  font-size: 12px;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`;

export const StatCard = styled.button<{ $accent?: string; $active?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 14px;
  border: 1px solid ${({ $active }) => ($active ? theme.accentBorder : theme.border)};
  border-radius: ${theme.radiusSm};
  background: ${({ $active }) => ($active ? theme.accentSoft : theme.surface)};
  color: ${theme.text};
  text-align: left;
  transition: background ${theme.transitionFast}, border-color ${theme.transitionFast},
    transform ${theme.transitionMed}, box-shadow ${theme.transitionMed};

  &:hover {
    border-color: ${({ $active }) => ($active ? theme.accentBorder : theme.borderStrong)};
    background: ${({ $active }) => ($active ? theme.accentSoft : theme.surfaceMuted)};
    transform: translateY(-1px);
    box-shadow: ${theme.shadowSm};
  }

  &:active {
    transform: translateY(0);
  }

  ${focusRing}
`;

export const StatLabel = styled.span<{ $dot?: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${theme.textSecondary};
  font-size: 12px;
  font-weight: 500;

  &::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: ${({ $dot }) => $dot || theme.accent};
  }
`;

export const StatValue = styled.strong`
  display: block;
  color: ${theme.text};
  font-size: 26px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
`;

export const SourceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const SourceButton = styled.button<{ $active?: boolean; $nested?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $nested }) => ($nested ? "22px minmax(0, 1fr) auto" : "28px minmax(0, 1fr) auto")};
  align-items: center;
  gap: ${({ $nested }) => ($nested ? "8px" : "10px")};
  width: 100%;
  padding: ${({ $nested }) => ($nested ? "8px 10px 8px 28px" : "9px 10px")};
  border: 1px solid transparent;
  border-radius: ${theme.radiusSm};
  color: ${theme.text};
  background: ${({ $active }) => ($active ? theme.accentSoft : "transparent")};
  text-align: left;
  transition: background 0.15s ease;

  svg {
    color: ${({ $active }) => ($active ? theme.accent : theme.textMuted)};
  }

  &:hover {
    background: ${({ $active }) => ($active ? theme.accentSoft : theme.surfaceMuted)};
  }

  ${focusRing}
`;

export const SourceName = styled.span`
  display: block;
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const SourceMeta = styled.span`
  display: block;
  overflow: hidden;
  color: ${theme.textMuted};
  font-size: 12px;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CountPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  color: ${theme.textSecondary};
  background: ${theme.surfaceMuted};
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
`;

export const MainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
`;

export const SearchPanel = styled.section`
  ${panelSurface}
  padding: 16px;
`;

export const SearchRow = styled.div`
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 200px 200px;
  gap: 10px;

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

export const InputWrap = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid ${theme.borderStrong};
  border-radius: ${theme.radiusSm};
  background: ${theme.surface};
  color: ${theme.textMuted};
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus-within {
    border-color: ${theme.accent};
    box-shadow: 0 0 0 3px ${theme.accentSoft};
    color: ${theme.accent};
  }
`;

export const SearchInput = styled.input`
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  color: ${theme.text};
  background: transparent;
  font-size: 14px;
  font-weight: 400;

  &::placeholder {
    color: ${theme.textMuted};
  }
`;

export const Select = styled.select`
  width: 100%;
  min-height: 44px;
  padding: 0 34px 0 12px;
  border: 1px solid ${theme.borderStrong};
  border-radius: ${theme.radiusSm};
  color: ${theme.text};
  background: ${theme.surface}
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238A8F98' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")
    no-repeat right 12px center;
  font-size: 14px;
  font-weight: 500;
  outline: 0;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: ${theme.textMuted};
  }
  &:focus {
    border-color: ${theme.accent};
    box-shadow: 0 0 0 3px ${theme.accentSoft};
  }
`;

export const TabRow = styled.div`
  display: inline-flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding: 4px;
  background: ${theme.surfaceMuted};
  border-radius: ${theme.radiusSm};

  @media (max-width: 560px) {
    display: flex;
    width: 100%;
  }
`;

export const TabButton = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 14px;

  @media (max-width: 560px) {
    flex: 1;
    min-height: 40px;
    padding: 0 8px;
  }
  border: 0;
  border-radius: 6px;
  color: ${({ $active }) => ($active ? theme.text : theme.textSecondary)};
  background: ${({ $active }) => ($active ? theme.surface : "transparent")};
  box-shadow: ${({ $active }) => ($active ? theme.shadowSm : "none")};
  font-size: 13px;
  font-weight: 500;
  transition: color 0.15s ease, background 0.15s ease;

  svg {
    width: 15px;
    height: 15px;
  }

  &:hover {
    color: ${theme.text};
  }
`;

export const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(340px, 0.82fr) minmax(0, 1.18fr);
  gap: 16px;
  align-items: start;

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

export const ResultList = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const ResultCard = styled.button<{ $active?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  padding: 16px 16px 16px 18px;
  border: 1px solid ${({ $active }) => ($active ? theme.accentBorder : theme.border)};
  border-radius: ${theme.radiusMd};
  background: ${({ $active }) => ($active ? theme.accentSoft : theme.surface)};
  color: ${theme.text};
  text-align: left;
  overflow: hidden;
  transition: border-color ${theme.transitionFast}, background ${theme.transitionFast},
    box-shadow ${theme.transitionMed}, transform ${theme.transitionMed};

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 3px;
    background: ${theme.accent};
    opacity: ${({ $active }) => ($active ? 1 : 0)};
    transform: scaleY(${({ $active }) => ($active ? 1 : 0.4)});
    transition: opacity ${theme.transitionMed}, transform ${theme.transitionMed};
  }

  &:hover {
    border-color: ${({ $active }) => ($active ? theme.accentBorder : theme.borderStrong)};
    box-shadow: ${theme.shadowMd};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  ${focusRing}
`;

export const ResultHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const ResultTitle = styled.h3`
  margin: 0;
  color: ${theme.text};
  font-size: 15px;
  line-height: 1.4;
  font-weight: 600;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const ResultMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  color: ${theme.textMuted};
  font-size: 12px;
  font-weight: 400;
`;

export const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;

  svg {
    width: 13px;
    height: 13px;
  }
`;

export const SummaryText = styled.p`
  margin: 0;
  color: ${theme.textSecondary};
  font-size: 13.5px;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const Tag = styled.span<{ $tone?: "topic" | "book" }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 23px;
  padding: 0 9px;
  border-radius: 6px;
  border: 1px solid ${({ $tone }) => ($tone === "book" ? theme.successBorder : theme.border)};
  color: ${({ $tone }) => ($tone === "book" ? theme.success : theme.textSecondary)};
  background: ${({ $tone }) => ($tone === "book" ? theme.successSoft : theme.surfaceMuted)};
  font-size: 12px;
  font-weight: 500;
  transition: background ${theme.transitionFast}, border-color ${theme.transitionFast};

  svg {
    width: 12px;
    height: 12px;
  }
`;

const statusColors = {
  summarized: { fg: theme.statusSummarized, bg: theme.statusSummarizedSoft },
  transcribed: { fg: theme.statusTranscribed, bg: theme.statusTranscribedSoft },
  pending: { fg: theme.statusPending, bg: theme.statusPendingSoft },
} as const;

export const StatusBadge = styled.span<{ $status?: keyof typeof statusColors }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 23px;
  padding: 0 10px;
  border-radius: ${theme.radiusFull};
  white-space: nowrap;
  color: ${({ $status }) => statusColors[$status ?? "pending"].fg};
  background: ${({ $status }) => statusColors[$status ?? "pending"].bg};
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.01em;

  &::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: ${theme.radiusFull};
    background: currentColor;
  }
`;

export const DetailPanel = styled.section`
  ${panelSurface}
  position: sticky;
  top: 28px;
  max-height: calc(100vh - 56px);
  overflow: auto;
  padding: 24px;

  @media (max-width: 1180px) {
    position: static;
    max-height: none;
  }
`;

export const DetailHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 20px;
  margin-bottom: 4px;
  border-bottom: 1px solid ${theme.border};
`;

export const DetailTitle = styled.h2`
  margin: 0;
  color: ${theme.text};
  font-size: 24px;
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

export const LinkRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
`;

export const SecondaryLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border: 0;
  border-radius: ${theme.radiusSm};
  color: #FFFFFF;
  background: ${theme.accent};
  font-size: 13px;
  font-weight: 500;
  transition: opacity 0.15s ease, transform 0.15s ease;

  svg {
    width: 15px;
    height: 15px;
  }

  &:hover {
    opacity: 0.9;
  }
  &:active {
    transform: translateY(1px);
  }
`;

export const DetailSection = styled.div`
  padding: 20px 0;
  border-bottom: 1px solid ${theme.border};

  &:last-child {
    border-bottom: 0;
    padding-bottom: 4px;
  }
`;

export const DetailSectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  color: ${theme.textMuted};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const Paragraph = styled.p`
  margin: 0;
  color: ${theme.textSecondary};
  font-size: 14.5px;
  line-height: 1.7;
  white-space: pre-wrap;
`;

export const OutlineList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const OutlineItem = styled.div`
  padding: 14px 16px;
  border: 1px solid ${theme.border};
  border-radius: ${theme.radiusSm};
  background: ${theme.surfaceMuted};
`;

export const OutlineTitle = styled.h4`
  margin: 0 0 8px;
  color: ${theme.text};
  font-size: 14px;
  font-weight: 600;
`;

export const BulletList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin: 0;
  padding-left: 18px;
  color: ${theme.textSecondary};
  font-size: 14px;
  line-height: 1.55;

  li::marker {
    color: ${theme.textMuted};
  }
`;

export const TranscriptBox = styled.div`
  max-height: 360px;
  overflow: auto;
  padding: 16px;
  border: 1px solid ${theme.border};
  border-radius: ${theme.radiusSm};
  background: ${theme.surfaceMuted};
`;

export const EmptyState = styled.div`
  ${panelSurface}
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  padding: 32px;
  color: ${theme.textMuted};
  text-align: center;
  font-size: 14px;
  font-weight: 400;
`;

export const LoadingText = styled.div`
  padding: 40px 18px;
  color: ${theme.textMuted};
  font-size: 14px;
  font-weight: 400;
  text-align: center;
`;
