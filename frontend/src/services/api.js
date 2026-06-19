// API service for LexAI backend
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '') + '/api';

export const api = {
  async health() {
    const response = await fetch(`${API_BASE}/health`, {
    });
    return response.json();
  },

  async sendMessage(message, mode) {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, mode }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    return response.json();
  },

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Upload failed (${response.status})`;
      try {
        const errPayload = await response.json();
        errorMessage = errPayload.detail || errPayload.message || errorMessage;
      } catch {
        // Ignore JSON parse errors and keep fallback message.
      }
      throw new Error(errorMessage);
    }
    
    return response.json();
  },

  async getDocuments() {
    const response = await fetch(`${API_BASE}/documents`, {
    });
    return response.json();
  },

  async deleteDocument(filename) {
    const response = await fetch(`${API_BASE}/documents/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  async getModes() {
    const response = await fetch(`${API_BASE}/modes`, {
    });
    return response.json();
  },

  async generateQuiz(payload) {
    const response = await fetch(`${API_BASE}/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `Quiz generation failed (${response.status})`;
      try {
        const errPayload = await response.json();
        errorMessage = errPayload.detail || errPayload.message || errorMessage;
      } catch {
        // Ignore JSON parse errors and keep fallback message.
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },
};