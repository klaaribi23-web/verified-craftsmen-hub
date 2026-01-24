import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    auth: {
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
      insert: vi.fn(),
    })),
  },
}));

describe('Self-Signup Edge Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('confirm-email Edge Function', () => {
    it('should reject empty token', async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: '' }),
        }
      );
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should reject non-UUID token with 400', async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'not-a-valid-uuid' }),
        }
      );
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('invalide');
    });

    it('should reject non-existent UUID token with 400', async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: '00000000-0000-0000-0000-000000000000' }),
        }
      );
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('resend-confirmation-email Edge Function', () => {
    it('should reject empty email', async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-confirmation-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: '' }),
        }
      );
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should reject non-existent email', async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-confirmation-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'nonexistent@example.com' }),
        }
      );
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('Token Validation', () => {
    it('should validate UUID format correctly', () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      // Valid UUIDs
      expect(uuidRegex.test('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(uuidRegex.test('00000000-0000-0000-0000-000000000000')).toBe(true);
      expect(uuidRegex.test('A1B2C3D4-E5F6-7890-ABCD-EF1234567890')).toBe(true);
      
      // Invalid formats
      expect(uuidRegex.test('not-a-uuid')).toBe(false);
      expect(uuidRegex.test('123')).toBe(false);
      expect(uuidRegex.test('')).toBe(false);
      expect(uuidRegex.test('123e4567-e89b-12d3-a456')).toBe(false);
      expect(uuidRegex.test('123e4567e89b12d3a456426614174000')).toBe(false);
    });
  });

  describe('Cooldown Logic', () => {
    it('should calculate cooldown correctly', () => {
      const RATE_LIMIT_SECONDS = 60;
      
      // Recent send (30 seconds ago)
      const recentSend = new Date(Date.now() - 30 * 1000);
      const timeSinceRecent = (Date.now() - recentSend.getTime()) / 1000;
      expect(timeSinceRecent < RATE_LIMIT_SECONDS).toBe(true);
      
      // Old send (90 seconds ago)
      const oldSend = new Date(Date.now() - 90 * 1000);
      const timeSinceOld = (Date.now() - oldSend.getTime()) / 1000;
      expect(timeSinceOld >= RATE_LIMIT_SECONDS).toBe(true);
    });
  });
});
