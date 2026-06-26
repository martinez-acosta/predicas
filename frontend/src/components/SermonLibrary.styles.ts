import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";

const panelSurface = css`
  background: ${theme.surfaceColor};
  border: 1px solid #E8EEF9;
  box-shadow: 0 8px 30px rgba(64, 126, 255, 0.08);
`;

export const PageShell = styled.main`
  min-height: 100vh;
  padding: 22px;
  background:
    linear-gradient(180deg, rgba(103, 220, 255, 0.12), rgba(247, 250, 255, 0) 360px),
    ${theme.backgroundColor};

  @media (max-width: 760px) {
    padding: 14px;
  }
`;

export const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 1420px;
  margin: 0 auto 18px;

  @media (max-width: 760px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

export const BrandBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Eyebrow = styled.span`
  width: fit-content;
  padding: 6px 12px;
  border: 1px solid #D9E6FF;
  border-radius: 999px;
  color: ${theme.secondaryColor};
  background: #FFFFFF;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

export const Title = styled.h1`
  margin: 0;
  color: ${theme.secondaryColor};
  font-size: 34px;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;

  @media (max-width: 560px) {
    font-size: 26px;
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
  min-height: 42px;
  padding: 0 16px;
  border-radius: 6px;
  color: #FFFFFF;
  background: ${theme.secondaryColor};
  font-size: 13px;
  font-weight: 800;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(64, 126, 255, 0.18);
    opacity: 0.92;
  }
`;

export const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 16px;
  max-width: 1420px;
  margin: 0 auto;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

export const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const Panel = styled.section`
  ${panelSurface}
  border-radius: 8px;
  padding: 18px;
`;

export const PanelTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  color: ${theme.ink};
  font-size: 15px;
  line-height: 1.2;
  font-weight: 800;
`;

export const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

export const StatCard = styled.button<{ $accent?: string; $active?: boolean }>`
  position: relative;
  overflow: hidden;
  display: block;
  width: 100%;
  min-height: 84px;
  padding: 14px 14px 12px 18px;
  border: 1px solid ${({ $active }) => ($active ? "#B9DAFF" : "#EEF2FA")};
  border-radius: 6px;
  background: ${({ $active }) => ($active ? theme.softBlue : "#FFFFFF")};
  color: ${theme.textColor};
  text-align: left;
  cursor: pointer;

  &::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
    background: ${({ $accent }) => $accent ?? theme.secondaryColor};
  }

  &:focus-visible {
    outline: 0;
    border-color: ${theme.secondaryColor};
    box-shadow: 0 0 0 3px rgba(64, 126, 255, 0.12);
  }
`;

export const StatLabel = styled.span`
  display: block;
  color: ${theme.textMuted};
  font-size: 11px;
  font-weight: 700;
`;

export const StatValue = styled.strong`
  display: block;
  margin-top: 8px;
  color: ${theme.ink};
  font-size: 24px;
  line-height: 1;
  font-weight: 800;
`;

export const SourceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const SourceButton = styled.button<{ $active?: boolean }>`
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  border: 1px solid ${({ $active }) => ($active ? "#B9DAFF" : "#E8EEF9")};
  border-radius: 6px;
  color: ${theme.textColor};
  background: ${({ $active }) => ($active ? theme.softBlue : "#FFFFFF")};
  text-align: left;

  svg {
    color: ${theme.secondaryColor};
  }
`;

export const SourceName = styled.span`
  overflow: hidden;
  font-size: 13px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const SourceMeta = styled.span`
  color: ${theme.textMuted};
  font-size: 11px;
  font-weight: 700;
`;

export const CountPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  color: ${theme.secondaryColor};
  background: #FFFFFF;
  border: 1px solid #D9E6FF;
  font-size: 11px;
  font-weight: 800;
`;

export const MainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
`;

export const SearchPanel = styled.section`
  ${panelSurface}
  border-radius: 8px;
  padding: 16px;
`;

export const SearchRow = styled.div`
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 190px 190px;
  gap: 10px;

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

export const InputWrap = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  padding: 0 14px;
  border: 1px solid ${theme.lineColor};
  border-radius: 6px;
  background: #FFFFFF;
  color: ${theme.textMuted};

  &:focus-within {
    border-color: ${theme.secondaryColor};
    box-shadow: 0 0 0 3px rgba(64, 126, 255, 0.12);
  }
`;

export const SearchInput = styled.input`
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  color: ${theme.textColor};
  background: transparent;
  font-size: 14px;
  font-weight: 600;

  &::placeholder {
    color: #8B98AD;
  }
`;

export const Select = styled.select`
  width: 100%;
  min-height: 46px;
  padding: 0 12px;
  border: 1px solid ${theme.lineColor};
  border-radius: 6px;
  color: ${theme.textColor};
  background: #FFFFFF;
  font-size: 13px;
  font-weight: 700;
  outline: 0;

  &:focus {
    border-color: ${theme.secondaryColor};
    box-shadow: 0 0 0 3px rgba(64, 126, 255, 0.12);
  }
`;

export const TabRow = styled.div`
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 14px;
`;

export const TabButton = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 13px;
  border: 1px solid ${({ $active }) => ($active ? "#B9DAFF" : "#E8EEF9")};
  border-radius: 999px;
  color: ${({ $active }) => ($active ? theme.secondaryColor : theme.textMuted)};
  background: ${({ $active }) => ($active ? theme.softBlue : "#FFFFFF")};
  font-size: 12px;
  font-weight: 800;
`;

export const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(360px, 0.86fr) minmax(0, 1.14fr);
  gap: 16px;
  align-items: start;

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

export const ResultList = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const ResultCard = styled.button<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  padding: 14px;
  border: 1px solid ${({ $active }) => ($active ? "#B9DAFF" : "#E8EEF9")};
  border-radius: 8px;
  background: ${({ $active }) => ($active ? theme.softBlue : "#FFFFFF")};
  box-shadow: ${({ $active }) => ($active ? "0 8px 24px rgba(64, 126, 255, 0.12)" : "0 4px 14px rgba(64, 126, 255, 0.05)")};
  color: ${theme.textColor};
  text-align: left;
`;

export const ResultHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const ResultTitle = styled.h3`
  margin: 0;
  color: ${theme.ink};
  font-size: 15px;
  line-height: 1.35;
  font-weight: 800;
`;

export const ResultMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  color: ${theme.textMuted};
  font-size: 11px;
  font-weight: 700;
`;

export const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
`;

export const SummaryText = styled.p`
  margin: 0;
  color: ${theme.textMuted};
  font-size: 13px;
  line-height: 1.5;
`;

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const Tag = styled.span<{ $tone?: "topic" | "book" | "status" }>`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === "book" ? "#DDF1E7" : $tone === "status" ? "#FFE4BE" : "#D9E6FF"};
  color: ${({ $tone }) =>
    $tone === "book" ? theme.success : $tone === "status" ? "#9A6118" : theme.secondaryColor};
  background: ${({ $tone }) =>
    $tone === "book" ? "#F0FFF7" : $tone === "status" ? "#FFF7EA" : "#FFFFFF"};
  font-size: 11px;
  font-weight: 800;
