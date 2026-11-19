// Stock Take website bridge.
// The page (page.html) was built for claude.ai, where it asks for "db", "downloads" and "user".
// On this website the same requests are answered here: "db" by the clinic's Supabase database
// (one table, "docs"), "downloads" by the browser, and "user" by nothing (staff type their name).
// If config.js has no Supabase details, "db" answers null and the page keeps counts on this device only.
(function () {
  "use strict";
  var CFG = window.STOCKTAKE_CONFIG || {};
  var URL_ = String(CFG.supabaseUrl || "").replace(/\/+$/, "");
  var KEY = String(CFG.supabaseAnonKey || "");
  var ONLINE = !!(URL_ && KEY);
  var POLL_MS = 15000;

  function rest(method, query, body, prefer) {
    var h = { apikey: KEY, Authorization: "Bearer " + KEY };
    if (body !== undefined) h["Content-Type"] = "application/json";
    if (prefer) h.Prefer = prefer;
    return fetch(URL_ + "/rest/v1/docs" + query, {
      method: method, headers: h, body: body === undefined ? undefined : JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) { var e = new Error("HTTP " + r.status); e.code = r.status >= 500 ? "unavailable" : "invalid_argument"; throw e; }
      return r.status === 204 ? null : r.json().catch(function () { return null; });
    });
  }
  var enc = encodeURIComponent;
  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, "");
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
  }
  function freeze(o) { try { return JSON.parse(JSON.stringify(o || {})); } catch (e) { return {}; } }
  function docSnap(id, data) {
    var d = data == null ? undefined : freeze(data);
    return { id: id, exists: d !== undefined, data: function () { return d; }, metadata: { fromCache: false, hasPendingWrites: false } };
  }

  // One poller per collection, shared by every listener on it.
  var watchers = {};
  function watcher(col) {
    if (watchers[col]) return watchers[col];
    var w = { col: col, subs: [], rows: null, timer: null, busy: false };
    w.refresh = function () {
      if (w.busy) return Promise.resolve();
      w.busy = true;
      return rest("GET", "?collection=eq." + enc(col) + "&select=id,data&limit=20000")
        .then(function (rows) {
          // Only tell the page when something changed, so a refresh never interrupts typing.
          var sig = JSON.stringify(rows || []);
          if (sig === w.sig) return;
          w.sig = sig; w.rows = rows || []; w.subs.forEach(function (s) { s.deliver(w.rows); });
        })
        .catch(function () { /* keep the last rows; the next poll retries */ })
        .then(function () { w.busy = false; });
    };
    w.start = function () {
      if (w.timer) return;
      w.refresh();
      w.timer = setInterval(function () { if (document.visibilityState === "visible") w.refresh(); }, POLL_MS);
      document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") w.refresh(); });
    };
    watchers[col] = w;
    return w;
  }
  function touched(col) { var w = watchers[col]; return w ? w.refresh() : Promise.resolve(); }

  function docRef(col, id) {
    var q = "?collection=eq." + enc(col) + "&id=eq." + enc(id);
    return {
      id: id, path: col + "/" + id,
      get: function () { return rest("GET", q + "&select=id,data").then(function (r) { return docSnap(id, r && r[0] ? r[0].data : null); }); },
      set: function (data) {
        return rest("POST", "?on_conflict=collection,id", { collection: col, id: id, data: data }, "resolution=merge-duplicates,return=minimal")
          .then(function () { return touched(col); });
      },
      update: function (patch) {
        var self = this;
        return self.get().then(function (s) {
          if (!s.exists) { var e = new Error("missing"); e.code = "invalid_argument"; throw e; }
          var merged = Object.assign({}, s.data(), patch);
          return self.set(merged);
        });
      },
      "delete": function () { return rest("DELETE", q).then(function () { return touched(col); }); },
      onSnapshot: function (next, error) {
        var w = watcher(col), alive = true;
        var sub = { deliver: function (rows) {
          if (!alive) return;
          var row = null; for (var i = 0; i < rows.length; i++) if (rows[i].id === id) { row = rows[i]; break; }
          next(docSnap(id, row ? row.data : null));
        } };
        w.subs.push(sub); if (w.rows) sub.deliver(w.rows); w.start();
        return function () { alive = false; w.subs = w.subs.filter(function (s) { return s !== sub; }); };
      }
    };
  }
  function colRef(col) {
    return {
      path: col,
      doc: function (id) { return docRef(col, id || newId()); },
      add: function (data) { var r = docRef(col, newId()); return r.set(data).then(function () { return r; }); },
      onSnapshot: function (next, error) {
        var w = watcher(col), alive = true;
        var sub = { deliver: function (rows) {
          if (!alive) return;
          var docs = rows.map(function (r) { return docSnap(r.id, r.data); });
          next({ docs: docs, size: docs.length, empty: !docs.length, metadata: { fromCache: false, hasPendingWrites: false },
                 docChanges: function () { return []; } });
        } };
        w.subs.push(sub); if (w.rows) sub.deliver(w.rows); w.start();
        return function () { alive = false; w.subs = w.subs.filter(function (s) { return s !== sub; }); };
      }
    };
  }
  var db = {
    collection: function (path) { return colRef(path); },
    doc: function (path) { var i = path.lastIndexOf("/"); return docRef(path.slice(0, i), path.slice(i + 1)); }
  };

  var downloads = {
    save: function (req) {
      return new Promise(function (resolve) {
        var data = req.data;
        var blob = data instanceof Blob ? data : new Blob([data]);
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = req.filename || "fail";
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
        resolve({ status: "saved" });
      });
    }
  };

  window.claude = {
    use: function (name) {
      if (name === "db") return Promise.resolve(ONLINE ? db : null);
      if (name === "downloads") return Promise.resolve(downloads);
      return Promise.resolve(null);
    }
  };
})();
