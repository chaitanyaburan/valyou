const STORAGE_KEY = "valyou.feedEngagement.v1";

export type FeedComment = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

type Store = {
  likes: Record<string, boolean>;
  comments: Record<string, FeedComment[]>;
};

function emptyStore(): Store {
  return { likes: {}, comments: {} };
}

export function loadFeedEngagement(): Store {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const p = JSON.parse(raw) as unknown;
    if (!p || typeof p !== "object") return emptyStore();
    const likes = "likes" in p && typeof (p as Store).likes === "object" && (p as Store).likes !== null ? (p as Store).likes : {};
    const comments =
      "comments" in p && typeof (p as Store).comments === "object" && (p as Store).comments !== null
        ? (p as Store).comments
        : {};
    return { likes, comments };
  } catch {
    return emptyStore();
  }
}

function saveFeedEngagement(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

export function isPostLiked(postId: string): boolean {
  return loadFeedEngagement().likes[postId] === true;
}

export function setPostLiked(postId: string, liked: boolean): void {
  const s = loadFeedEngagement();
  if (liked) s.likes[postId] = true;
  else delete s.likes[postId];
  saveFeedEngagement(s);
}

export function getPostComments(postId: string): FeedComment[] {
  return loadFeedEngagement().comments[postId] ?? [];
}

export function appendPostComment(postId: string, comment: FeedComment): void {
  const s = loadFeedEngagement();
  const list = s.comments[postId] ?? [];
  s.comments[postId] = [...list, comment];
  saveFeedEngagement(s);
}
