import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

function removeDupsAndLowerCase(array: string[]) {
  return [...new Set(array.map((str) => str.toLowerCase()))];
}

const titleSchema = z.string().max(60);

const baseSchema = z.object({
  title: titleSchema,
  authors: z.array(z.string()).min(1).default(["Gabriel I. Alonso"]),
});

const post = defineCollection({
  loader: glob({ base: "./src/content/post", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) =>
    baseSchema.extend({
      description: z.string(),
      topic: z.string().optional().default(""),
      coverImage: z
        .object({
          alt: z.string(),
          src: image(),
        })
        .optional(),
      draft: z.boolean().default(false),
      unlisted: z.boolean().default(false),
      ogImage: z.string().optional(),
      tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
      publishDate: z
        .string()
        .or(z.date())
        .transform((val) => new Date(val)),
      updatedDate: z
        .string()
        .optional()
        .transform((str) => (str ? new Date(str) : undefined)),
    }),
});

const note = defineCollection({
  loader: glob({ base: "./src/content/note", pattern: "**/*.{md,mdx}" }),
  schema: baseSchema.extend({
    description: z.string().optional(),
    publishDate: z.iso
      .datetime({ offset: true }) // Ensures ISO 8601 format with offsets allowed (e.g. "2024-01-01T00:00:00Z" and "2024-01-01T00:00:00+02:00")
      .transform((val) => new Date(val)),
  }),
});

const tag = defineCollection({
  loader: glob({ base: "./src/content/tag", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: titleSchema.optional(),
    description: z.string().optional(),
  }),
});

const project = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) =>
    baseSchema.extend({
      description: z.string(),
      kind: z.enum(["research", "project", "art"]).default("project"),
      featured: z.boolean().default(false),
      topic: z.string().optional().default(""),
      coverImage: z
        .object({
          alt: z.string(),
          src: image(),
        })
        .optional(),
      thumbnail: z
        .object({
          alt: z.string(),
          src: image(),
        })
        .optional(),
      publishDate: z
        .string()
        .or(z.date())
        .transform((val) => new Date(val)),
      updatedDate: z
        .string()
        .optional()
        .transform((str) => (str ? new Date(str) : undefined)),
      tags: z.array(z.string()).default([]),
    }),
});

export const collections = { post, note, tag, project };
