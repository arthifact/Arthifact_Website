import { type CollectionEntry, getCollection } from "astro:content";

/** filter out draft posts based on the environment */
export async function getAllPosts(): Promise<CollectionEntry<"post">[]> {
  return await getCollection("post", ({ data }) => {
    return !data.unlisted && (import.meta.env.PROD ? !data.draft : true);
  });
}

/** Get tag metadata by tag name */
export async function getTagMeta(
  tag: string,
): Promise<CollectionEntry<"tag"> | undefined> {
  const tagEntries = await getCollection("tag", (entry) => {
    return entry.id === tag;
  });
  return tagEntries[0];
}

/** groups posts by year (based on option siteConfig.sortPostsByUpdatedDate), using the year as the key
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 */
export function groupPostsByYear(posts: CollectionEntry<"post">[]) {
  return posts.reduce<Record<string, CollectionEntry<"post">[]>>(
    (acc, post) => {
      const year = post.data.publishDate.getFullYear();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year]?.push(post);
      return acc;
    },
    {},
  );
}

/** groups posts by topic (alphabetically), with posts sorted by date (newest first) within each topic */
export function groupPostsByTopic(posts: CollectionEntry<"post">[]) {
  const grouped = posts.reduce<Record<string, CollectionEntry<"post">[]>>(
    (acc, post) => {
      const topic = post.data.topic || "(No Topic)";
      if (!acc[topic]) {
        acc[topic] = [];
      }
      acc[topic]?.push(post);
      return acc;
    },
    {},
  );
  // Sort posts within each topic by date (newest first)
  for (const topic in grouped) {
    grouped[topic]?.sort(
      (a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime(),
    );
  }
  return Object.fromEntries(
    Object.entries(grouped).sort(([a], [b]) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    ),
  );
}

/** returns all tags created from posts (inc duplicate tags)
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getAllTags(posts: CollectionEntry<"post">[]) {
  return posts.flatMap((post) => [...post.data.tags]);
}

/** returns all unique tags created from posts
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getUniqueTags(posts: CollectionEntry<"post">[]) {
  return [...new Set(getAllTags(posts))];
}

/** returns a count of each unique tag - [[tagName, count], ...]
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getUniqueTagsWithCount(
  posts: CollectionEntry<"post">[],
): [string, number][] {
  return [
    ...getAllTags(posts).reduce(
      (acc, t) => acc.set(t, (acc.get(t) ?? 0) + 1),
      new Map<string, number>(),
    ),
  ].sort((a, b) => b[1] - a[1]);
}
