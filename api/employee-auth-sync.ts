import { createClient } from '@supabase/supabase-js';

const DEFAULT_PASSWORD = '123456';

type Operation = 'create' | 'update' | 'delete' | 'setPassword';

type Body = {
  operation?: Operation;
  username?: string | null;
  oldUsername?: string | null;
  newUsername?: string | null;
  password?: string | null;
  newPassword?: string | null;
  full_name?: string | null;
  id_chuc_vu?: number | string | null;
  id_phong_ban?: number | string | null;
};

type ApiRequest = {
  method?: string;
  body?: string | Body;
};

type ApiResponse = {
  status: (code: number) => { json: (data: unknown) => void };
};

function usernameToEmail(username: string): string {
  const clean = username.trim().toLowerCase();
  return clean.includes('@') ? clean : `${clean}@gmail.com`;
}

function send(res: { status: (code: number) => { json: (data: unknown) => void } }, code: number, data: unknown) {
  res.status(code).json(data);
}

async function findUserByEmail(admin: any, email: string) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((user: any) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 1000) return null;
    page += 1;
  }
}

function normalizePassword(password?: string | null): string {
  const value = password?.trim();
  return value && value.length >= 6 ? value : DEFAULT_PASSWORD;
}

function buildUserMetadata(
  username: string,
  extra?: Pick<Body, 'full_name' | 'id_chuc_vu' | 'id_phong_ban'>,
): Record<string, unknown> {
  const metadata: Record<string, unknown> = { ten_dang_nhap: username.trim() };
  const fullName = extra?.full_name?.trim();
  if (fullName) metadata.full_name = fullName;
  if (extra?.id_chuc_vu != null && extra.id_chuc_vu !== '') metadata.id_chuc_vu = extra.id_chuc_vu;
  if (extra?.id_phong_ban != null && extra.id_phong_ban !== '') metadata.id_phong_ban = extra.id_phong_ban;
  return metadata;
}

async function ensureUser(
  admin: any,
  username: string,
  password?: string | null,
  metadata?: Pick<Body, 'full_name' | 'id_chuc_vu' | 'id_phong_ban'>,
) {
  const email = usernameToEmail(username);
  const providedPassword = password?.trim();
  const existing = await findUserByEmail(admin, email);
  if (existing) {
    const updatePayload: Record<string, unknown> = {
      email,
      email_confirm: true,
      user_metadata: buildUserMetadata(username, metadata),
    };
    if (providedPassword && providedPassword.length >= 6) {
      updatePayload.password = providedPassword;
    }
    const { error } = await admin.auth.admin.updateUserById(existing.id, updatePayload);
    if (error) throw error;
    return;
  }

  const { error } = await admin.auth.admin.createUser({
    email,
    password: normalizePassword(password),
    email_confirm: true,
    user_metadata: buildUserMetadata(username, metadata),
  });
  if (error) throw error;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    send(res, 405, { error: 'Method not allowed' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SECRET_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    send(res, 500, { error: 'Missing SUPABASE_URL or SUPABASE_SECRET_KEY' });
    return;
  }

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as Body;
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const metadata = {
      full_name: body.full_name,
      id_chuc_vu: body.id_chuc_vu,
      id_phong_ban: body.id_phong_ban,
    };

    if (body.operation === 'create') {
      if (body.username?.trim()) await ensureUser(admin, body.username, body.password, metadata);
      send(res, 200, { ok: true });
      return;
    }

    if (body.operation === 'setPassword') {
      const username = body.username?.trim();
      const password = body.newPassword?.trim() || body.password?.trim();
      if (!username) {
        send(res, 400, { error: 'Missing username' });
        return;
      }
      if (!password || password.length < 6) {
        send(res, 400, { error: 'Mật khẩu tối thiểu 6 ký tự' });
        return;
      }
      const user = await findUserByEmail(admin, usernameToEmail(username));
      if (!user) {
        await ensureUser(admin, username, password, metadata);
        send(res, 200, { ok: true });
        return;
      }
      const { error } = await admin.auth.admin.updateUserById(user.id, {
        password,
        email_confirm: true,
        user_metadata: buildUserMetadata(username, metadata),
      });
      if (error) throw error;
      send(res, 200, { ok: true });
      return;
    }

    if (body.operation === 'update') {
      const oldUsername = body.oldUsername?.trim();
      const newUsername = body.newUsername?.trim();
      if (!newUsername) {
        if (oldUsername) {
          const oldUser = await findUserByEmail(admin, usernameToEmail(oldUsername));
          if (oldUser) await admin.auth.admin.deleteUser(oldUser.id);
        }
        send(res, 200, { ok: true });
        return;
      }

      if (!oldUsername || oldUsername.toLowerCase() === newUsername.toLowerCase()) {
        await ensureUser(admin, newUsername, body.password, metadata);
        send(res, 200, { ok: true });
        return;
      }

      const oldUser = await findUserByEmail(admin, usernameToEmail(oldUsername));
      const newEmail = usernameToEmail(newUsername);
      if (oldUser) {
        const existingNew = await findUserByEmail(admin, newEmail);
        if (existingNew && existingNew.id !== oldUser.id) {
          await admin.auth.admin.deleteUser(oldUser.id);
          await ensureUser(admin, newUsername, body.password, metadata);
        } else {
          const { error } = await admin.auth.admin.updateUserById(oldUser.id, {
            email: newEmail,
            email_confirm: true,
            user_metadata: buildUserMetadata(newUsername, metadata),
          });
          if (error) throw error;
        }
      } else {
        await ensureUser(admin, newUsername, body.password, metadata);
      }
      send(res, 200, { ok: true });
      return;
    }

    if (body.operation === 'delete') {
      const username = body.username?.trim();
      if (username) {
        const user = await findUserByEmail(admin, usernameToEmail(username));
        if (user) await admin.auth.admin.deleteUser(user.id);
      }
      send(res, 200, { ok: true });
      return;
    }

    send(res, 400, { error: 'Invalid operation' });
  } catch (error) {
    send(res, 500, { error: error instanceof Error ? error.message : 'Auth sync failed' });
  }
}
