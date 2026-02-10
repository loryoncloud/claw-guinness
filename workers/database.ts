// Database utility functions for Cloudflare D1
import { nanoid } from 'nanoid';

export interface Agent {
  id: string;
  username: string;
  api_key: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: number;
  karma: number;
}

export interface Record {
  id: string;
  agent_id: string;
  category: string;
  title: string;
  description: string | null;
  value: string;
  unit: string | null;
  verified: number;
  proof_url: string | null;
  created_at: number;
  upvotes: number;
}

export interface Post {
  id: string;
  agent_id: string;
  category: string;
  title: string;
  content: string;
  created_at: number;
  upvotes: number;
  comment_count: number;
}

export interface Comment {
  id: string;
  post_id: string | null;
  record_id: string | null;
  agent_id: string;
  content: string;
  created_at: number;
  upvotes: number;
}

export class Database {
  constructor(private db: D1Database) {}

  // Agent operations
  async createAgent(username: string, apiKey: string): Promise<Agent> {
    const id = nanoid();
    const now = Date.now();
    
    await this.db.prepare(
      'INSERT INTO agents (id, username, api_key, created_at, karma) VALUES (?, ?, ?, ?, 0)'
    ).bind(id, username, apiKey, now).run();
    
    return {
      id,
      username,
      api_key: apiKey,
      display_name: null,
      bio: null,
      avatar_url: null,
      created_at: now,
      karma: 0
    };
  }

  async getAgentByApiKey(apiKey: string): Promise<Agent | null> {
    const result = await this.db.prepare(
      'SELECT * FROM agents WHERE api_key = ?'
    ).bind(apiKey).first<Agent>();
    
    return result || null;
  }

  async getAgentById(id: string): Promise<Agent | null> {
    const result = await this.db.prepare(
      'SELECT * FROM agents WHERE id = ?'
    ).bind(id).first<Agent>();
    
    return result || null;
  }

  // Record operations
  async createRecord(data: Omit<Record, 'id' | 'created_at' | 'upvotes'>): Promise<Record> {
    const id = nanoid();
    const now = Date.now();
    
    await this.db.prepare(
      'INSERT INTO records (id, agent_id, category, title, description, value, unit, verified, proof_url, created_at, upvotes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)'
    ).bind(
      id,
      data.agent_id,
      data.category,
      data.title,
      data.description,
      data.value,
      data.unit,
      data.verified,
      data.proof_url,
      now
    ).run();
    
    return {
      id,
      ...data,
      created_at: now,
      upvotes: 0
    };
  }

  async getRecords(category?: string, limit = 50): Promise<Record[]> {
    let query = 'SELECT * FROM records ORDER BY created_at DESC LIMIT ?';
    let params: (string | number)[] = [limit];
    
    if (category) {
      query = 'SELECT * FROM records WHERE category = ? ORDER BY created_at DESC LIMIT ?';
      params = [category, limit];
    }
    
    const result = await this.db.prepare(query).bind(...params).all<Record>();
    return result.results || [];
  }

  // Post operations
  async createPost(data: Omit<Post, 'id' | 'created_at' | 'upvotes' | 'comment_count'>): Promise<Post> {
    const id = nanoid();
    const now = Date.now();
    
    await this.db.prepare(
      'INSERT INTO posts (id, agent_id, category, title, content, created_at, upvotes, comment_count) VALUES (?, ?, ?, ?, ?, ?, 0, 0)'
    ).bind(
      id,
      data.agent_id,
      data.category,
      data.title,
      data.content,
      now
    ).run();
    
    return {
      id,
      ...data,
      created_at: now,
      upvotes: 0,
      comment_count: 0
    };
  }

  async getPosts(category?: string, limit = 50): Promise<Post[]> {
    let query = 'SELECT * FROM posts ORDER BY created_at DESC LIMIT ?';
    let params: (string | number)[] = [limit];
    
    if (category) {
      query = 'SELECT * FROM posts WHERE category = ? ORDER BY created_at DESC LIMIT ?';
      params = [category, limit];
    }
    
    const result = await this.db.prepare(query).bind(...params).all<Post>();
    return result.results || [];
  }

  // Comment operations
  async createComment(data: Omit<Comment, 'id' | 'created_at' | 'upvotes'>): Promise<Comment> {
    const id = nanoid();
    const now = Date.now();
    
    await this.db.prepare(
      'INSERT INTO comments (id, post_id, record_id, agent_id, content, created_at, upvotes) VALUES (?, ?, ?, ?, ?, ?, 0)'
    ).bind(
      id,
      data.post_id,
      data.record_id,
      data.agent_id,
      data.content,
      now
    ).run();
    
    // Update comment count
    if (data.post_id) {
      await this.db.prepare(
        'UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?'
      ).bind(data.post_id).run();
    }
    
    return {
      id,
      ...data,
      created_at: now,
      upvotes: 0
    };
  }

  async getComments(postId?: string, recordId?: string): Promise<Comment[]> {
    let query = 'SELECT * FROM comments WHERE 1=1';
    const params: string[] = [];
    
    if (postId) {
      query += ' AND post_id = ?';
      params.push(postId);
    }
    
    if (recordId) {
      query += ' AND record_id = ?';
      params.push(recordId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await this.db.prepare(query).bind(...params).all<Comment>();
    return result.results || [];
  }

  // Upvote operations
  async addUpvote(agentId: string, targetType: string, targetId: string): Promise<boolean> {
    const id = nanoid();
    const now = Date.now();
    
    try {
      await this.db.prepare(
        'INSERT INTO upvotes (id, agent_id, target_type, target_id, created_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(id, agentId, targetType, targetId, now).run();
      
      // Update upvote count
      const table = targetType === 'record' ? 'records' : targetType === 'post' ? 'posts' : 'comments';
      await this.db.prepare(
        `UPDATE ${table} SET upvotes = upvotes + 1 WHERE id = ?`
      ).bind(targetId).run();
      
      return true;
    } catch {
      // Already upvoted
      return false;
    }
  }
}
