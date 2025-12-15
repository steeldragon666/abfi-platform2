/**
 * Manus AI Integration Module
 *
 * Provides REST API client for Claude Code ↔ Manus coordination
 * Docs: https://open.manus.ai/
 */

import { z } from 'zod';

// ============================================================================
// Configuration
// ============================================================================

const MANUS_API_URL = process.env.MANUS_API_URL || 'https://api.manus.ai/v1';
const MANUS_API_KEY = process.env.MANUS_API_KEY || '';

// ============================================================================
// Types
// ============================================================================

export interface ManusProject {
  id: string;
  name: string;
  instructions?: string;
  created_at: string;
}

export interface ManusTask {
  id: string;
  project_id?: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting';
  message?: string;
  url?: string;
  created_at: string;
  updated_at: string;
}

export interface ManusFile {
  id: string;
  file_name: string;
  url: string;
  size_bytes: number;
  created_at: string;
}

export interface ManusWebhookEvent {
  event_id: string;
  event_type: 'task_created' | 'task_progress' | 'task_stopped';
  task_id: string;
  task_title?: string;
  task_url?: string;
  message?: string;
  progress_type?: string;
  stop_reason?: 'finish' | 'ask';
  attachments?: Array<{
    file_name: string;
    url: string;
    size_bytes: number;
  }>;
}

// Validation schemas
export const webhookEventSchema = z.object({
  event_id: z.string(),
  event_type: z.enum(['task_created', 'task_progress', 'task_stopped']),
  task_id: z.string(),
  task_title: z.string().optional(),
  task_url: z.string().optional(),
  message: z.string().optional(),
  progress_type: z.string().optional(),
  stop_reason: z.enum(['finish', 'ask']).optional(),
  attachments: z.array(z.object({
    file_name: z.string(),
    url: z.string(),
    size_bytes: z.number(),
  })).optional(),
});

// ============================================================================
// API Client
// ============================================================================

class ManusClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string = MANUS_API_URL, apiKey: string = MANUS_API_KEY) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('MANUS_API_KEY is not configured');
    }

    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      method,
      headers: {
        'API_KEY': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Manus API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  // -------------------------------------------------------------------------
  // Projects
  // -------------------------------------------------------------------------

  async createProject(name: string, instructions?: string): Promise<ManusProject> {
    return this.request<ManusProject>('POST', '/projects', { name, instructions });
  }

  async listProjects(): Promise<ManusProject[]> {
    return this.request<ManusProject[]>('GET', '/projects');
  }

  // -------------------------------------------------------------------------
  // Tasks
  // -------------------------------------------------------------------------

  async createTask(params: {
    title: string;
    project_id?: string;
    prompt?: string;
  }): Promise<ManusTask> {
    return this.request<ManusTask>('POST', '/tasks', params);
  }

  async getTask(taskId: string): Promise<ManusTask> {
    return this.request<ManusTask>('GET', `/tasks/${taskId}`);
  }

  async listTasks(params?: {
    project_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ManusTask[]> {
    const query = new URLSearchParams();
    if (params?.project_id) query.set('project_id', params.project_id);
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const endpoint = `/tasks${query.toString() ? `?${query}` : ''}`;
    return this.request<ManusTask[]>('GET', endpoint);
  }

  async updateTask(taskId: string, updates: Partial<ManusTask>): Promise<ManusTask> {
    return this.request<ManusTask>('PUT', `/tasks/${taskId}`, updates);
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.request<void>('DELETE', `/tasks/${taskId}`);
  }

  // -------------------------------------------------------------------------
  // Files
  // -------------------------------------------------------------------------

  async listFiles(): Promise<ManusFile[]> {
    return this.request<ManusFile[]>('GET', '/files');
  }

  async getFile(fileId: string): Promise<ManusFile> {
    return this.request<ManusFile>('GET', `/files/${fileId}`);
  }

  // -------------------------------------------------------------------------
  // Webhooks
  // -------------------------------------------------------------------------

  async registerWebhook(url: string): Promise<{ webhook_id: string }> {
    return this.request('POST', '/webhooks', { webhook: { url } });
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    await this.request<void>('DELETE', `/webhooks/${webhookId}`);
  }

  // -------------------------------------------------------------------------
  // Utility Methods
  // -------------------------------------------------------------------------

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Create a task for Claude Code to handle
   */
  async handoffToClaude(title: string, context: string): Promise<ManusTask> {
    return this.createTask({
      title: `[Claude Code] ${title}`,
      prompt: context,
    });
  }

  /**
   * Get all pending tasks assigned to Claude Code
   */
  async getClaudeTasks(): Promise<ManusTask[]> {
    const tasks = await this.listTasks({ status: 'pending' });
    return tasks.filter(t => t.title.includes('[Claude Code]'));
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const manus = new ManusClient();

// ============================================================================
// Webhook Handler
// ============================================================================

export async function handleManusWebhook(payload: unknown): Promise<{
  success: boolean;
  action?: string;
  error?: string;
}> {
  try {
    const event = webhookEventSchema.parse(payload);

    console.log(`[Manus] Received ${event.event_type} for task ${event.task_id}`);

    switch (event.event_type) {
      case 'task_created':
        console.log(`[Manus] New task: ${event.task_title}`);
        return { success: true, action: 'logged_task_created' };

      case 'task_progress':
        console.log(`[Manus] Progress (${event.progress_type}): ${event.message}`);
        return { success: true, action: 'logged_progress' };

      case 'task_stopped':
        if (event.stop_reason === 'finish') {
          console.log(`[Manus] Task completed: ${event.task_title}`);
          // Could update AGENT_CONTEXT.md here
          return { success: true, action: 'task_completed' };
        } else if (event.stop_reason === 'ask') {
          console.log(`[Manus] Task needs input: ${event.message}`);
          return { success: true, action: 'needs_input' };
        }
        break;
    }

    return { success: true, action: 'no_action' };
  } catch (error) {
    console.error('[Manus] Webhook error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default manus;
