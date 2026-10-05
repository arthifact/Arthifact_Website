import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { gzipSync } from "node:zlib";

export function verifyPonyoGallery(html, root) {
  const gallery = html.match(
    /<figure\b[^>]*data-ponyo-gallery="[^"]+"[^>]*>[\s\S]*?<\/figure>/,
  )?.[0];
  assert(gallery, "The homepage must include the Ponyo figure.");
  const encoded = gallery.match(/data-ponyo-gallery="([^"]+)"/)?.[1];
  assert(encoded, "The homepage must include the local Ponyo gallery.");
  const json = encoded.replaceAll("&quot;", '"').replaceAll("&amp;", "&");
  const frames = JSON.parse(json);
  assert.equal(frames.length, 50, "All 50 Ponyo stills must be selectable.");
  assert.equal(new Set(frames.map((frame) => frame.id)).size, 50);
  for (let number = 1; number <= 50; number++) {
    assert(
      frames.some((frame) => frame.id === String(number).padStart(3, "0")),
    );
  }
  for (const frame of frames) {
    assert(frame.alt.length > 20, `Frame ${frame.id} needs a description.`);
    const candidates = frame.srcset.split(", ");
    assert.equal(candidates.length, 3);
    for (const url of [
      frame.src,
      ...candidates.map((candidate) => candidate.split(" ")[0]),
    ]) {
      assert(url.startsWith("/_astro/"), "Stills must load from local assets.");
      assert(
        fs.existsSync(path.join(root, url)),
        `Missing Ponyo asset: ${url}`,
      );
    }
  }
  const script = gallery.match(
    /<script\b[^>]*data-ponyo-randomizer[^>]*>([\s\S]*?)<\/script>/,
  )?.[1];
  assert(script, "The homepage must choose a still on each load.");
  const scriptKiB = gzipSync(script).length / 1024;
  assert(
    scriptKiB < 1.2,
    "The inline image chooser exceeds its 1.2 KiB gzip budget.",
  );
  const fallback = frames.find((frame) => frame.id === "050");
  const noScript = gallery.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1];
  assert(
    noScript?.includes(fallback.src),
    "The underwater still must work with JavaScript disabled.",
  );
  assert(
    !/<img\b/.test(gallery.replace(/<noscript>[\s\S]*?<\/noscript>/g, "")),
    "An unselected still must not be requested before the image chooser runs.",
  );

  function load(random, storage = new Map(), storageUnavailable = false) {
    let mounted = [];
    let onError;
    let errorOptions;
    const image = {
      dataset: {},
      addEventListener(name, handler, options) {
        assert.equal(name, "error");
        onError = handler;
        errorOptions = options;
      },
    };
    const target = {
      replaceChildren(...children) {
        mounted = children;
      },
    };
    const figure = {
      dataset: { ponyoGallery: json },
      querySelector(selector) {
        assert.equal(selector, "[data-ponyo-frame]");
        return target;
      },
    };
    const math = Object.create(Math);
    math.random = () => random;
    vm.runInNewContext(script, {
      Math: math,
      document: {
        currentScript: { parentElement: figure },
        createElement(tag) {
          assert.equal(tag, "img");
          return image;
        },
      },
      sessionStorage: {
        getItem(key) {
          if (storageUnavailable) throw new Error("Unavailable");
          return storage.get(key) ?? null;
        },
        setItem(key, value) {
          if (storageUnavailable) throw new Error("Unavailable");
          storage.set(key, value);
        },
      },
    });
    assert.equal(
      mounted.length,
      1,
      "Exactly one image should be mounted per load.",
    );
    assert.equal(image.width, 960);
    assert.equal(image.height, 519);
    assert.equal(image.loading, "eager");
    const frame = frames.find((frame) => frame.id === image.dataset.ponyoStill);
    assert(frame);
    assert.equal(image.src, frame.src);
    assert.equal(image.srcset, frame.srcset);
    assert.equal(image.alt, frame.alt);
    return { image, onError, errorOptions };
  }
  const reachable = new Set();
  for (let index = 0; index < 50; index++)
    reachable.add(load((index + 0.5) / 50).image.dataset.ponyoStill);
  assert.equal(
    reachable.size,
    50,
    "Every still must be reachable by the random choice.",
  );
  for (const previous of frames) {
    const storage = new Map([["portfolio:ponyo-still", previous.id]]);
    const result = load(0.5, storage);
    assert.notEqual(
      result.image.dataset.ponyoStill,
      previous.id,
      "A reload must avoid the previous still.",
    );
    assert.equal(
      storage.get("portfolio:ponyo-still"),
      result.image.dataset.ponyoStill,
    );
  }
  load(0.5, new Map(), true);
  const failure = load(0);
  assert.equal(failure.errorOptions.once, true);
  failure.onError();
  assert.equal(failure.image.dataset.ponyoStill, "050");
  assert.equal(failure.image.src, fallback.src);
  failure.onError();
  assert.equal(
    failure.image.src,
    fallback.src,
    "The fallback must not trigger an endless retry.",
  );
  return scriptKiB;
}
