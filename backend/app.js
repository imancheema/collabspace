const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Server } = require("@hocuspocus/server");
const { Database } = require("@hocuspocus/extension-database");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require("multer");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
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
      process.env.JWT_SECRET
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
    process.env.DATABASE_URL,
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
      process.env.JWT_SECRET,
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
      process.env.JWT_SECRET,
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

// Get all members in a group by group code
app.get("/groups/:groupCode/members", auth, async (req, res) => {
  const { groupCode } = req.params;
  const userId = req.user.sub;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const group = await pool.query(
      `SELECT id FROM study_groups WHERE code = $1`,
      [groupCode]
    );

    if (!group.rows.length)
      return res.status(404).json({ error: "Group not found" });

    const groupId = group.rows[0].id;

    const membership = await pool.query(
      `SELECT 1 FROM user_groups WHERE user_id = $1 AND group_id = $2`,
      [userId, groupId]
    );

    if (!membership.rows.length)
      return res.status(403).json({ error: "You're not in this group" });

    const members = await pool.query(
      `SELECT u.id, u.name, u.email, ug.role
       FROM users u
       JOIN user_groups ug ON u.id = ug.user_id
       WHERE ug.group_id = $1
       ORDER BY ug.role DESC, u.name ASC`,
      [groupId]
    );

    res.json({ members: members.rows });
  } catch (err) {
    console.error("Error fetching group members:", err);
    res.status(500).json({ error: "Error fetching group members" });
  }
});

// leave group
app.post("/groups/:groupCode/leave", auth, async (req, res) => {
  const { groupCode } = req.params;
  const userId = req.user.sub;

  try {
    const group = await pool.query(
      `SELECT id FROM study_groups WHERE code = $1`,
      [groupCode]
    );

    if (!group.rows.length)
      return res.status(404).json({ error: "Couldn't find group" });

    const groupId = group.rows[0].id;

    await pool.query(
      `DELETE FROM user_groups WHERE user_id = $1 AND group_id = $2`,
      [userId, groupId]
    );

    res.json({ message: "Left group successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to leave group" });
  }
});

// delete group
app.delete("/groups/:groupCode", auth, async (req, res) => {
  const { groupCode } = req.params;
  const userId = req.user.sub;

  try {
    const groupRes = await pool.query(
      `SELECT id FROM study_groups WHERE code = $1`,
      [groupCode]
    );
    if (!groupRes.rows.length)
      return res.status(404).json({ error: "Group not found" });

    const groupId = groupRes.rows[0].id;

    const roleRes = await pool.query(
      `SELECT role FROM user_groups WHERE user_id = $1 AND group_id = $2`,
      [userId, groupId]
    );
    if (!roleRes.rows.length)
      return res.status(403).json({ error: "You're not in this group" });

    if (roleRes.rows[0].role !== "admin")
      return res
        .status(403)
        .json({ error: "Only the admin can delete the group" });

    await pool.query(`DELETE FROM user_groups WHERE group_id = $1`, [groupId]);
    await pool.query(`DELETE FROM study_groups WHERE id = $1`, [groupId]);
    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    console.error("Delete group error:", err);
    res.status(500).json({ error: "Failed to delete group" });
  }
});

