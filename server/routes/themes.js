"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");

// Theme id = css filename in data/themes, so only safe filename characters.
const THEME_ID = /^[A-Za-z0-9_-]+$/;

// Bump when built-in palettes change so shipped updates overwrite the seeded
// copies. User themes (other filenames) are never touched.
// ponytail: edits to built-in themes reset on version bump; switch to per-file
// fingerprints if built-in edits must survive upgrades.
const THEMES_VERSION = "2";

module.exports = ({ dataDirectory, builtinThemesDirectory }) => {
  const themesDirectory = path.join(dataDirectory, "themes");
  fs.mkdirSync(themesDirectory, { recursive: true });

  // Seed the built-in themes (from build/themes) so users get editable copies.
  if (builtinThemesDirectory && fs.existsSync(builtinThemesDirectory)) {
    let currentVersion = null;
    try {
      currentVersion = fs
        .readFileSync(path.join(themesDirectory, ".version"), "utf8")
        .trim();
    } catch (e) {
      // first run: no .version yet, seed built-ins
    }
    const refreshBuiltins = currentVersion !== THEMES_VERSION;
    for (const file of fs.readdirSync(builtinThemesDirectory)) {
      if (!file.endsWith(".css")) continue;
      const target = path.join(themesDirectory, file);
      if (refreshBuiltins || !fs.existsSync(target)) {
        fs.copyFileSync(path.join(builtinThemesDirectory, file), target);
      }
    }
    if (refreshBuiltins) {
      fs.writeFileSync(path.join(themesDirectory, ".version"), THEMES_VERSION);
    }
  }

  const router = express.Router();

  const listThemes = () =>
    fs
      .readdirSync(themesDirectory)
      .filter((file) => file.endsWith(".css"))
      .map((file) => {
        const id = file.slice(0, -4);
        return {
          id,
          name: id
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
        };
      });

  router.get("/", (req, res) => {
    res.json({ error: null, data: { themes: listThemes() } });
  });

  router.get("/:id", (req, res) => {
    const { id } = req.params;
    if (!THEME_ID.test(id)) {
      res.status(404).send("404 - Not found.");
      return;
    }
    const filePath = path.join(themesDirectory, `${id}.css`);
    if (!fs.existsSync(filePath)) {
      res.status(404).send("404 - Not found.");
      return;
    }
    res.type("css").sendFile(filePath);
  });

  return { router };
};
