import bcrypt from "bcryptjs";
import cors from "cors";
import dns from "node:dns";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, ".env") });

const app = express();
const PORT = Number(process.env.PORT || 5000);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const CLIENT_URLS = (process.env.CLIENT_URLS || CLIENT_URL)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_32_chars_minimum__";
const MONGO_URI = process.env.MONGO_URI;
const MONGO_URI_DIRECT = process.env.MONGO_URI_DIRECT;
const MONGO_DNS_SERVERS = process.env.MONGO_DNS_SERVERS || "8.8.8.8,1.1.1.1";

if (JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be at least 32 characters.");
  process.exit(1);
}

const dnsServers = MONGO_DNS_SERVERS.split(",").map((server) => server.trim()).filter(Boolean);
if (dnsServers.length > 0) {
  try {
    dns.setServers(dnsServers);
  } catch {
    // keep system DNS if custom DNS cannot be applied
  }
}

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      let hostname = "";
      try {
        hostname = new URL(origin).hostname;
      } catch {
        return callback(new Error(`CORS blocked origin: ${origin}`));
      }

      const isAllowedExact = CLIENT_URLS.includes(origin);
      const isVercelPreview = hostname.endsWith(".vercel.app");

      if (isAllowedExact || isVercelPreview) return callback(null, true);
      return callback(new Error(`CORS blocked origin: ${origin}`));
    }
  })
);
app.use(express.json());
app.use(mongoSanitize());

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ["admin", "seller", "customer"], default: "customer" },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date }
  },
  { timestamps: true, versionKey: false }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model("User", userSchema);

let useMemoryStore = false;
let memoryUsers = [];

function safeUser(user) {
  return {
    id: user._id ? String(user._id) : String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  };
}

function signToken(user) {
  return jwt.sign(
    {
      userId: user._id ? String(user._id) : String(user.id),
      name: user.name,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "1h", issuer: "your-app-name" }
  );
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") return res.status(401).json({ message: "Token expired" });
    return res.status(401).json({ message: "Invalid token" });
  }
}

function checkRole(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }
    return next();
  };
}

async function seedUsers() {
  if (useMemoryStore) {
    if (memoryUsers.length > 0) return;
    memoryUsers = [
      {
        id: "1",
        name: "Admin Prime",
        email: "admin@amazonclone.com",
        password: await bcrypt.hash("Admin1234", 12),
        role: "admin",
        isActive: true
      },
      {
        id: "2",
        name: "Seller Hub",
        email: "seller@amazonclone.com",
        password: await bcrypt.hash("Seller1234", 12),
        role: "seller",
        isActive: true
      },
      {
        id: "3",
        name: "Customer One",
        email: "customer@amazonclone.com",
        password: await bcrypt.hash("Customer1234", 12),
        role: "customer",
        isActive: true
      }
    ];
    return;
  }

  const count = await User.countDocuments();
  if (count > 0) return;
  await User.create([
    {
      name: "Admin Prime",
      email: "admin@amazonclone.com",
      password: "Admin1234",
      role: "admin"
    },
    {
      name: "Seller Hub",
      email: "seller@amazonclone.com",
      password: "Seller1234",
      role: "seller"
    },
    {
      name: "Customer One",
      email: "customer@amazonclone.com",
      password: "Customer1234",
      role: "customer"
    }
  ]);
}

async function getUserByEmail(email) {
  const normalized = String(email).toLowerCase();
  if (useMemoryStore) return memoryUsers.find((u) => u.email === normalized) || null;
  return User.findOne({ email: normalized });
}

async function getUserById(id) {
  if (useMemoryStore) return memoryUsers.find((u) => String(u.id) === String(id)) || null;
  return User.findById(id);
}

