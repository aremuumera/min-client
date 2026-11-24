import {
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  type CollectionReference,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

/**
 * A Firestore list loaded in pages (2026-11-24). Firestore charges one read for every document it sends,
 * and the chat used to load whole collections. A feed keeps only the newest page live and fetches older
 * pages when asked, so opening a thread or the room list costs one page.
 *
 * - The live page is the newest `pageSize` documents by `orderField`. New and changed documents arrive
 *   through it.
 * - `loadMore()` fetches the next older page once (no listener), starting after the oldest document held.
 * - Documents the live page pushes out stay in the list. A document leaves the list only when it is
 *   deleted while the live page is not full, because then nothing can have pushed it out.
 *
 * Items come back newest first.
 */

export interface FeedState {
  /** Older documents may exist beyond what is loaded */
  hasMore: boolean;
  loadingMore: boolean;
}

export interface Feed {
  stop(): void;
  loadMore(): Promise<void>;
}

export interface FeedOptions<T> {
  ref: CollectionReference;
  /** Filters on every page. A range filter must be on `orderField`, or Firestore needs a composite index */
  filters?: QueryConstraint[];
  orderField: string;
  pageSize: number;
  toItem: (snap: QueryDocumentSnapshot<DocumentData>) => T;
  onChange: (items: T[], state: FeedState) => void;
  onError?: (error: unknown) => void;
}

/** A pending server timestamp has no value yet: Firestore's estimate keeps the document in order */
const millisOf = (snap: QueryDocumentSnapshot<DocumentData>, field: string): number => {
  const value = snap.get(field, { serverTimestamps: "estimate" }) as { toMillis?: () => number } | null | undefined;
  return value?.toMillis ? value.toMillis() : Number.MAX_SAFE_INTEGER;
};

export function watchFeed<T>({ ref, filters = [], orderField, pageSize, toItem, onChange, onError }: FeedOptions<T>): Feed {
  const held = new Map<string, { item: T; millis: number }>();
  let oldest: QueryDocumentSnapshot<DocumentData> | null = null;
  let oldestMillis = Number.MAX_SAFE_INTEGER;
  let hasMore = false;
  let olderLoaded = false;
  let loadingMore = false;
  let stopped = false;

  const hold = (snap: QueryDocumentSnapshot<DocumentData>) => {
    const millis = millisOf(snap, orderField);
    held.set(snap.id, { item: toItem(snap), millis });
    if (millis < oldestMillis) {
      oldest = snap;
      oldestMillis = millis;
    }
  };

  const emit = () => {
    if (stopped) return;
    const items = [...held.values()].sort((a, b) => b.millis - a.millis).map((h) => h.item);
    onChange(items, { hasMore, loadingMore });
  };

  const newestFirst = [orderBy(orderField, "desc")];
  const stopLive = onSnapshot(
    query(ref, ...filters, ...newestFirst, limit(pageSize)),
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === "removed" && snapshot.size < pageSize) held.delete(change.doc.id);
      }
      snapshot.docs.forEach(hold);
      if (!olderLoaded) hasMore = snapshot.size >= pageSize;
      emit();
    },
    (error) => {
      console.error("Firestore feed error:", error);
      onError?.(error);
    },
  );

  return {
    stop() {
      stopped = true;
      stopLive();
    },
    async loadMore() {
      if (stopped || loadingMore || !hasMore || !oldest) return;
      loadingMore = true;
      emit();
      try {
        const page = await getDocs(query(ref, ...filters, ...newestFirst, startAfter(oldest), limit(pageSize)));
        page.docs.forEach(hold);
        olderLoaded = true;
        hasMore = page.size === pageSize;
      } catch (error) {
        console.error("Firestore feed: loading older items failed:", error);
        onError?.(error);
      } finally {
        loadingMore = false;
        emit();
      }
    },
  };
}

/**
 * Several feeds shown as one list, in time order (the buyer's one thread across a room's cycles,
 * decision #146). A merged list can only show items newer than the oldest item of any feed that still
 * has older items, or a gap would hide that feed's older items between the others. `loadMore()` asks the
 * feed that sets that limit.
 */
export function mergeFeeds<T>(
  starts: Array<(onChange: (items: T[], state: FeedState) => void) => Feed>,
  millisOfItem: (item: T) => number,
  onChange: (items: T[], state: FeedState, parts: Array<{ items: T[]; hasMore: boolean }>) => void,
): Feed {
  // each feed shows as soon as it arrives (a feed that fails stays empty and never blocks the others)
  const parts: Array<{ items: T[]; hasMore: boolean; loadingMore: boolean }> = starts.map(() => ({ items: [], hasMore: false, loadingMore: false }));
  let feeds: Feed[] = [];

  /** The oldest loaded item of each feed that has older items: nothing older than the newest of these shows */
  const horizon = () => {
    let limitAt = Number.NEGATIVE_INFINITY;
    for (const part of parts) {
      if (!part.hasMore || !part.items.length) continue;
      limitAt = Math.max(limitAt, millisOfItem(part.items[part.items.length - 1]));
    }
    return limitAt;
  };

  const emit = () => {
    const from = horizon();
    const items = parts.flatMap((p) => p.items).filter((item) => millisOfItem(item) >= from);
    items.sort((a, b) => millisOfItem(b) - millisOfItem(a));
    onChange(items, { hasMore: parts.some((p) => p.hasMore), loadingMore: parts.some((p) => p.loadingMore) }, parts.map((p) => ({ items: p.items, hasMore: p.hasMore })));
  };

  feeds = starts.map((start, index) =>
    start((items, state) => {
      parts[index] = { items, hasMore: state.hasMore, loadingMore: state.loadingMore };
      emit();
    }),
  );

  return {
    stop() {
      feeds.forEach((feed) => feed.stop());
    },
    async loadMore() {
      let pick = -1;
      let pickAt = Number.NEGATIVE_INFINITY;
      parts.forEach((part, index) => {
        if (!part.hasMore || part.loadingMore) return;
        const at = part.items.length ? millisOfItem(part.items[part.items.length - 1]) : Number.MAX_SAFE_INTEGER;
        if (at > pickAt) {
          pick = index;
          pickAt = at;
        }
      });
      if (pick >= 0) await feeds[pick].loadMore();
    },
  };
}
