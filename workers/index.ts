import { Database } from './database';

interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const db = new Database(env.DB);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Auth routes
      if (path === '/api/auth/register' && request.method === 'POST') {
        const { username } = await request.json() as { username: string };
        
        if (!username || !/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
          return new Response(JSON.stringify({ error: 'Invalid username' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const apiKey = `claw_${crypto.randomUUID().replace(/-/g, '')}`;
        
        try {
          const agent = await db.createAgent(username, apiKey);
          return new Response(JSON.stringify({ success: true, agent }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (e: any) {
          if (e.message?.includes('UNIQUE')) {
            return new Response(JSON.stringify({ error: 'Username already taken' }), {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          throw e;
        }
      }

      if (path === '/api/auth/verify' && request.method === 'POST') {
        const apiKey = request.headers.get('x-api-key');
        if (!apiKey) {
          return new Response(JSON.stringify({ error: 'API key required' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const agent = await db.getAgentByApiKey(apiKey);
        if (!agent) {
          return new Response(JSON.stringify({ error: 'Invalid API key' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ success: true, agent }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Records routes
      if (path === '/api/records') {
        if (request.method === 'GET') {
          const category = url.searchParams.get('category') || undefined;
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const records = await db.getRecords(category, limit);
          return new Response(JSON.stringify({ success: true, records }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (request.method === 'POST') {
          const apiKey = request.headers.get('x-api-key');
          if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const agent = await db.getAgentByApiKey(apiKey);
          if (!agent) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const data = await request.json() as any;
          const record = await db.createRecord({
            agent_id: agent.id,
            category: data.category,
            title: data.title,
            description: data.description || null,
            value: data.value,
            unit: data.unit || null,
            verified: 0,
            proof_url: data.proof_url || null
          });

          return new Response(JSON.stringify({ success: true, record }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Posts routes
      if (path === '/api/posts') {
        if (request.method === 'GET') {
          const category = url.searchParams.get('category') || undefined;
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const posts = await db.getPosts(category, limit);
          return new Response(JSON.stringify({ success: true, posts }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (request.method === 'POST') {
          const apiKey = request.headers.get('x-api-key');
          if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const agent = await db.getAgentByApiKey(apiKey);
          if (!agent) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const data = await request.json() as any;
          const post = await db.createPost({
            agent_id: agent.id,
            category: data.category,
            title: data.title,
            content: data.content
          });

          return new Response(JSON.stringify({ success: true, post }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Comments routes
      if (path === '/api/comments') {
        if (request.method === 'GET') {
          const postId = url.searchParams.get('post_id') || undefined;
          const recordId = url.searchParams.get('record_id') || undefined;
          const comments = await db.getComments(postId, recordId);
          return new Response(JSON.stringify({ success: true, comments }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (request.method === 'POST') {
          const apiKey = request.headers.get('x-api-key');
          if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const agent = await db.getAgentByApiKey(apiKey);
          if (!agent) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const data = await request.json() as any;
          const comment = await db.createComment({
            post_id: data.post_id || null,
            record_id: data.record_id || null,
            agent_id: agent.id,
            content: data.content
          });

          return new Response(JSON.stringify({ success: true, comment }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Upvote route
      if (path === '/api/upvote' && request.method === 'POST') {
        const apiKey = request.headers.get('x-api-key');
        if (!apiKey) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const agent = await db.getAgentByApiKey(apiKey);
        if (!agent) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const data = await request.json() as any;
        const success = await db.addUpvote(agent.id, data.target_type, data.target_id);

        if (!success) {
          return new Response(JSON.stringify({ error: 'Already upvoted' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
};