`;

export const DetailPanel = styled.section`
  ${panelSurface}
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 32px);
  overflow: auto;
  border-radius: 8px;
  padding: 18px;

  @media (max-width: 1180px) {
    position: static;
    max-height: none;
  }
`;

export const DetailHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
`;

export const DetailTitle = styled.h2`
  margin: 0;
  color: ${theme.ink};
  font-size: 22px;
  line-height: 1.25;
  font-weight: 800;
`;

export const LinkRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const SecondaryLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid #D9E6FF;
  border-radius: 6px;
  color: ${theme.secondaryColor};
  background: #FFFFFF;
  font-size: 12px;
  font-weight: 800;
`;

export const DetailSection = styled.div`
  padding: 16px 0;
  border-top: 1px solid #EEF2FA;
`;

export const DetailSectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  color: ${theme.ink};
  font-size: 14px;
  font-weight: 800;
`;

export const Paragraph = styled.p`
  margin: 0;
  color: ${theme.textColor};
  font-size: 14px;
  line-height: 1.65;
  white-space: pre-wrap;
`;

export const OutlineList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const OutlineItem = styled.div`
  padding: 12px;
  border: 1px solid #EEF2FA;
  border-radius: 6px;
  background: #FBFDFF;
`;

export const OutlineTitle = styled.h4`
  margin: 0 0 8px;
  color: ${theme.secondaryColor};
  font-size: 13px;
  font-weight: 800;
`;

export const BulletList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding-left: 18px;
  color: ${theme.textMuted};
  font-size: 13px;
  line-height: 1.45;
`;

export const TranscriptBox = styled.div`
  max-height: 360px;
  overflow: auto;
  padding: 14px;
  border: 1px solid #EEF2FA;
  border-radius: 6px;
  background: #FBFDFF;
`;

export const EmptyState = styled.div`
  ${panelSurface}
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  border-radius: 8px;
  padding: 28px;
  color: ${theme.textMuted};
  text-align: center;
  font-size: 14px;
  font-weight: 700;
`;

export const LoadingText = styled.div`
  padding: 18px;
  color: ${theme.textMuted};
  font-size: 13px;
  font-weight: 700;
`;
