/*
 * Addon's Studio bridge for Blockbench.
 * Copyright (C) 2026 WarpZone. Part of a modified version of Blockbench (https://github.com/JannisX11/blockbench),
 * licensed under the GNU General Public License v3.0 or later, like Blockbench itself (see LICENSE.MD).
 * Modified by Addon's Studio on 10 November 2026: this file was added, and index.html loads it.
 *
 * It lets the Addon's Studio app (which shows this page in a frame) open a model in Blockbench and get it back when
 * the player saves, without downloading a file. Messages only go to, and are only accepted from, the app's own
 * address, and only for this frame's session.
 */
"use strict";
(function () {
  // The app addresses allowed to use this bridge (filled in by the server).
  var ALLOWED = /*ALLOWED_PARENTS*/[];
  var q = new URLSearchParams(location.hash.slice(1));
  var session = q.get("aos") || "";
  var parentOrigin = q.get("o") || "";
  if (!/^[A-Za-z0-9-]{8,64}$/.test(session) || ALLOWED.indexOf(parentOrigin) < 0 || window.parent === window) return;

  // Inside the app, Blockbench mustn't add browser history entries: they'd join the app's own, and the phone's
  // back gesture would undo in Blockbench instead of leaving it. (This runs before Blockbench starts.)
  try { history.pushState = function () {}; } catch (e) { /* ignore */ }

  function send(type, data) {
    var m = { ns: "aos", v: 1, session: session, type: type };
    if (data) for (var k in data) m[k] = data[k];
    window.parent.postMessage(m, parentOrigin);
  }

  function snapshot() {
    return {
      name: (window.Project && Project.name) || "model",
      format: (window.Format && Format.id) || "",
      bbmodel: Codecs.project.compile({ raw: true, bitmaps: true }),
    };
  }

  function save() {
    try {
      if (!window.Project) return send("error", { message: "Open a model first." });
      send("saved", snapshot());
    } catch (err) {
      send("error", { message: String((err && err.message) || err) });
    }
  }

  async function load(m) {
    try {
      var open = (window.ModelProject && ModelProject.all) ? ModelProject.all.slice() : [];
      for (var i = 0; i < open.length; i++) await open[i].close(true);
      var name = String(m.name || "model").replace(/[^A-Za-z0-9 _-]/g, "").slice(0, 60) || "model";
      if (Codecs.project && typeof Codecs.project.load === "function") {
        Codecs.project.load(m.bbmodel, { path: name + ".bbmodel", name: name + ".bbmodel" });
      } else {
        loadModelFile({ content: JSON.stringify(m.bbmodel), path: name + ".bbmodel", name: name + ".bbmodel" });
      }
      if (window.Project) Project.saved = true;
      if (m.mode && window.Modes && Modes.options && Modes.options[m.mode]) Modes.options[m.mode].select();
      send("loaded");
    } catch (err) {
      send("error", { message: String((err && err.message) || err) });
    }
  }

  window.addEventListener("message", function (e) {
    if (e.origin !== parentOrigin || e.source !== window.parent) return;
    var m = e.data;
    if (!m || m.ns !== "aos" || m.session !== session) return;
    if (m.type === "load") load(m);
    else if (m.type === "requestSave") save();
    else if (m.type === "ack") {
      if (window.Project) Project.saved = true;
      if (window.Blockbench && Blockbench.showQuickMessage) Blockbench.showQuickMessage("Saved to Addon's Studio", 1600);
    }
  });

  (function wait() {
    if (!window.Blockbench || !Blockbench.setup_successful || !window.BarItems) return setTimeout(wait, 100);
    try {
      // "Save Model" (Ctrl+S) and "Save Project" go to Addon's Studio instead of downloading a file.
      // "Save Project As" still downloads, as a way to keep a copy.
      ["export_over", "save_project"].forEach(function (id) {
        if (BarItems[id] && BarItems[id].on) BarItems[id].on("use", function () { save(); return false; });
      });
      var action = new Action("aos_save", { name: "Save to Addon's Studio", icon: "save", category: "file", click: save });
      if (window.MenuBar && MenuBar.addAction) MenuBar.addAction(action, "file.0");
    } catch (err) {
      // Older or newer Blockbench without these hooks: the app's own Save button still works.
    }
    // No "you have unsaved changes" prompt when the app closes the frame (the app asks instead).
    window.onbeforeunload = null;
    send("ready");
  })();
})();
