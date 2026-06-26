import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { createClient } from '@supabase/supabase-js';

export default defineConfig(({ mode }) => {
    const buildId =
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.GITHUB_SHA ||
      `local-${Date.now()}`;

    return {
      define: {
        __APP_BUILD_ID__: JSON.stringify(buildId),
      },
      // Devtools không bắt buộc pre-bundle — tránh 504 Outdated Optimize Dep khi deps/cache đổi
      optimizeDeps: {
        exclude: ['@tanstack/react-query-devtools'],
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      build: {
        chunkSizeWarningLimit: 3500,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (!id.includes('node_modules')) return;
              if (id.includes('framer-motion')) return 'vendor-framer';
              if (id.includes('@tanstack')) return 'vendor-tanstack';
              if (id.includes('recharts')) return 'vendor-recharts';
              if (id.includes('jspdf')) return 'vendor-jspdf';
              if (id.includes('lucide-react')) return 'vendor-icons';
            },
          },
        },
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.svg'],
          manifest: {
            name: '5F template',
            short_name: '5F template',
            description: 'Ứng dụng mẫu quản lý ERP',
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone',
            start_url: '/',
            icons: [
              {
                src: '/favicon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any',
              },
              {
                src: '/favicon.svg',
                sizes: '192x192',
                type: 'image/svg+xml',
                purpose: 'any maskable',
              },
              {
                src: '/favicon.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'any maskable',
              },
            ],
          },
          minify: true,
          workbox: {
            mode: 'production',
            skipWaiting: true,
            clientsClaim: true,
            cleanupOutdatedCaches: true,
            navigationPreload: true,
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8 MiB (chunk chính ~5.8 MB)
            navigateFallbackDenylist: [/^\/bang-luong-preview\/.*/, /^\/bang-luong-ky-chi-tiet\/.*/, /^\/api\/.*/, /.*\.xlsx$/, /.*\.doc$/, /.*\.pdf$/],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
            ],
          },
        }),
        {
          name: 'employee-auth-sync-middleware',
          configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
              if (req.url === '/api/employee-auth-sync' && req.method === 'POST') {
                const env = loadEnv(mode, process.cwd(), '');
                const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
                const serviceKey = env.SUPABASE_SECRET_KEY || 
                                   env.SUPABASE_SERVICE_ROLE_KEY || 
                                   env.VITE_SUPABASE_SECRET_KEY || 
                                   env.VITE_SUPABASE_SERVICE_ROLE_KEY;
                if (!supabaseUrl || !serviceKey) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: `Supabase admin env is missing locally in vite.config.ts (url=${!!supabaseUrl}, key=${!!serviceKey})` }));
                  return;
                }

                let bodyStr = '';
                req.on('data', (chunk) => { bodyStr += chunk; });
                req.on('end', async () => {
                  try {
                    const body = JSON.parse(bodyStr);
                    const admin = createClient(supabaseUrl, serviceKey, {
                      auth: { autoRefreshToken: false, persistSession: false },
                    });

                    const usernameToEmail = (username: string) => {
                      const clean = username.trim().toLowerCase();
                      return clean.includes('@') ? clean : `${clean}@gmail.com`;
                    };

                    const findUserByEmail = async (email: string) => {
                      let page = 1;
                      for (;;) {
                        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
                        if (error) throw error;
                        const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
                        if (found) return found;
                        if (data.users.length < 1000) return null;
                        page += 1;
                      }
                    };

                    const ensureUser = async (username: string) => {
                      const email = usernameToEmail(username);
                      const existing = await findUserByEmail(email);
                      if (existing) {
                        const { error } = await admin.auth.admin.updateUserById(existing.id, {
                          email,
                          email_confirm: true,
                          user_metadata: { ten_dang_nhap: username.trim() },
                        });
                        if (error) throw error;
                        return;
                      }
                      const { error } = await admin.auth.admin.createUser({
                        email,
                        password: '123456',
                        email_confirm: true,
                        user_metadata: { ten_dang_nhap: username.trim() },
                      });
                      if (error) throw error;
                    };

                    if (body.operation === 'create') {
                      if (body.username?.trim()) await ensureUser(body.username);
                    } else if (body.operation === 'update') {
                      const oldUsername = body.oldUsername?.trim();
                      const newUsername = body.newUsername?.trim();
                      if (!newUsername) {
                        if (oldUsername) {
                          const oldUser = await findUserByEmail(usernameToEmail(oldUsername));
                          if (oldUser) await admin.auth.admin.deleteUser(oldUser.id);
                        }
                      } else if (!oldUsername || oldUsername.toLowerCase() === newUsername.toLowerCase()) {
                        await ensureUser(newUsername);
                      } else {
                        const oldUser = await findUserByEmail(usernameToEmail(oldUsername));
                        const newEmail = usernameToEmail(newUsername);
                        if (oldUser) {
                          const existingNew = await findUserByEmail(newEmail);
                          if (existingNew && existingNew.id !== oldUser.id) {
                            await admin.auth.admin.deleteUser(oldUser.id);
                            await ensureUser(newUsername);
                          } else {
                            const { error } = await admin.auth.admin.updateUserById(oldUser.id, {
                              email: newEmail,
                              email_confirm: true,
                              user_metadata: { ten_dang_nhap: newUsername },
                            });
                            if (error) throw error;
                          }
                        } else {
                          await ensureUser(newUsername);
                        }
                      }
                    } else if (body.operation === 'delete') {
                      const username = body.username?.trim();
                      if (username) {
                        const user = await findUserByEmail(usernameToEmail(username));
                        if (user) await admin.auth.admin.deleteUser(user.id);
                      }
                    }

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: true }));
                  } catch (err: any) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message || 'Auth sync failed' }));
                  }
                });
              } else {
                next();
              }
            });
          }
        }
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          buffer: 'buffer',
        }
      }
    };
});
