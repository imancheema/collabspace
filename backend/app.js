const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@db:5432/collabspace",
});

// create a new group
app.post("/groups/create", async (req, res) => {
  const { name, description, userId, code } = req.body;

  if (!name || !userId) {
    return res.status(400).json({ error: "Name and userId are required" });
  }

  try {
    // insert task into PostgreSQL (STUDY_GROUPS table) + return row just inserted
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

// join a group
app.post("/groups/join", async (req, res) => {
  const { userId, groupCode } = req.body;

  if (!userId || !groupCode) {
    return res.status(400).json({ error: "userId and groupCode are required" });
  }

  try {
    // find the group through a code
    const groupResult = await pool.query(
      "SELECT * FROM STUDY_GROUPS WHERE CODE = $1",
      [groupCode]
    );
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Could not find group" });
    }
    const group = groupResult.rows[0];

    // check if users already in a group
    const userGroupResult = await pool.query(
      "SELECT * FROM USER_GROUPS WHERE USER_ID = $1 AND GROUP_ID = $2",
      [userId, group.id]
    );
    if (userGroupResult.rows.length > 0) {
      return res.status(400).json({ error: "User already in group" });
    }

    // add user as member in db
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

//testing db connection
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.send(`Backend is running! DB time: ${result.rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database connection error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
