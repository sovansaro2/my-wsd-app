var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express6 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_vite = require("vite");

// server/auth/routes.ts
var import_express = require("express");

// server/auth/schemas.ts
var import_zod = require("zod");
var SignupSchema = import_zod.z.object({
  email: import_zod.z.string().email(),
  password: import_zod.z.string().min(6),
  full_name: import_zod.z.string().min(1),
  phone_number: import_zod.z.string().optional()
});
var LoginSchema = import_zod.z.object({
  email: import_zod.z.string().email(),
  password: import_zod.z.string()
});

// server/database.ts
var import_supabase_js = require("@supabase/supabase-js");

// server/config.ts
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var config = {
  SUPABASE_URL: (process.env.VITE_SUPABASE_URL || "").trim().replace(/\/rest\/v1\/?$/, ""),
  SUPABASE_ANON_KEY: (process.env.VITE_SUPABASE_ANON_KEY || "").trim(),
  SUPABASE_SERVICE_ROLE_KEY: (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim(),
  JWT_SECRET: (process.env.JWT_SECRET_KEY || "wsd-super-secret-jwt-key-2026").trim()
};

// server/database.ts
var import_ws = __toESM(require("ws"), 1);
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = import_ws.default;
}
var keyToUse = config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY;
var supabaseAdmin = (0, import_supabase_js.createClient)(config.SUPABASE_URL, keyToUse, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// server/auth/routes.ts
var router = (0, import_express.Router)();
router.post("/signup", async (req, res) => {
  try {
    const data = SignupSchema.parse(req.body);
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          phone_number: data.phone_number,
          role: "user"
        }
      }
    });
    if (signUpError) {
      console.error("signUpError", signUpError);
      throw signUpError;
    }
    res.json({ success: true, user: authData.user });
  } catch (e) {
    res.status(400).json({ detail: e.message || "Error signing up" });
  }
});
router.post("/login", async (req, res) => {
  try {
    const data = LoginSchema.parse(req.body);
    const { data: authData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });
    if (signInError || !authData.session) {
      console.error("signInError", signInError);
      return res.status(401).json({ detail: "\u17A2\u17BB\u17B8\u1798\u17C2\u179B \u17AC\u1796\u17B6\u1780\u17D2\u1799\u179F\u1798\u17D2\u1784\u17B6\u178F\u17CB\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u1791\u17C1" });
    }
    const { data: profile } = await supabaseAdmin.from("profiles").select("*").eq("id", authData.user.id).single();
    res.json({
      access_token: authData.session.access_token,
      token_type: "bearer",
      user: profile || authData.user
    });
  } catch (e) {
    res.status(400).json({ detail: e.message || "Error logging in" });
  }
});
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ detail: "Unauthorized" });
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ detail: "Unauthorized: Token expired or invalid" });
    }
    const { data: profile, error: profileError } = await supabaseAdmin.from("profiles").select("*").eq("id", user.id).single();
    if (profileError) {
      console.error("Profile fetch error:", profileError);
    }
    res.json(profile || { id: user.id, email: user.email, role: "user" });
  } catch (e) {
    console.error("GET /me error:", e);
    res.status(401).json({ detail: e.message || "Unauthorized" });
  }
});
var routes_default = router;

// server/routers/financial.ts
var import_express2 = require("express");

// server/auth/dependencies.ts
var requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ detail: "Missing or invalid token" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ detail: "Token expired or invalid" });
    }
    const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single();
    req.user = {
      ...user,
      role: profile?.role || user.user_metadata?.role || "user"
    };
    next();
  } catch (err) {
    return res.status(401).json({ detail: "Token expired or invalid" });
  }
};
var requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ detail: "\u17A2\u17D2\u1793\u1780\u1798\u17B7\u1793\u1798\u17B6\u1793\u179F\u17B7\u1791\u17D2\u1792\u17B7\u17A2\u1793\u17BB\u179C\u178F\u17D2\u178F\u179F\u1780\u1798\u17D2\u1798\u1797\u17B6\u1796\u1793\u17C1\u17C7\u1791\u17C1" });
  }
  next();
};

