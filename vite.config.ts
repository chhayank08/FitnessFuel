import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { UserConfig } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

// https://vitejs.dev/config/
export default defineConfig(async (): Promise<UserConfig> => {
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api/diet': {
          target: `http://localhost:5001`,
          changeOrigin: true,
          secure: false,
          timeout: 10000,
          rewrite: (path: string) => path.replace(/^\/api/, ''),
          configure: (proxy: any) => {
            proxy.on('error', (err: Error, _req: IncomingMessage, res: ServerResponse) => {
              console.log('Proxy error:', err);
              if (!res.headersSent) {
                res.writeHead(503, {
                  'Content-Type': 'application/json',
                });
                res.end(JSON.stringify({ 
                  error: 'Diet service unavailable',
                  detail: 'The diet recommendation service is currently unavailable. Please try again later.'
                }));
              }
            });

            proxy.on('proxyReq', (proxyReq: any, req: any) => {
              if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
              }
            });
          },
        },
      },
    },
  };
});
