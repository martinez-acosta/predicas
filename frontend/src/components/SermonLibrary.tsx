"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  List,
  Mic,
  PlayCircle,
  Search,
  SlidersHorizontal,
  Tag as TagIcon,
  UserRound,
  X,
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

function statusKey(status: string): "summarized" | "transcribed" | "pending" {
  if (status === "summarized") return "summarized";
  if (status === "transcribed") return "transcribed";
  return "pending";
}

function useIsMobile(breakpoint = 760) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [breakpoint]);
  return isMobile;
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

function slugifyFilter(value?: string | null) {
  return normalizeText(value ?? "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sourceFilterKey(sourceSlug: string) {
  return `source:${sourceSlug}`;
}

function preacherFilterKey(sourceSlug: string, preacher?: string | null) {
  return `preacher:${sourceSlug}:${slugifyFilter(preacher) || "varios"}`;
}

function matchesLibraryFilter(sermon: SermonListItem, selectedSource: string) {
  if (selectedSource === "all") return true;
  if (selectedSource.startsWith("source:")) {
    return sermon.sourceSlug === selectedSource.replace("source:", "");
  }
  if (selectedSource.startsWith("preacher:")) {
    return preacherFilterKey(sermon.sourceSlug, sermon.preacher) === selectedSource;
  }
  return sermon.sourceSlug === selectedSource;
}

function matchesSearchTerms(sermon: SermonListItem, searchTextById: Map<string, string>, terms: string[]) {
  if (terms.length === 0) return true;
  const searchText = searchTextById.get(sermon.id) ?? normalizeText(JSON.stringify(sermon));
  return terms.some((term) => searchText.includes(term));
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [preacherFilter, setPreacherFilter] = useState("");
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  const resetLibraryFilters = () => {
    setQuery("");
    setSelectedSource("all");
    setSelectedBook("all");
    setSelectedStatus("all");
    setViewMode("sermons");
  };

  const toggleSource = (slug: string) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  useEffect(() => {
    if (!isMobile) {
      setFiltersOpen(false);
      setMobileView("list");
    }
  }, [isMobile]);

  useEffect(() => {
    if (filtersOpen && isMobile) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [filtersOpen, isMobile]);

  const selectSermon = (id: string) => {
    setSelectedSermonId(id);
    if (isMobile) setMobileView("detail");
  };

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

  const normalizedQuery = normalizeText(query.trim());
  const queryTerms = useMemo(() => normalizedQuery.split(/\s+/).filter(Boolean), [normalizedQuery]);

  const filteredSermons = useMemo(() => {
    if (!siteIndex) return [];

    const scored = siteIndex.sermons
      .filter((sermon) => matchesLibraryFilter(sermon, selectedSource))
      .filter((sermon) => selectedBook === "all" || sermon.bibleReferences.includes(selectedBook))
      .filter((sermon) => matchesStatusFilter(sermon.status, selectedStatus))
      .map((sermon) => {
        const searchText = searchTextById.get(sermon.id) ?? normalizeText(JSON.stringify(sermon));
        const score =
          queryTerms.length === 0 ? 1 : queryTerms.reduce((total, term) => total + (searchText.includes(term) ? 1 : 0), 0);
        return { sermon, score };
      })
      .filter((item) => queryTerms.length === 0 || item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.sermon.publishedAt ?? "").localeCompare(a.sermon.publishedAt ?? "");
      });

    return scored.map((item) => item.sermon);
  }, [queryTerms, searchTextById, selectedBook, selectedSource, selectedStatus, siteIndex]);

  const menuCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (!siteIndex) return counts;

    const menuScopedSermons = siteIndex.sermons
      .filter((sermon) => selectedBook === "all" || sermon.bibleReferences.includes(selectedBook))
      .filter((sermon) => matchesStatusFilter(sermon.status, selectedStatus))
      .filter((sermon) => matchesSearchTerms(sermon, searchTextById, queryTerms));

    counts.set("all", menuScopedSermons.length);
    menuScopedSermons.forEach((sermon) => {
      const sourceKey = sourceFilterKey(sermon.sourceSlug);
      const speakerKey = preacherFilterKey(sermon.sourceSlug, sermon.preacher);
      counts.set(sourceKey, (counts.get(sourceKey) ?? 0) + 1);
      counts.set(speakerKey, (counts.get(speakerKey) ?? 0) + 1);
    });

    return counts;
  }, [queryTerms, searchTextById, selectedBook, selectedStatus, siteIndex]);

  const normalizedPreacherFilter = normalizeText(preacherFilter.trim());
  const isFilteringPreachers = normalizedPreacherFilter.length > 0;

  const visiblePreachers = useMemo(() => {
    const preachers = siteIndex?.preachers ?? [];
    if (!isFilteringPreachers) {
      return preachers.map((preacher) => ({ preacher, speakers: preacher.speakers ?? [] }));
    }
    return preachers
      .map((preacher) => {
        const speakers = preacher.speakers ?? [];
        const sourceMatch = normalizeText(preacher.name).includes(normalizedPreacherFilter);
        const matchedSpeakers = sourceMatch
          ? speakers
          : speakers.filter((speaker) => normalizeText(speaker.name).includes(normalizedPreacherFilter));
        return { preacher, speakers: matchedSpeakers, visible: sourceMatch || matchedSpeakers.length > 0 };
      })
      .filter((item) => item.visible)
      .map(({ preacher, speakers }) => ({ preacher, speakers }));
  }, [siteIndex, isFilteringPreachers, normalizedPreacherFilter]);

  const visibleSermons = filteredSermons;

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
          <S.MobileFilterButton type="button" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal size={16} />
            Filtros
          </S.MobileFilterButton>
          <S.ActionButton href="https://www.youtube.com/" target="_blank" rel="noreferrer">
            <Youtube size={16} />
            YouTube
          </S.ActionButton>
        </S.HeaderActions>
      </S.TopBar>

      <S.Backdrop $open={filtersOpen} onClick={() => setFiltersOpen(false)} />

      <S.LayoutGrid>
        <S.Sidebar $open={filtersOpen}>
          <S.DrawerHeader>
            <S.DrawerTitle>Filtros</S.DrawerTitle>
            <S.IconButton type="button" aria-label="Cerrar filtros" onClick={() => setFiltersOpen(false)}>
              <X size={18} />
            </S.IconButton>
          </S.DrawerHeader>
          <S.Panel>
            <S.PanelTitle>
              <CheckCircle2 size={17} />
              Estado
            </S.PanelTitle>
            <S.StatGrid>
              <S.StatCard
                $accent="#2563EB"
                $active={selectedStatus === "all"}
                onClick={() => {
                  resetLibraryFilters();
                  setFiltersOpen(false);
                }}
              >
                <S.StatLabel $dot="#2563EB">Prédicas</S.StatLabel>
                <S.StatValue>{siteIndex.stats.sermons}</S.StatValue>
              </S.StatCard>
              <S.StatCard
                $accent="#0F9D58"
                $active={selectedStatus === "summarized"}
                onClick={() => {
                  setSelectedStatus("summarized");
                  setViewMode("sermons");
                  setFiltersOpen(false);
                }}
              >
                <S.StatLabel $dot="#0F9D58">Resumidas</S.StatLabel>
                <S.StatValue>{siteIndex.stats.summarized}</S.StatValue>
              </S.StatCard>
              <S.StatCard
                $accent="#7C5CFF"
                $active={viewMode === "preachers"}
                onClick={() => {
                  setSelectedStatus("all");
                  setViewMode("preachers");
                  setFiltersOpen(false);
                }}
              >
                <S.StatLabel $dot="#7C5CFF">Fuentes</S.StatLabel>
                <S.StatValue>{siteIndex.stats.sources}</S.StatValue>
              </S.StatCard>
              <S.StatCard
                $accent="#B7791F"
                $active={selectedStatus === "transcribed"}
                onClick={() => {
                  setSelectedStatus("transcribed");
                  setViewMode("sermons");
                  setFiltersOpen(false);
                }}
              >
                <S.StatLabel $dot="#B7791F">Transcritas</S.StatLabel>
                <S.StatValue>{siteIndex.stats.transcribed}</S.StatValue>
              </S.StatCard>
            </S.StatGrid>
          </S.Panel>

          <S.Panel>
            <S.PanelTitle>
              <Mic size={17} />
              Predicadores
            </S.PanelTitle>
            <S.PreacherSearch>
              <Search size={16} />
              <S.PreacherSearchInput
                value={preacherFilter}
                onChange={(event) => setPreacherFilter(event.target.value)}
                placeholder="Buscar predicador..."
              />
            </S.PreacherSearch>
            <S.SourceList>
              {!isFilteringPreachers ? (
                <S.SourceRow $active={selectedSource === "all"}>
                  <S.SourceMain
                    $active={selectedSource === "all"}
                    onClick={() => {
                      setSelectedSource("all");
                      setViewMode("sermons");
                      setFiltersOpen(false);
                    }}
                  >
                    <S.SourceNameText>Todos</S.SourceNameText>
                    <S.SourceCount>{menuCounts.get("all") ?? 0}</S.SourceCount>
                  </S.SourceMain>
                </S.SourceRow>
              ) : null}
              {visiblePreachers.length === 0 ? (
                <S.FilterEmpty>Sin coincidencias para “{preacherFilter}”.</S.FilterEmpty>
              ) : null}
              {visiblePreachers.map(({ preacher, speakers }) => {
                const hasChildren = (preacher.speakers?.length ?? 0) > 1;
                const expanded = isFilteringPreachers || expandedSources.has(preacher.slug);
                return (
                  <div key={preacher.slug}>
                    <S.SourceRow $active={selectedSource === sourceFilterKey(preacher.slug)}>
                      <S.SourceMain
                        $active={selectedSource === sourceFilterKey(preacher.slug)}
                        onClick={() => {
                          setSelectedSource(sourceFilterKey(preacher.slug));
                          setViewMode("sermons");
                          setFiltersOpen(false);
                        }}
                      >
                        <S.SourceNameText>{preacher.name}</S.SourceNameText>
                        <S.SourceCount>{menuCounts.get(sourceFilterKey(preacher.slug)) ?? 0}</S.SourceCount>
                      </S.SourceMain>
                      {hasChildren ? (
                        <S.ExpandToggle
                          type="button"
                          $open={expanded}
                          aria-label={expanded ? "Colapsar" : "Expandir"}
                          aria-expanded={expanded}
                          onClick={() => toggleSource(preacher.slug)}
                        >
                          <ChevronDown size={15} />
                        </S.ExpandToggle>
                      ) : null}
                    </S.SourceRow>
                    {hasChildren && expanded && speakers.length > 0 ? (
                      <S.SpeakerList>
                        {speakers.map((speaker) => (
                          <S.SpeakerButton
                            key={speaker.key}
                            $active={selectedSource === speaker.key}
                            onClick={() => {
                              setSelectedSource(speaker.key);
                              setViewMode("sermons");
                              setFiltersOpen(false);
                            }}
                          >
                            <S.SourceNameText>{speaker.name}</S.SourceNameText>
                            <S.SourceCount>{menuCounts.get(speaker.key) ?? 0}</S.SourceCount>
                          </S.SpeakerButton>
                        ))}
                      </S.SpeakerList>
                    ) : null}
                  </div>
                );
              })}
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
              <S.Select
                value={selectedSource}
                onChange={(event) => {
                  setSelectedSource(event.target.value);
                  setViewMode("sermons");
                }}
              >
                <option value="all">Todos los predicadores</option>
                {siteIndex.preachers.map((preacher) => (
                  <optgroup key={preacher.slug} label={preacher.name}>
                    <option value={sourceFilterKey(preacher.slug)}>Toda la fuente</option>
                    {(preacher.speakers ?? []).map((speaker) => (
                      <option key={speaker.key} value={speaker.key}>
                        {speaker.name}
                      </option>
                    ))}
                  </optgroup>
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
            {!(isMobile && mobileView === "detail") ? (
              <S.ResultList>
                {visibleSermons.length === 0 ? (
                  <S.EmptyState>No hay prédicas para los filtros seleccionados.</S.EmptyState>
                ) : (
                  visibleSermons.map((sermon) => (
                    <SermonResult
                      key={sermon.id}
                      sermon={sermon}
                      active={sermon.id === selectedSermonId}
                      onSelect={() => selectSermon(sermon.id)}
                    />
                  ))
                )}
              </S.ResultList>
            ) : null}

            {!isMobile ? (
              detailLoading ? (
                <S.EmptyState>Cargando prédica...</S.EmptyState>
              ) : selectedDetail ? (
                <SermonDetailPanel detail={selectedDetail} />
              ) : (
                <S.EmptyState>Selecciona una prédica.</S.EmptyState>
              )
            ) : mobileView === "detail" ? (
              <div>
                <S.BackButton type="button" onClick={() => setMobileView("list")}>
                  <ArrowLeft size={16} />
                  Volver a la lista
                </S.BackButton>
                {detailLoading ? (
                  <S.EmptyState>Cargando prédica...</S.EmptyState>
                ) : selectedDetail ? (
                  <SermonDetailPanel detail={selectedDetail} />
                ) : (
                  <S.EmptyState>Selecciona una prédica.</S.EmptyState>
                )}
              </div>
            ) : null}
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
        <S.StatusBadge $status={statusKey(sermon.status)}>{statusLabel(sermon.status)}</S.StatusBadge>
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
          <S.StatusBadge $status={statusKey(detail.status)}>{statusLabel(detail.status)}</S.StatusBadge>
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
