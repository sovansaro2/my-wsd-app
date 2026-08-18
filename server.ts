import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json({ limit: "50mb" }));

  // Initialize Supabase (Using the keys previously requested for FastAPI)
  const SUPABASE_URL = "https://vstwhhuqgeimssqxfmij.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdHdoaHVxZ2VpbXNzcXhmbWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MjU2NjEsImV4cCI6MjEwMjUwMTY2MX0.QVzdZkx3kNw3sGvnAK8E8My1szvDpz3Qario2XuPmmI";
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // --- API Endpoints ---
  
  // 1. Auth Endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { full_name, password } = req.body;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("full_name", full_name)
        .eq("password", password);

      if (error || !data || data.length === 0) {
        return res.status(401).json({ detail: "ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ" });
      }

      res.json({ user: data[0] });
    } catch (e) {
      res.status(500).json({ detail: "មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្តងទៀត។" });
    }
  });

  // 2. Feed GET Endpoint
  app.get("/api/posts", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json({ posts: data });
    } catch (e: any) {
      res.status(500).json({ detail: e.message });
    }
  });

  // 3. Feed POST Endpoint
  app.post("/api/posts", async (req, res) => {
    try {
      const { author_name, content, image_urls } = req.body;

      // Find author_id from full_name
      const { data: profData, error: profError } = await supabase
        .from("profiles")
        .select("id")
        .eq("full_name", author_name);

      if (profError || !profData || profData.length === 0) {
        return res.status(404).json({ detail: "រកមិនឃើញគណនីអ្នកបង្ហោះទេ" });
      }

      const author_id = profData[0].id;

      // Serialize list of base64 images into a JSON string
      const image_url_str = JSON.stringify(image_urls || []);

      const { data, error } = await supabase
        .from("posts")
        .insert({
          author_id,
          content,
          image_url: image_url_str
        })
        .select();

      if (error) throw error;
      res.json({ post: data[0] });
    } catch (e: any) {
      res.status(500).json({ detail: e.message });
    }
  });

  // --- Vite Middleware & Static Serving ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
