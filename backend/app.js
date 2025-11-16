const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Server } = require("@hocuspocus/server");
const { Database } = require("@hocuspocus/extension-database");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret-change-me"
    );
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

// db connection
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@db:5432/collabspace",
});

app.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ ok: false, error: "Name, email and password are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ ok: false, error: "Please enter a valid email address" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ ok: false, error: "Password must be at least 6 characters" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email
      `,
      [name, email, passwordHash]
    );

    const user = rows[0];

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET || "dev-secret-change-me",
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        ok: false,
        error: "An account with this email already exists",
      });
    }

    console.error("Register error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res
      .status(400)
      .json({ ok: false, error: "Email and password are required" });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT id,
             name,
             email,
             password_hash
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [email]
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ ok: false, error: "Invalid email or password" });
    }

    const user = rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res
        .status(401)
        .json({ ok: false, error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET || "dev-secret-change-me",
      { expiresIn: "7d" }
    );

    res.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

app.post("/groups/create", auth, async (req, res) => {
  const { name, description, code } = req.body;
  const userId = req.user.sub;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const groupResult = await pool.query(
      "INSERT INTO STUDY_GROUPS (NAME, DESCRIPTION, CODE) VALUES ($1, $2, $3) RETURNING *",
      [name, description, code]
    );
    const group = groupResult.rows[0];

    await pool.query(
      "INSERT INTO USER_GROUPS (USER_ID, GROUP_ID, ROLE) VALUES ($1, $2, $3)",
      [userId, group.id, "admin"]
    );
    res.status(201).json({
      message: "Group created successfully",
      group,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// get all my groups
app.get("/groups/my", auth, async (req, res) => {
  const userId = req.user.sub;

  try {
    const result = await pool.query(
      `SELECT g.*
       FROM STUDY_GROUPS g
       JOIN USER_GROUPS ug ON g.id = ug.group_id
       WHERE ug.user_id = $1`,
      [userId]
    );

    res.json({ groups: result.rows });
  } catch (error) {
    console.error("Error fetching user groups:", error);
    res.status(500).json({ error: "Failed to fetch user groups" });
  }
});

app.post("/groups/join", auth, async (req, res) => {
  const { groupCode } = req.body;
  const userId = req.user.sub;

  if (!groupCode) {
    return res.status(400).json({ error: "groupCode is required" });
  }

  try {
    const groupResult = await pool.query(
      "SELECT * FROM STUDY_GROUPS WHERE CODE = $1",
      [groupCode]
    );
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    const group = groupResult.rows[0];

    const userGroupResult = await pool.query(
      "SELECT * FROM USER_GROUPS WHERE USER_ID = $1 AND GROUP_ID = $2",
      [userId, group.id]
    );
    if (userGroupResult.rows.length > 0) {
      return res.status(400).json({ error: "User already in group" });
    }

    await pool.query(
      "INSERT INTO USER_GROUPS (USER_ID, GROUP_ID, ROLE) VALUES ($1, $2, $3)",
      [userId, group.id, "member"]
    );

    res.status(200).json({
      message: "Joined group successfully",
      group,
    });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: err.message });
  }
});

// post study group's text doc
app.post("/groups/:groupId/textdocs", async (req, res) => {
  const { name } = req.body;
  const { groupId } = req.params;

  if (!name) {
    return res.status(400).json({ error: "Document name is required" });
  }

  try {
    const { rows } = await pool.query(
      "INSERT INTO TEXT_DOCS (name, group_id) VALUES ($1, $2) RETURNING id, name, group_id",
      [name, groupId]
    );
    
    //Return new document
    res.status(201).json(rows[0]);

  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: "A document with this name already exists in this study group" });
    }
    console.error("Error creating document:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// get ALL documents for study group
app.get("/groups/:groupId/textdocs", async (req, res) => {
  const { groupId } = req.params;
  try {
    const { rows } = await pool.query(
      "SELECT id, name FROM TEXT_DOCS WHERE group_id = $1",
      [groupId]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.send(`Backend is running! DB time: ${result.rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database connection error");
  }
});

const COLLAB_PORT = process.env.COLLAB_PORT || 6001;

const hocuspocusServer = new Server({
  name: "collabspace-server",
  port: COLLAB_PORT,
  extensions: [
    new Database({
      //Fetch and return doc when user joins
      fetch: async ({ documentName }) => {
        const docId = parseInt(documentName, 10);
        if (isNaN(docId)) {
          return null;
        }

        try {
          const { rows } = await pool.query(
            "SELECT data FROM TEXT_DOCS WHERE id = $1",
            [docId]
          );

          //Return data if found, otherwise returns null
          return rows.length > 0 ? rows[0].data : null;

        } catch (err) {
          console.error("Error fetching document:", err);
          return null;
        }
      },
      
      //Save document - autosave
      store: async ({ documentName, state }) => {
        const docId = parseInt(documentName, 10);
        if (isNaN(docId)) {
          return;
        }

        try {
          //Update DB with document data
          await pool.query(
            "UPDATE TEXT_DOCS SET data = $1 WHERE id = $2",
            [state, docId]
          );
        } catch (err) {
          console.error("Error storing document:", err);
        }
      },
    }),
  ],
});

const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, 
});

const s3 = new S3Client({
  region: "tor1", 
  endpoint: process.env.SPACES_ENDPOINT || "https://tor1.digitaloceanspaces.com",
  forcePathStyle: false,
  credentials: {
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET,
  },
});

app.post("/files/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "No file uploaded" });
    }

    const groupCode = req.body.groupCode || "general";

    const key = `${groupCode}/${Date.now()}-${req.file.originalname}`;

    const putCmd = new PutObjectCommand({
      Bucket: process.env.SPACES_BUCKET || "collabspace",
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: "private", 
    });

    await s3.send(putCmd);

    return res.json({
      ok: true,
      message: "File uploaded",
      key,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ ok: false, error: "Upload failed" });
  }
});


hocuspocusServer.listen();
console.log(`Hocuspocus collaboration server running on port ${COLLAB_PORT}`);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
