---
title: Earth's Layers (3D)
description: A real-time interactive model revealing the inner structure of our planet.
publishDate: "2025-10-12T05:06:00Z"
---

A 3D interactive visualization I created to illustrate Earth’s internal layers.

<div class="interactive-model">
  <button type="button" id="load-earth-model">Explore the 3D model ↗</button>
  <div id="earth-model" hidden></div>
  <p id="earth-model-status" role="status"></p>
</div>
<noscript><p>JavaScript is needed to explore the interactive 3D model.</p></noscript>

<script>
const button = document.getElementById("load-earth-model");
button?.addEventListener("click", async () => {
  const container = document.getElementById("earth-model");
  const status = document.getElementById("earth-model-status");
  button.disabled = true;
  status.textContent = "Opening the model…";
  try {
    await import("https://unpkg.com/@splinetool/viewer@1.10.77/build/spline-viewer.js");
    const viewer = document.createElement("spline-viewer");
    viewer.setAttribute("url", "https://prod.spline.design/ICrzHqpk7t4QabsX/scene.splinecode");
    container.replaceChildren(viewer);
    container.hidden = false;
    button.hidden = true;
    status.textContent = "Drag to rotate the model.";
  } catch {
    button.disabled = false;
    status.textContent = "The model could not be loaded. Please try again.";
  }
});
</script>