async function listUsers() {
  if (useMemoryStore) return memoryUsers;
  return User.find().sort({ createdAt: -1 });
}

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role = "customer" } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }
    if (!["admin", "seller", "customer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role supplied." });
    }
    const existing = await getUserByEmail(email);
    if (existing) return res.status(409).json({ message: "Email already exists." });

    if (useMemoryStore) {
      memoryUsers.push({
        id: String(memoryUsers.length + 1),
        name: String(name).trim(),
        email: String(email).toLowerCase(),
        password: await bcrypt.hash(password, 12),
        role,
        isActive: true
      });
      return res.status(201).json({ message: "User created." });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase(),
      password,
      role,
      isActive: true
    });
    return res.status(201).json({ message: "User created.", userId: user._id });
  } catch (error) {
    console.error("Register error:", error);
    if (error.code === 11000) return res.status(409).json({ message: "Email already exists." });
    return res.status(500).json({ message: "Failed to register user." });
  }
});

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(401).json({ message: "Invalid email or password." });

    const user = await getUserByEmail(email);
    if (!user || !user.isActive) return res.status(401).json({ message: "Invalid email or password." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid email or password." });

    if (!useMemoryStore) await User.updateOne({ _id: user._id }, { lastLogin: new Date() });

    const token = signToken(user);
    return res.json({ token, user: safeUser(user) });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login failed." });
  }
});

app.get("/api/auth/me", verifyToken, async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json({ user: safeUser(user) });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ message: "Failed to fetch user." });
  }
});

app.get("/api/admin/users", verifyToken, checkRole(["admin"]), async (_req, res) => {
  try {
    const users = await listUsers();
    return res.json({ users: users.map(safeUser) });
  } catch (error) {
    console.error("List users error:", error);
    return res.status(500).json({ message: "Failed to fetch users." });
  }
});

app.patch("/api/admin/users/:id/role", verifyToken, checkRole(["admin"]), async (req, res) => {
  const { role } = req.body || {};
  if (!["admin", "seller", "customer"].includes(role)) {
    return res.status(400).json({ message: "Invalid role." });
  }

  if (useMemoryStore) {
    const user = memoryUsers.find((u) => String(u.id) === String(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found." });
    user.role = role;
    return res.json({ message: "Role updated.", user: safeUser(user) });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found." });
  return res.json({ message: "Role updated.", user: safeUser(user) });
});

app.patch("/api/admin/users/:id/deactivate", verifyToken, checkRole(["admin"]), async (req, res) => {
  const { isActive } = req.body || {};
  const nextStatus = typeof isActive === "boolean" ? isActive : false;

  if (useMemoryStore) {
    const user = memoryUsers.find((u) => String(u.id) === String(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found." });
    user.isActive = nextStatus;
    return res.json({
      message: nextStatus ? "User activated." : "User deactivated.",
      user: safeUser(user)
    });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { isActive: nextStatus }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found." });
  return res.json({
    message: nextStatus ? "User activated." : "User deactivated.",
    user: safeUser(user)
  });
});

app.delete("/api/admin/users/:id", verifyToken, checkRole(["admin"]), async (req, res) => {
  if (useMemoryStore) {
    const index = memoryUsers.findIndex((u) => String(u.id) === String(req.params.id));
    if (index === -1) return res.status(404).json({ message: "User not found." });
    memoryUsers.splice(index, 1);
    return res.json({ message: "User deleted." });
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found." });
  return res.json({ message: "User deleted." });
});

app.use((_req, res) => res.status(404).json({ message: "Route not found." }));

async function start() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      family: 4
    });
    console.log("MongoDB connected with SRV URI.");
  } catch (error) {
    const isSrvDnsBlocked =
      error?.message?.includes("querySrv ECONNREFUSED") ||
      error?.message?.includes("querySrv ENOTFOUND");

    if (isSrvDnsBlocked && MONGO_URI_DIRECT) {
      try {
        await mongoose.connect(MONGO_URI_DIRECT, {
          serverSelectionTimeoutMS: 5000,
          family: 4
        });
        console.log("MongoDB connected with direct URI fallback.");
      } catch (directError) {
        useMemoryStore = true;
        console.warn(
          `MongoDB unavailable (${directError.message}). Using in-memory store.`
        );
      }
    } else {
      useMemoryStore = true;
      console.warn(`MongoDB unavailable (${error.message}). Using in-memory store.`);
    }
  }
  await seedUsers();
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      const fallbackPort = PORT + 1;
      app.listen(fallbackPort, () => {
        console.warn(
          `Port ${PORT} is busy. Server started on http://localhost:${fallbackPort}`
        );
      });
      return;
    }
    throw error;
  });
}

start();