//-----------------------------------------------------------
// Announcements Endpoints
//-----------------------------------------------------------
// Get all announcements for group
app.get("/groups/:groupCode/announcements", auth, async (req, res) => {
  const { groupCode } = req.params;
  const userId = req.user.sub;

  try {
    //Authorization and group Id retrieval
    const group = await checkGroupMembership(userId, groupCode);
    if (!group) {
      return res.status(403).json({ error: "User not authorized for this group" });
    }
    const groupId = group.id;

    //Get announcements
    const { rows } = await pool.query(
      `
      SELECT a.*, u.name AS user_name
      FROM ANNOUNCEMENTS a
      LEFT JOIN USERS u ON a.user_id = u.id
      WHERE a.group_id = $1
      ORDER BY a.created_at DESC
      `,
      [groupId]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching announcements:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//Create new announcement
app.post("/groups/:groupCode/announcements", auth, async (req, res) => {
  const { groupCode } = req.params;
  const userId = req.user.sub;
  const { task } = req.body;

  if (!task) {
    return res.status(400).json({ error: "Task content is required" });
  }

  try {
    const group = await checkGroupMembership(userId, groupCode);
    if (!group) {
      return res.status(403).json({ error: "User not authorized for this group" });
    }
    const groupId = group.id;

    //Add new announcement
    const { rows } = await pool.query(
      `
      INSERT INTO ANNOUNCEMENTS (TASK, GROUP_ID, USER_ID)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [task, groupId, userId]
    );

    const newAnnouncement = rows[0];

    const userResult = await pool.query("SELECT name FROM USERS WHERE id = $1", [
      newAnnouncement.user_id,
    ]);
    const userName = userResult.rows[0]?.name || null;

    //Return new announcement along with username
    res.status(201).json({ ...newAnnouncement, user_name: userName });
  } catch (err) {
    console.error("Error creating announcement:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//Delete announcement
app.delete("/announcements/:announcementId", auth, async (req, res) => {
  const { announcementId } = req.params;
  const userId = req.user.sub;

  try {
    //Find announcement's group
    const announcementResult = await pool.query(
      "SELECT group_id FROM ANNOUNCEMENTS WHERE id = $1",
      [announcementId]
    );

    if (announcementResult.rows.length === 0) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    const { group_id } = announcementResult.rows[0];

    //User auth check
    const isMember = await checkGroupMembershipById(userId, group_id);
    if (!isMember) {
      return res.status(403).json({ error: "User not authorized to delete this" });
    }

    //If auth, delete
    await pool.query("DELETE FROM ANNOUNCEMENTS WHERE id = $1", [
      announcementId,
    ]);

    res.status(204).send();
  } catch (err) {
    console.error("Error deleting announcement:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//Used for post study group auth
async function checkGroupMembershipById(userId, groupId) {
  const { rows } = await pool.query(
    `SELECT group_id FROM USER_GROUPS WHERE user_id = $1 AND group_id = $2`,
    [userId, groupId]
  );
  return rows.length > 0;
}

// post study group's text doc
app.post("/groups/:groupId/textdocs", auth, async (req, res) => {
  const { name } = req.body;
  const { groupId } = req.params;
  const userId = req.user.sub;

  if (!name) {
    return res.status(400).json({ error: "Document name is required" });
  }

  try {
    //User authorized check
    const isMember = await checkGroupMembershipById(userId, groupId);
    if (!isMember) {
      return res.status(403).json({ error: "User not authorized for this group" });
    }

    const { rows } = await pool.query(
      "INSERT INTO TEXT_DOCS (name, group_id) VALUES ($1, $2) RETURNING id, name, group_id",
      [name, groupId]
    );

    //Return new document
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        error: "A document with this name already exists in this study group",
      });
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

//------------------------------------------
// Text Editor Collaboration WebSocket
//------------------------------------------
const COLLAB_PORT = process.env.COLLAB_PORT || 6001;

const hocuspocusServer = new Server({
  name: "collabspace-server",
  port: COLLAB_PORT,
  //Authenticate users
  async onAuthenticate({ token }) {
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      //Verify JWT from the frontend
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      //Whatever you return here becomes available in 'connection.user'
      return {
        user: decoded,
      };
    } catch (err) {
      throw new Error("Invalid token");
    }
  },
  extensions: [
    new Database({
      //Fetch and return doc when user joins
      fetch: async ({ documentName, context }) => {
        const docId = parseInt(documentName, 10);
        const userId = context.user?.sub;
        
        if (!userId) throw new Error("Unauthorized");

        

        try {
          //Check if document exists and get its group
          const docRes = await pool.query(
            "SELECT group_id FROM TEXT_DOCS WHERE id = $1",
            [docId]
          );

          if (docRes.rows.length === 0) return null;
          const groupId = docRes.rows[0].group_id;

          //Check if user is member of group
          const memberRes = await pool.query(
            "SELECT 1 FROM USER_GROUPS WHERE user_id = $1 AND group_id = $2",
            [userId, groupId]
          );

          if (memberRes.rows.length === 0) {
            //Throw error, trigger frontend
            throw new Error("Unauthorized");
          }

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
          await pool.query("UPDATE TEXT_DOCS SET data = $1 WHERE id = $2", [
            state,
            docId,
          ]);
        } catch (err) {
          console.error("Error storing document:", err);
        }
      },
    }),
  ],
});

//------------------------------------------
// Object Storage Handling
//------------------------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const s3 = new S3Client({
  region: process.env.SPACES_REGION || "tor1",
  endpoint:
    process.env.SPACES_ENDPOINT || "https://tor1.digitaloceanspaces.com",
  forcePathStyle: false,
  credentials: {
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET,
  },
});

//Used for storage auth
//Checks if user is member of study_group
async function checkGroupMembership(userId, groupCode) {
  const { rows } = await pool.query(
    `SELECT g.id FROM STUDY_GROUPS g
     JOIN USER_GROUPS ug ON g.id = ug.group_id
     WHERE ug.user_id = $1 AND g.code = $2`,
    [userId, groupCode]
  ); //Joins both study_group and user_group to create list of groups and their members
  //Retrns group obj
  return rows.length > 0 ? rows[0] : null;
}

app.post("/files/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "No file uploaded" });
    }

    const groupCode = req.body.groupCode || "general";
    const userId = req.user.sub;

    //Checks if user is a member of group
    const group = await checkGroupMembership(userId, groupCode);
    if (!group && groupCode !== "general") {
      return res
        .status(403)
        .json({ ok: false, error: "User not authorized for this group" });
    }

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

app.get("/stats", auth, async (req, res) => {
  try {
    const listCmd = new ListObjectsV2Command({
      Bucket: process.env.SPACES_BUCKET || "collabspace",
    });

    const { Contents } = await s3.send(listCmd);

    let totalFiles = 0;
    let totalBytes = 0;

    if (Contents && Contents.length > 0) {
      Contents.forEach((obj) => {
        if (!obj.Key.endsWith("/")) {
          totalFiles += 1;
          totalBytes += obj.Size || 0;
        }
      });
    }

    return res.json({
      ok: true,
      totalFiles,
      totalBytes,
    });
  } catch (err) {
    console.error("Stats error:", err);
    return res.status(500).json({ ok: false, error: "Failed to load stats" });
  }
});

app.get("/groups/:groupCode/stats", auth, async (req, res) => {
  const { groupCode } = req.params;
  const userId = req.user.sub;

  try {
    const group = await checkGroupMembership(userId, groupCode);
    if (!group) {
      return res
        .status(403)
        .json({ ok: false, error: "User not authorized for this group" });
    }

    const listCmd = new ListObjectsV2Command({
      Bucket: process.env.SPACES_BUCKET || "collabspace",
      Prefix: `${groupCode}/`,
    });

    const { Contents } = await s3.send(listCmd);

    let totalFiles = 0;
    let totalBytes = 0;

    if (Contents && Contents.length > 0) {
      Contents.forEach((obj) => {
        if (!obj.Key.endsWith("/")) {
          totalFiles += 1;
          totalBytes += obj.Size || 0;
        }
      });
    }

    return res.json({
      ok: true,
      totalFiles,
      totalBytes,
    });
  } catch (err) {
    console.error("Group stats error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to load group stats" });
  }
});


//Returns all resources associated with group
//Object storage + Yjs text docs
app.get("/groups/:groupCode/resources", auth, async (req, res) => {
  const { groupCode } = req.params;
  const userId = req.user.sub;

  try {
    //Authorize- check if user is in group
    const group = await checkGroupMembership(userId, groupCode);
    if (!group) {
      return res
        .status(403)
        .json({ ok: false, error: "User not authorized for this group" });
    }
    const groupId = group.id;

    //Async fetch files from object storage
    const getObjFiles = async () => {
      const listCmd = new ListObjectsV2Command({
        Bucket: process.env.SPACES_BUCKET || "collabspace",
        Prefix: `${groupCode}/`, //Bucket sub folder
      });

      const { Contents } = await s3.send(listCmd);

      if (!Contents || Contents.length === 0) {
        return [];
      }

      //Create pre-signed URLs for each file
      return Promise.all(
        Contents
          //Filter out folders
          .filter((file) => !file.Key.endsWith("/"))
          .map(async (file) => {
            const getCmd = new GetObjectCommand({
              Bucket: process.env.SPACES_BUCKET || "collabspace",
              Key: file.Key,
            });

            //Creates URL that expires in 1hr
            const url = await getSignedUrl(s3, getCmd, { expiresIn: 3600 });

            //Full filename -> timestamp-Filename.ext
            const storageName = file.Key.split("/").pop();
            //Remove timestamp
            const fileDisplayName = storageName.includes("-")
              ? storageName.substring(storageName.indexOf("-") + 1)
              : storageName;

            return {
              type: "file",
              key: file.Key,
              name: fileDisplayName,
              size: file.Size,
              lastModified: file.LastModified,
              url: url,
            };
          })
      );
    };

    //Async fetch Yjs docs from Postgres TEXT_DOCS
    const getTextDocs = async () => {
      const { rows } = await pool.query(
        "SELECT id, name FROM TEXT_DOCS WHERE group_id = $1",
        [groupId]
      );

      return rows.map((doc) => ({
        type: "doc",
        key: `doc-${doc.id}`, //Frontend doc identifier
        id: doc.id,
        name: doc.name,
        size: null,
        lastModified: null,
      }));
    };

    //Merge both set of files
    const [objFiles, textDocs] = await Promise.all([
      getObjFiles(),
      getTextDocs(),
    ]);
    const allResources = [...objFiles, ...textDocs];

    //Sort by name
    allResources.sort((a, b) => a.name.localeCompare(b.name));

    //Returns unified file list and groupId for text-editor url
    res.json({ groupId, resources: allResources });
  } catch (err) {
    console.error("Error listing files:", err);
    res.status(500).json({ ok: false, error: "Failed to list files" });
  }
});

hocuspocusServer.listen();
console.log(`Hocuspocus collaboration server running on port ${COLLAB_PORT}`);

const PORT = process.env.EXPRESS_PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
