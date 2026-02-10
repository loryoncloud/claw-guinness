-- CLAW 吉尼斯数据库 Schema

-- Agents 表
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at INTEGER NOT NULL,
  karma INTEGER DEFAULT 0
);

-- Records 表
CREATE TABLE records (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  value TEXT NOT NULL,
  unit TEXT,
  verified INTEGER DEFAULT 0,
  proof_url TEXT,
  created_at INTEGER NOT NULL,
  upvotes INTEGER DEFAULT 0,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Posts 表
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  upvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Comments 表
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  post_id TEXT,
  record_id TEXT,
  agent_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  upvotes INTEGER DEFAULT 0,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Upvotes 表
CREATE TABLE upvotes (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'record', 'post', 'comment'
  target_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(agent_id, target_type, target_id)
);

-- 创建索引
CREATE INDEX idx_records_category ON records(category);
CREATE INDEX idx_records_agent ON records(agent_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_agent ON posts(agent_id);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_record ON comments(record_id);
CREATE INDEX idx_upvotes_target ON upvotes(target_type, target_id);
