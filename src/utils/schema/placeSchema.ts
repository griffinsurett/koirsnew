// src/utils/schema/placeSchema.ts
/**
 * schema.org Place helpers built from the service-areas hierarchy.
 *
 * The collection is three levels deep and the depth carries real meaning:
 *
 *   depth 0  New Jersey / New York City / Eastern Pennsylvania   (root)
 *   depth 1  Monmouth County, Bergen County, …                   (21 counties)
 *   depth 2  Aberdeen, Asbury Park, …                            (553 towns)
 *
 * So a town's `parent` is its county and its grandparent is the state. That
 * ancestry is exactly what schema.org's `containedInPlace` expresses, and it's
 * what lets a location page describe itself precisely — "Aberdeen, a city in
 * Monmouth County, New Jersey" — instead of repeating the same three top-level
 * regions on all 600+ pages.
 */
import { query, sortByOrder } from "@/utils/query";

export interface AreaNode {
  id: string;
  title: string;
  parent?: string;
  abbr?: string;
}

/**
 * schema.org type for a given depth.
 *
 * Roots are `Place`, not `State`: the set mixes a state (New Jersey), a city
 * (New York City), and an informal region (Eastern Pennsylvania), so `Place` is
 * the only supertype that's accurate for all three. Counties are
 * `AdministrativeArea`; municipalities are `City`.
 */
function typeForDepth(depth: number): string {
  if (depth === 0) return "Place";
  if (depth === 1) return "AdministrativeArea";
  return "City";
}

/** Load the collection once and index it for ancestry walks. */
export async function loadAreaIndex(): Promise<{
  byId: Map<string, AreaNode>;
  all: AreaNode[];
}> {
  const entries = await query("service-areas").orderBy(sortByOrder()).all();
  const all: AreaNode[] = entries.map((e: any) => ({
    id: e.id,
    title: e.data?.title,
    parent: typeof e.data?.parent === "string" ? e.data.parent : undefined,
    abbr: e.data?.abbr,
  }));
  return { byId: new Map(all.map((a) => [a.id, a])), all };
}

/** Ancestors nearest-first (county, then state). Cycle-safe. */
export function ancestorsOf(
  node: AreaNode,
  byId: Map<string, AreaNode>
): AreaNode[] {
  const out: AreaNode[] = [];
  const seen = new Set<string>([node.id]);
  let p = node.parent;
  while (p && byId.has(p) && !seen.has(p)) {
    seen.add(p);
    const parent = byId.get(p)!;
    out.push(parent);
    p = parent.parent;
  }
  return out;
}

export function depthOf(node: AreaNode, byId: Map<string, AreaNode>): number {
  return ancestorsOf(node, byId).length;
}

/**
 * A single Place for one area, nested via `containedInPlace` all the way up.
 *
 * Aberdeen becomes:
 *   City "Aberdeen"
 *     containedInPlace: AdministrativeArea "Monmouth County"
 *       containedInPlace: Place "New Jersey"
 *
 * which is how Google reads civic hierarchy — far more useful for local intent
 * than a flat list of names.
 */
export function buildPlace(
  node: AreaNode,
  byId: Map<string, AreaNode>
): Record<string, any> {
  const anc = ancestorsOf(node, byId);
  const depth = anc.length;

  let containedInPlace: Record<string, any> | undefined;
  // Build from the outermost ancestor inward so the nesting reads correctly.
  for (let i = anc.length - 1; i >= 0; i--) {
    const a = anc[i];
    const aDepth = anc.length - 1 - i; // 0 for the outermost
    containedInPlace = {
      "@type": typeForDepth(aDepth),
      name: a.title,
      ...(containedInPlace && { containedInPlace }),
    };
  }

  return {
    "@type": typeForDepth(depth),
    name: node.title,
    ...(containedInPlace && { containedInPlace }),
  };
}

/**
 * `areaServed` for the SITE-WIDE business entity: the three roots only.
 *
 * Emitting all 577 would put ~26 KB of JSON-LD on every one of 600+ pages
 * (~15 MB total) to say something the roots already say — Google reads
 * `areaServed` as the scope of service, and the roots are that scope. Towns get
 * their precise geography on their own pages via `buildPlace` instead.
 */
export async function buildRootAreaServed(): Promise<Record<string, any>[]> {
  const { all, byId } = await loadAreaIndex();
  return all
    .filter((a) => depthOf(a, byId) === 0 && a.title)
    .map((a) => ({ "@type": typeForDepth(0), name: a.title }));
}

/**
 * `areaServed` for ONE location page — the place itself plus its ancestry.
 * A county page also lists its towns, since serving a county genuinely means
 * serving the municipalities in it.
 */
export async function buildAreaServedFor(
  areaId: string
): Promise<Record<string, any>[] | undefined> {
  const { all, byId } = await loadAreaIndex();
  const node = byId.get(areaId);
  if (!node) return undefined;

  const self = buildPlace(node, byId);
  const children = all.filter((a) => a.parent === areaId && a.title);

  if (children.length === 0) return [self];

  return [
    self,
    ...children.map((c) => ({ "@type": typeForDepth(depthOf(c, byId)), name: c.title })),
  ];
}
