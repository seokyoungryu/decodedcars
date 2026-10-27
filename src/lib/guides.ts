// src/content/guides/*.md — hand-written articles (original content alongside the data pages)
import type { MarkdownInstance } from 'astro';

type Front = { title: string; description: string; order: number; updated: string | Date };
const files = import.meta.glob<MarkdownInstance<Front>>('../content/guides/*.md', { eager: true });

export const GUIDES = Object.entries(files)
  .map(([path, mod]) => ({
    slug: path.split('/').pop()!.replace(/\.md$/, ''),
    ...mod.frontmatter,
    // YAML parses dates into Date objects; keep 'YYYY-MM-DD'
    updated: new Date(mod.frontmatter.updated).toISOString().slice(0, 10),
    Content: mod.Content,
  }))
  .sort((a, b) => a.order - b.order);
