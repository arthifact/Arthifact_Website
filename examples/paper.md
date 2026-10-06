---
title: "Paper title"
description: "A short summary of the work."
publishDate: "2026-10-05"
format: paper
numberedSections: true
columns: 2
abstract: "State the question, method, and main result in one paragraph."
# authors: ["Gabriel I. Alonso", "Coauthor"]
# affiliation: "Your institution"
# pdf: "/files/your-paper.pdf"
unlisted: true
---

## Introduction

Explain the question and why it matters.

Inline equations use LaTeX between dollar signs: $d(x,y) = \lVert x-y \rVert_2$.

## Method

Explain what you did. Display equations use two dollar signs on their own lines:

$$
E(X) = \sum_{i=1}^{n} \lVert x_i-y_i \rVert^2
\tag{1}
$$

## Results

Describe what you found. Use a Markdown table for simple results:

| Method | Error |
| :--- | ---: |
| Baseline | 0.25 |
| Proposed | 0.10 |

For numbered figures, rich captions, and paired panels, start with `examples/paper.mdx` instead.

## References

Link to the sources you used.