// server/routers/financial.ts
var router2 = (0, import_express2.Router)();
router2.get("/seil-periods", async (req, res) => {
  const { data, error } = await supabaseAdmin.from("seil_periods").select("*").order("created_at", { ascending: false });
  if (error) return res.status(400).json({ detail: error.message });
  res.json(data);
});
router2.post("/seil-periods", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("seil_periods").insert([req.body]).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: "\u1798\u17B6\u1793\u1794\u1789\u17D2\u17A0\u17B6\u1780\u17D2\u1793\u17BB\u1784\u1780\u17B6\u179A\u179A\u1780\u17D2\u179F\u17B6\u1791\u17BB\u1780\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799 (RLS) \u179F\u17BC\u1798\u1796\u17B7\u1793\u17B7\u178F\u17D2\u1799\u1798\u17BE\u179B Service Role Key" });
  res.json(data[0]);
});
router2.put("/seil-periods/:id", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("seil_periods").update(req.body).eq("id", req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: "\u1798\u17B6\u1793\u1794\u1789\u17D2\u17A0\u17B6\u1780\u17D2\u1793\u17BB\u1784\u1780\u17B6\u179A\u179A\u1780\u17D2\u179F\u17B6\u1791\u17BB\u1780\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799 (RLS) \u179F\u17BC\u1798\u1796\u17B7\u1793\u17B7\u178F\u17D2\u1799\u1798\u17BE\u179B Service Role Key" });
  res.json(data[0]);
});
router2.get("/financial-records", async (req, res) => {
  const seil_id = req.query.seil_id;
  let query = supabaseAdmin.from("financial_records").select("*").order("created_at", { ascending: false });
  if (seil_id) query = query.eq("seil_id", seil_id);
  const { data, error } = await query;
  if (error) return res.status(400).json({ detail: error.message });
  res.json(data);
});
router2.post("/financial-records", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("financial_records").insert([req.body]).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: "\u1798\u17B6\u1793\u1794\u1789\u17D2\u17A0\u17B6\u1780\u17D2\u1793\u17BB\u1784\u1780\u17B6\u179A\u179A\u1780\u17D2\u179F\u17B6\u1791\u17BB\u1780\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799 (RLS) \u179F\u17BC\u1798\u1796\u17B7\u1793\u17B7\u178F\u17D2\u1799\u1798\u17BE\u179B Service Role Key" });
  res.json(data[0]);
});
router2.put("/financial-records/:id", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("financial_records").update(req.body).eq("id", req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: "\u1798\u17B6\u1793\u1794\u1789\u17D2\u17A0\u17B6\u1780\u17D2\u1793\u17BB\u1784\u1780\u17B6\u179A\u179A\u1780\u17D2\u179F\u17B6\u1791\u17BB\u1780\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799 (RLS) \u179F\u17BC\u1798\u1796\u17B7\u1793\u17B7\u178F\u17D2\u1799\u1798\u17BE\u179B Service Role Key" });
  res.json(data[0]);
});
router2.delete("/financial-records/:id", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("financial_records").delete().eq("id", req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: "\u1798\u17B6\u1793\u1794\u1789\u17D2\u17A0\u17B6\u1780\u17D2\u1793\u17BB\u1784\u1780\u17B6\u179A\u179A\u1780\u17D2\u179F\u17B6\u1791\u17BB\u1780\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799 (RLS) \u179F\u17BC\u1798\u1796\u17B7\u1793\u17B7\u178F\u17D2\u1799\u1798\u17BE\u179B Service Role Key" });
  res.json({ success: true });
});
var financial_default = router2;

// server/routers/name_lists.ts
var import_express3 = require("express");
var router3 = (0, import_express3.Router)();
router3.get("/categories", async (req, res) => {
  const { data, error } = await supabaseAdmin.from("name_list_categories").select("*").order("created_at", { ascending: false });
  if (error) return res.status(400).json({ detail: error.message });
  res.json(data);
});
router3.post("/categories", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("name_list_categories").insert([req.body]).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: "\u1798\u17B7\u1793\u17A2\u17B6\u1785\u1780\u17C2\u1794\u17D2\u179A\u17C2\u1794\u17B6\u1793\u1791\u17C1 (RLS)" });
  res.json(data[0]);
});
router3.put("/categories/:id", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("name_list_categories").update(req.body).eq("id", req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: "\u1798\u17B7\u1793\u17A2\u17B6\u1785\u1780\u17C2\u1794\u17D2\u179A\u17C2\u1794\u17B6\u1793\u1791\u17C1 (RLS)" });
  res.json(data[0]);
});
router3.delete("/categories/:id", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("name_list_categories").delete().eq("id", req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: "\u1798\u17B7\u1793\u17A2\u17B6\u1785\u1780\u17C2\u1794\u17D2\u179A\u17C2\u1794\u17B6\u1793\u1791\u17C1 (RLS)" });
  res.json({ success: true });
});
router3.get("/records", async (req, res) => {
  const category_id = req.query.category_id;
  let query = supabaseAdmin.from("name_list_records").select("*").order("created_at", { ascending: false });
  if (category_id) query = query.eq("category_id", category_id);
  const { data, error } = await query;
  if (error) return res.status(400).json({ detail: error.message });
  res.json(data);
});
router3.post("/records", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("name_list_records").insert([req.body]).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: "\u1798\u17B7\u1793\u17A2\u17B6\u1785\u1780\u17C2\u1794\u17D2\u179A\u17C2\u1794\u17B6\u1793\u1791\u17C1 (RLS)" });
  res.json(data[0]);
});
router3.put("/records/:id", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("name_list_records").update(req.body).eq("id", req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: "\u1798\u17B7\u1793\u17A2\u17B6\u1785\u1780\u17C2\u1794\u17D2\u179A\u17C2\u1794\u17B6\u1793\u1791\u17C1 (RLS)" });
  res.json(data[0]);
});
router3.delete("/records/:id", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("name_list_records").delete().eq("id", req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: "\u1798\u17B7\u1793\u17A2\u17B6\u1785\u1780\u17C2\u1794\u17D2\u179A\u17C2\u1794\u17B6\u1793\u1791\u17C1 (RLS)" });
  res.json({ success: true });
});
var name_lists_default = router3;

