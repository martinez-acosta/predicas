"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  List,
  PlayCircle,
  Search,
  Tag as TagIcon,
  UserRound,
  Youtube,
} from "lucide-react";
import * as S from "./SermonLibrary.styles";
import type { SearchIndex, SermonDetail, SermonListItem, SiteIndex } from "@/types";

type ViewMode = "search" | "preachers" | "sermons";
type StatusFilter = "all" | "summarized" | "transcribed" | "pending";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return "Sin duración";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function statusLabel(status: string) {
  if (status === "summarized") return "Resumida";
  if (status === "transcribed") return "Transcrita";
  return "Pendiente";
}

function matchesStatusFilter(status: string, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "summarized") return status === "summarized";
  if (filter === "transcribed") return status === "transcribed" || status === "summarized";
  return status !== "transcribed" && status !== "summarized";
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "es"));
}

export function SermonLibrary() {
  const [siteIndex, setSiteIndex] = useState<SiteIndex | null>(null);
  const [searchIndex, setSearchIndex] = useState<SearchIndex>({ entries: [] });
  const [query, setQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedBook, setSelectedBook] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [selectedSermonId, setSelectedSermonId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<SermonDetail | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("search");
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${basePath}/data/site-index.json`).then((response) => response.json()),
      fetch(`${basePath}/data/search-index.json`).then((response) => response.json()),
    ])
      .then(([site, search]) => {
        setSiteIndex(site);
        setSearchIndex(search);
        setSelectedSermonId(site.sermons?.[0]?.id ?? null);
      })
      .catch(() => {
        setSiteIndex({
          generatedAt: new Date().toISOString(),
          stats: { sources: 0, sermons: 0, transcribed: 0, summarized: 0 },
          preachers: [],
          sermons: [],
        });
      });
  }, []);

  useEffect(() => {
    if (!selectedSermonId) {
      setSelectedDetail(null);
      return;
    }
    setDetailLoading(true);
    fetch(`${basePath}/data/sermons/${encodeURIComponent(selectedSermonId)}.json`)
      .then((response) => response.json())
      .then((detail) => setSelectedDetail(detail))
      .catch(() => setSelectedDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedSermonId]);

  const searchTextById = useMemo(() => {
    const map = new Map<string, string>();
    searchIndex.entries.forEach((entry) => map.set(entry.id, normalizeText(entry.text)));
    return map;
  }, [searchIndex.entries]);

  const bookOptions = useMemo(() => {
    return uniqueSorted(siteIndex?.sermons.flatMap((sermon) => sermon.bibleReferences) ?? []);
  }, [siteIndex]);

  const filteredSermons = useMemo(() => {
    if (!siteIndex) return [];
    const normalizedQuery = normalizeText(query.trim());
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);

    const scored = siteIndex.sermons
      .filter((sermon) => selectedSource === "all" || sermon.sourceSlug === selectedSource)
      .filter((sermon) => selectedBook === "all" || sermon.bibleReferences.includes(selectedBook))
      .filter((sermon) => matchesStatusFilter(sermon.status, selectedStatus))
      .map((sermon) => {
        const searchText = searchTextById.get(sermon.id) ?? normalizeText(JSON.stringify(sermon));
        const score = terms.length === 0 ? 1 : terms.reduce((total, term) => total + (searchText.includes(term) ? 1 : 0), 0);
        return { sermon, score };
      })
      .filter((item) => terms.length === 0 || item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.sermon.publishedAt ?? "").localeCompare(a.sermon.publishedAt ?? "");
      });

    return scored.map((item) => item.sermon);
  }, [query, searchTextById, selectedBook, selectedSource, selectedStatus, siteIndex]);

  const visibleSermons = viewMode === "preachers" ? siteIndex?.sermons ?? [] : filteredSermons;

  useEffect(() => {
    if (!visibleSermons.length) {
      setSelectedSermonId(null);
      return;
    }
    if (!selectedSermonId || !visibleSermons.some((sermon) => sermon.id === selectedSermonId)) {
      setSelectedSermonId(visibleSermons[0].id);
    }
  }, [selectedSermonId, visibleSermons]);

  if (!siteIndex) {
    return (
      <S.PageShell>
        <S.LoadingText>Cargando biblioteca...</S.LoadingText>
      </S.PageShell>
    );
  }

  return (
    <S.PageShell>
      <S.TopBar>
        <S.BrandBlock>
          <S.Eyebrow>Archivo local</S.Eyebrow>
          <S.Title>Prédicas</S.Title>
        </S.BrandBlock>
        <S.HeaderActions>
          <S.ActionButton href="https://www.youtube.com/" target="_blank" rel="noreferrer">
            <Youtube size={16} />
            YouTube
          </S.ActionButton>
        </S.HeaderActions>
      </S.TopBar>

      <S.LayoutGrid>
        <S.Sidebar>
          <S.Panel>
            <S.PanelTitle>
              <CheckCircle2 size={17} />
              Estado
            </S.PanelTitle>
            <S.StatGrid>
              <S.StatCard $accent="#407EFF" $active={selectedStatus === "all"} onClick={() => setSelectedStatus("all")}>
                <S.StatLabel>Prédicas</S.StatLabel>
                <S.StatValue>{siteIndex.stats.sermons}</S.StatValue>
              </S.StatCard>
              <S.StatCard
                $accent="#29B46E"
                $active={selectedStatus === "summarized"}
                onClick={() => {
                  setSelectedStatus("summarized");
                  setViewMode("sermons");
                }}
              >
                <S.StatLabel>Resumidas</S.StatLabel>
                <S.StatValue>{siteIndex.stats.summarized}</S.StatValue>
              </S.StatCard>
              <S.StatCard
                $accent="#67DCFF"
                $active={viewMode === "preachers"}
                onClick={() => {
                  setSelectedStatus("all");
                  setViewMode("preachers");
                }}
              >
                <S.StatLabel>Fuentes</S.StatLabel>
                <S.StatValue>{siteIndex.stats.sources}</S.StatValue>
              </S.StatCard>
              <S.StatCard
                $accent="#FFAB3D"
                $active={selectedStatus === "transcribed"}
                onClick={() => {
                  setSelectedStatus("transcribed");
                  setViewMode("sermons");
                }}
              >
                <S.StatLabel>Transcritas</S.StatLabel>
                <S.StatValue>{siteIndex.stats.transcribed}</S.StatValue>
              </S.StatCard>
            </S.StatGrid>
          </S.Panel>

          <S.Panel>
            <S.PanelTitle>
              <UserRound size={17} />
              Predicadores
            </S.PanelTitle>
            <S.SourceList>
              <S.SourceButton $active={selectedSource === "all"} onClick={() => setSelectedSource("all")}>
                <UserRound size={17} />
                <span>
                  <S.SourceName>Todos</S.SourceName>
                  <S.SourceMeta>Biblioteca completa</S.SourceMeta>
                </span>
                <S.CountPill>{siteIndex.stats.sermons}</S.CountPill>
              </S.SourceButton>
              {siteIndex.preachers.map((preacher) => (
                <S.SourceButton
                  key={preacher.slug}
                  $active={selectedSource === preacher.slug}
                  onClick={() => {
                    setSelectedSource(preacher.slug);
                    setViewMode("sermons");
                  }}
                >
                  <UserRound size={17} />
                  <span>
                    <S.SourceName>{preacher.name}</S.SourceName>
                    <S.SourceMeta>{preacher.preacher || preacher.name}</S.SourceMeta>
                  </span>
                  <S.CountPill>{preacher.sermonCount}</S.CountPill>
                </S.SourceButton>
              ))}
            </S.SourceList>
          </S.Panel>
        </S.Sidebar>

        <S.MainColumn>
          <S.SearchPanel>
            <S.SearchRow>
              <S.InputWrap>
                <Search size={18} />
                <S.SearchInput
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Jonás, ansiedad, perdón, Romanos..."
                />
              </S.InputWrap>
              <S.Select value={selectedSource} onChange={(event) => setSelectedSource(event.target.value)}>
                <option value="all">Todos los predicadores</option>
                {siteIndex.preachers.map((preacher) => (
                  <option key={preacher.slug} value={preacher.slug}>
                    {preacher.name}
                  </option>
                ))}
              </S.Select>
              <S.Select value={selectedBook} onChange={(event) => setSelectedBook(event.target.value)}>
                <option value="all">Todas las citas</option>
                {bookOptions.map((book) => (
                  <option key={book} value={book}>
                    {book}
                  </option>
                ))}
              </S.Select>
            </S.SearchRow>

            <S.TabRow>
              <S.TabButton $active={viewMode === "search"} onClick={() => setViewMode("search")}>
                <Search size={15} />
                Búsqueda
              </S.TabButton>
              <S.TabButton $active={viewMode === "preachers"} onClick={() => setViewMode("preachers")}>
                <UserRound size={15} />
                Predicadores
              </S.TabButton>
              <S.TabButton $active={viewMode === "sermons"} onClick={() => setViewMode("sermons")}>
                <List size={15} />
                Prédicas
              </S.TabButton>
            </S.TabRow>
          </S.SearchPanel>

          <S.ContentGrid>
            <S.ResultList>
              {visibleSermons.length === 0 ? (
                <S.EmptyState>No hay prédicas para los filtros seleccionados.</S.EmptyState>
              ) : (
                visibleSermons.map((sermon) => (
                  <SermonResult
                    key={sermon.id}
                    sermon={sermon}
                    active={sermon.id === selectedSermonId}
                    onSelect={() => setSelectedSermonId(sermon.id)}
                  />
                ))
              )}
            </S.ResultList>

            {detailLoading ? (
              <S.EmptyState>Cargando prédica...</S.EmptyState>
            ) : selectedDetail ? (
              <SermonDetailPanel detail={selectedDetail} />
            ) : (
              <S.EmptyState>Selecciona una prédica.</S.EmptyState>
            )}
          </S.ContentGrid>
        </S.MainColumn>
      </S.LayoutGrid>
    </S.PageShell>
  );
}

function SermonResult({
  sermon,
  active,
  onSelect,
}: {
  sermon: SermonListItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <S.ResultCard $active={active} onClick={onSelect}>
      <S.ResultHeader>
        <S.ResultTitle>{sermon.title}</S.ResultTitle>
        <S.Tag $tone="status">{statusLabel(sermon.status)}</S.Tag>
      </S.ResultHeader>
      <S.ResultMeta>
        <S.MetaItem>
          <UserRound size={13} />
          {sermon.preacher || sermon.channelName || "Sin predicador"}
        </S.MetaItem>
        <S.MetaItem>
          <Calendar size={13} />
          {formatDate(sermon.publishedAt)}
        </S.MetaItem>
        <S.MetaItem>
          <Clock size={13} />
          {formatDuration(sermon.durationSeconds)}
        </S.MetaItem>
      </S.ResultMeta>
      {sermon.summaryShort ? <S.SummaryText>{sermon.summaryShort}</S.SummaryText> : null}
      <S.TagRow>
        {sermon.topics.slice(0, 5).map((topic) => (
          <S.Tag key={topic}>{topic}</S.Tag>
        ))}
        {sermon.bibleReferences.slice(0, 3).map((reference) => (
          <S.Tag key={reference} $tone="book">
            {reference}
          </S.Tag>
        ))}
      </S.TagRow>
    </S.ResultCard>
  );
}

function SermonDetailPanel({ detail }: { detail: SermonDetail }) {
  return (
    <S.DetailPanel>
      <S.DetailHeader>
        <S.TagRow>
          <S.Tag $tone="status">{statusLabel(detail.status)}</S.Tag>
          {(detail.channelName || detail.preacher) && <S.Tag>{detail.channelName || detail.preacher}</S.Tag>}
        </S.TagRow>
        <S.DetailTitle>{detail.title}</S.DetailTitle>
        <S.ResultMeta>
          <S.MetaItem>
            <UserRound size={13} />
            {detail.preacher || detail.channelName || "Sin predicador"}
          </S.MetaItem>
          <S.MetaItem>
            <Calendar size={13} />
            {formatDate(detail.publishedAt)}
          </S.MetaItem>
          <S.MetaItem>
            <Clock size={13} />
            {formatDuration(detail.durationSeconds)}
          </S.MetaItem>
        </S.ResultMeta>
        <S.LinkRow>
          <S.SecondaryLink href={detail.youtubeUrl} target="_blank" rel="noreferrer">
            <PlayCircle size={15} />
            Abrir prédica
            <ExternalLink size={13} />
          </S.SecondaryLink>
        </S.LinkRow>
      </S.DetailHeader>

      {detail.summaryDetailed ? (
        <S.DetailSection>
          <S.DetailSectionTitle>
            <FileText size={16} />
            Resumen detallado
          </S.DetailSectionTitle>
          <S.Paragraph>{detail.summaryDetailed}</S.Paragraph>
        </S.DetailSection>
      ) : null}

      {detail.outline.length > 0 ? (
        <S.DetailSection>
          <S.DetailSectionTitle>
            <List size={16} />
            Bosquejo
          </S.DetailSectionTitle>
          <S.OutlineList>
            {detail.outline.map((item, index) => (
              <S.OutlineItem key={`${item.title}-${index}`}>
                <S.OutlineTitle>{item.title}</S.OutlineTitle>
                <S.BulletList>
                  {(item.points || []).map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </S.BulletList>
              </S.OutlineItem>
            ))}
          </S.OutlineList>
        </S.DetailSection>
      ) : null}

      {detail.topics.length > 0 || detail.bibleReferences.length > 0 ? (
        <S.DetailSection>
          <S.DetailSectionTitle>
            <TagIcon size={16} />
            Temas y citas
          </S.DetailSectionTitle>
          <S.TagRow>
            {detail.topics.map((topic) => (
              <S.Tag key={topic}>{topic}</S.Tag>
            ))}
            {detail.bibleReferences.map((reference) => (
              <S.Tag key={reference} $tone="book">
                <BookOpen size={12} />
                {reference}
              </S.Tag>
            ))}
          </S.TagRow>
        </S.DetailSection>
      ) : null}

      {detail.keyQuotes.length > 0 ? (
        <S.DetailSection>
          <S.DetailSectionTitle>
            <FileText size={16} />
            Frases clave
          </S.DetailSectionTitle>
          <S.BulletList>
            {detail.keyQuotes.map((quote) => (
              <li key={quote}>{quote}</li>
            ))}
          </S.BulletList>
        </S.DetailSection>
      ) : null}

      {detail.transcript ? (
        <S.DetailSection>
          <S.DetailSectionTitle>
            <FileText size={16} />
            Transcripción
          </S.DetailSectionTitle>
          <S.TranscriptBox>
            <S.Paragraph>{detail.transcript}</S.Paragraph>
          </S.TranscriptBox>
        </S.DetailSection>
      ) : null}
    </S.DetailPanel>
  );
}
