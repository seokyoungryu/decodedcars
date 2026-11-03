// src/content/guides/*.md (English) and src/content/guias/*.md (Spanish, same slug) — hand-written articles
// (original content alongside the data pages). kind: 'guide' (default) or 'analysis' (data stories).
import type { MarkdownInstance } from 'astro';
import type { Lang } from '@/i18n';

type Front = { title: string; description: string; order: number; updated: string | Date; kind?: 'guide' | 'analysis' };
const en = import.meta.glob<MarkdownInstance<Front>>('../content/guides/*.md', { eager: true });
const es = import.meta.glob<MarkdownInstance<Front>>('../content/guias/*.md', { eager: true });

const list = (files: Record<string, MarkdownInstance<Front>>) =>
  Object.entries(files)
    .map(([path, mod]) => ({
      slug: path.split('/').pop()!.replace(/\.md$/, ''),
      ...mod.frontmatter,
      kind: mod.frontmatter.kind ?? 'guide',
      // YAML parses dates into Date objects; keep 'YYYY-MM-DD'
      updated: new Date(mod.frontmatter.updated).toISOString().slice(0, 10),
      Content: mod.Content,
    }))
    .sort((a, b) => a.order - b.order);

export const GUIDES = list(en);
export const GUIAS = list(es);
export type Guide = (typeof GUIDES)[number];
export const guides = (lang: Lang) => (lang === 'es' ? GUIAS : GUIDES);
/** the same article in the other language, if it exists */
export const twin = (lang: Lang, slug: string) => (lang === 'es' ? GUIDES : GUIAS).find((g) => g.slug === slug);