// server/routers/profiles.ts
var import_express4 = require("express");
var router4 = (0, import_express4.Router)();
router4.get("/me", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("profiles").select("id, email, full_name, phone_number, role, avatar_url, created_at").eq("id", req.user.id).maybeSingle();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data) {
    return res.json({
      id: req.user.id,
      email: req.user.email,
      full_name: req.user.user_metadata?.full_name || "",
      phone_number: req.user.user_metadata?.phone_number || "",
      role: req.user.role || "user",
      avatar_url: null
    });
  }
  res.json(data);
});
router4.put("/me", requireAuth, async (req, res) => {
  const updates = { ...req.body };
  if (updates.password) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
      password: updates.password
    });
    if (authError) return res.status(400).json({ detail: authError.message });
    delete updates.password;
  }
  const { data, error } = await supabaseAdmin.from("profiles").upsert({ id: req.user.id, email: req.user.email, ...updates }).select("id, email, full_name, phone_number, role, avatar_url, created_at").single();
  if (error) return res.status(400).json({ detail: error.message });
  if (updates.full_name) {
    await supabaseAdmin.from("posts").update({ author_name: updates.full_name }).eq("author_id", req.user.id);
  }
  res.json(data);
});
var profiles_default = router4;

// server/routers/storage.ts
var import_express5 = require("express");
var import_multer = __toESM(require("multer"), 1);
var router5 = (0, import_express5.Router)();
var upload = (0, import_multer.default)({ storage: import_multer.default.memoryStorage() });
async function uploadToStorage(bucket, path2, fileBuffer, mimetype) {
  const { data, error } = await supabaseAdmin.storage.from(bucket).upload(path2, fileBuffer, { contentType: mimetype, upsert: true });
  if (error) throw error;
  const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path2);
  return publicUrlData.publicUrl;
}
router5.post("/avatar", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ detail: "No file uploaded" });
    const ext = req.file.originalname.split(".").pop();
    const fileName = `${req.user.id}_${Date.now()}.${ext}`;
    const publicUrl = await uploadToStorage("avatars", fileName, req.file.buffer, req.file.mimetype);
    await supabaseAdmin.from("profiles").update({ avatar_url: publicUrl }).eq("id", req.user.id);
    res.json({ publicUrl });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});
router5.post("/post-images", requireAuth, requireAdmin, upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ detail: "No files uploaded" });
    }
    const urls = [];
    for (const file of req.files) {
      const ext = file.originalname.split(".").pop();
      const fileName = `post_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const publicUrl = await uploadToStorage("post_images", fileName, file.buffer, file.mimetype);
      urls.push(publicUrl);
    }
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});
var storage_default = router5;

// server.ts
async function startServer() {
  const app = (0, import_express6.default)();
  const PORT = parseInt(process.env.SERVER_PORT || process.env.PORT || "3000", 10);
  app.use((0, import_cors.default)({
    origin: "*",
    // នៅលើ Production អ្នកគួរដូរទៅជា URL របស់ Netlify ជំនួស '*'
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
  app.use(import_express6.default.json());
  app.use("/api/auth", routes_default);
  app.use("/api", financial_default);
  app.use("/api/name-lists", name_lists_default);
  app.use("/api/profiles", profiles_default);
  app.use("/api/upload", storage_default);
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express6.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express Backend + Vite Frontend is running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
