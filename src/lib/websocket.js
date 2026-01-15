/**
 * WebSocket Manager for Messaging
 * Handles WebSocket connections for real-time messaging
 */

class WebSocketManager {
  constructor() {
    this.connections = new Map(); // threadId -> WebSocket
    this.listeners = new Map(); // threadId -> Set<listener>
    this.reconnectAttempts = new Map(); // threadId -> attempts
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1 second
  }

  /**
   * Get WebSocket URL
   */
  getWebSocketURL(threadId) {
    // الحصول على base URL
    const apiURL = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL
      : 'https://medismile1-production.up.railway.app/api';
    
    // تحويل HTTP/HTTPS إلى WS/WSS
    let wsURL = apiURL.replace(/^https?/, apiURL.startsWith('https') ? 'wss' : 'ws');
    
    // إزالة /api من النهاية لأن path WebSocket يبدأ بـ /ws
    wsURL = wsURL.replace(/\/api$/, '');
    
    // بناء WebSocket path: /ws/chat/<thread_id>/
    return `${wsURL}/ws/chat/${threadId}/`;
  }

  /**
   * Get authentication token
   */
  getAuthToken() {
    if (typeof window === 'undefined') return null;
    // استخدام sessionStorage للـ access token (أكثر أماناً)
    return sessionStorage.getItem('access_token');
  }

  /**
   * Connect to a thread's WebSocket
   */
  connect(threadId, onMessage, onError, onClose) {
    // إذا كان الاتصال موجوداً بالفعل، نعيده
    if (this.connections.has(threadId)) {
      const ws = this.connections.get(threadId);
      if (ws.readyState === WebSocket.OPEN) {
        // إضافة listener جديد
        this.addListener(threadId, onMessage);
        return ws;
      }
      // إذا كان الاتصال مغلقاً، نغلقه ونعيد الاتصال
      ws.close();
    }

    const token = this.getAuthToken();
    if (!token) {
      console.error('No auth token available for WebSocket connection');
      onError?.({ error: 'No authentication token' });
      return null;
    }

    const wsURL = this.getWebSocketURL(threadId);
    
    try {
      // إضافة token كـ query parameter أو في header (حسب ما يدعمه الباك)
      const urlWithAuth = `${wsURL}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(urlWithAuth);

      // حفظ الاتصال
      this.connections.set(threadId, ws);
      this.reconnectAttempts.set(threadId, 0);

      // إضافة listeners
      this.addListener(threadId, onMessage);

      // WebSocket event handlers
      ws.onopen = () => {
        console.log(`WebSocket connected for thread ${threadId}`);
        this.reconnectAttempts.set(threadId, 0);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // استدعاء جميع listeners لهذا thread
          const listeners = this.listeners.get(threadId);
          if (listeners) {
            listeners.forEach((listener) => {
              try {
                listener(data);
              } catch (error) {
                console.error('Error in WebSocket message listener:', error);
              }
            });
          }

          // استدعاء callback العام
          onMessage?.(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          onError?.({ error: 'Failed to parse message', originalError: error });
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for thread ${threadId}:`, error);
        onError?.({ error: 'WebSocket error', originalError: error });
      };

      ws.onclose = (event) => {
        console.log(`WebSocket closed for thread ${threadId}:`, event.code, event.reason);
        this.connections.delete(threadId);
        
        // استدعاء callback onClose
        onClose?.(event);

        // إعادة الاتصال إذا لم يكن إغلاقاً طوعياً
        if (event.code !== 1000 && event.code !== 1001) {
          this.attemptReconnect(threadId, onMessage, onError, onClose);
        } else {
          // تنظيف listeners
          this.listeners.delete(threadId);
        }
      };

      return ws;
    } catch (error) {
      console.error(`Error creating WebSocket for thread ${threadId}:`, error);
      onError?.({ error: 'Failed to create WebSocket connection', originalError: error });
      return null;
    }
  }

  /**
   * Attempt to reconnect to a thread's WebSocket
   */
  attemptReconnect(threadId, onMessage, onError, onClose) {
    const attempts = this.reconnectAttempts.get(threadId) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnect attempts reached for thread ${threadId}`);
      this.listeners.delete(threadId);
      onError?.({ error: 'Max reconnect attempts reached' });
      return;
    }

    this.reconnectAttempts.set(threadId, attempts + 1);
    const delay = this.reconnectDelay * Math.pow(2, attempts); // Exponential backoff

    console.log(`Attempting to reconnect to thread ${threadId} in ${delay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect(threadId, onMessage, onError, onClose);
    }, delay);
  }

  /**
   * Add a listener for a specific thread
   */
  addListener(threadId, listener) {
    if (!this.listeners.has(threadId)) {
      this.listeners.set(threadId, new Set());
    }
    this.listeners.get(threadId).add(listener);
  }

  /**
   * Remove a listener for a specific thread
   */
  removeListener(threadId, listener) {
    const listeners = this.listeners.get(threadId);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(threadId);
      }
    }
  }

  /**
   * Disconnect from a thread's WebSocket
   */
  disconnect(threadId) {
    const ws = this.connections.get(threadId);
    if (ws) {
      ws.close(1000, 'Client disconnecting'); // Normal closure
      this.connections.delete(threadId);
      this.listeners.delete(threadId);
      this.reconnectAttempts.delete(threadId);
    }
  }

  /**
   * Disconnect all WebSocket connections
   */
  disconnectAll() {
    this.connections.forEach((ws, threadId) => {
      this.disconnect(threadId);
    });
  }

  /**
   * Check if a WebSocket is connected for a thread
   */
  isConnected(threadId) {
    const ws = this.connections.get(threadId);
    return ws && ws.readyState === WebSocket.OPEN;
  }

  /**
   * Send a message through WebSocket (if needed for future features)
   */
  send(threadId, message) {
    const ws = this.connections.get(threadId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    console.warn(`Cannot send message: WebSocket not connected for thread ${threadId}`);
    return false;
  }
}

// إنشاء instance واحد فقط (Singleton)
const wsManager = new WebSocketManager();

export default wsManager;

