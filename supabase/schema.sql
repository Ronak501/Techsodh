-- ============================================================
-- TechSodh / Techsodh — Complete Database Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → Run
-- ============================================================


-- ─────────────────────────────────────────────
-- 1. PROFILES  (auto-created on user signup)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  username      TEXT UNIQUE,
  email         TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger: auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'username',
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop trigger if it already exists (to avoid duplicate errors)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────
-- 2. RESEARCH REPORTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.research_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query               TEXT NOT NULL,
  title               TEXT,
  status              TEXT NOT NULL DEFAULT 'in_progress'
                        CHECK (status IN ('in_progress', 'completed', 'failed')),
  research_mode       TEXT DEFAULT 'topic',
  template            TEXT,
  output_style        TEXT DEFAULT 'balanced',
  depth               TEXT DEFAULT 'standard',
  model_name          TEXT,
  outline             JSONB,
  report              JSONB,
  humanization_used   BOOLEAN DEFAULT FALSE,
  source_count        INT DEFAULT 0,
  prompt_tokens       INT DEFAULT 0,
  completion_tokens   INT DEFAULT 0,
  estimated_cost_usd  NUMERIC(10,6) DEFAULT 0,
  latency_ms          INT DEFAULT 0,
  from_cache          BOOLEAN DEFAULT FALSE,
  cache_key           TEXT,
  error_message       TEXT,
  last_error          TEXT,
  started_at          TIMESTAMPTZ,
  finished_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.research_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own research"
  ON public.research_reports FOR ALL
  USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- 3. RESEARCH QUERY CACHE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.research_query_cache (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cache_key        TEXT NOT NULL,
  mode             TEXT NOT NULL,
  template         TEXT NOT NULL,
  output_style     TEXT NOT NULL,
  depth            TEXT NOT NULL,
  model_name       TEXT NOT NULL,
  report_payload   JSONB NOT NULL,
  source_report_id UUID REFERENCES public.research_reports(id) ON DELETE SET NULL,
  expires_at       TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, cache_key, mode, template, output_style, depth, model_name)
);

ALTER TABLE public.research_query_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cache"
  ON public.research_query_cache FOR ALL
  USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- 4. RESEARCH USER PREFERENCES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.research_user_preferences (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_template TEXT DEFAULT 'literature_review',
  output_style       TEXT DEFAULT 'balanced',
  depth              TEXT DEFAULT 'standard',
  model_name         TEXT DEFAULT 'llama3-8b-8192',
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.research_user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON public.research_user_preferences FOR ALL
  USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- 5. CONVERSATIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT DEFAULT 'New Chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations"
  ON public.conversations FOR ALL
  USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- 6. MESSAGES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage messages in own conversations"
  ON public.messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────
-- 7. USER SUBSCRIPTIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                  TEXT NOT NULL DEFAULT 'free'
                          CHECK (plan IN ('free', 'pro', 'premium')),
  status                TEXT NOT NULL DEFAULT 'inactive'
                          CHECK (status IN ('inactive', 'active', 'canceled', 'past_due')),
  razorpay_order_id     TEXT,
  razorpay_payment_id   TEXT,
  razorpay_subscription_id TEXT,
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- 8. USER MONTHLY TOKEN USAGE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_monthly_token_usage (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_month       DATE NOT NULL,
  prompt_tokens     BIGINT NOT NULL DEFAULT 0,
  completion_tokens BIGINT NOT NULL DEFAULT 0,
  total_tokens      BIGINT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, usage_month)
);

ALTER TABLE public.user_monthly_token_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own token usage"
  ON public.user_monthly_token_usage FOR SELECT
  USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- 9. RATE LIMIT LOG  (used by consume_rate_limit RPC)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_key     TEXT NOT NULL,
  user_id      UUID,
  ip           TEXT,
  scope        TEXT,
  window_start TIMESTAMPTZ NOT NULL,
  window_ms    BIGINT NOT NULL,
  hit_count    INT NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (rate_key, window_start)
);

ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can write rate limit rows
CREATE POLICY "Service role manages rate limits"
  ON public.rate_limit_log FOR ALL
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────
-- 10. consume_rate_limit  RPC
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key          TEXT,
  p_user_id      UUID,
  p_ip           TEXT,
  p_scope        TEXT,
  p_window_start TIMESTAMPTZ,
  p_window_ms    BIGINT,
  p_limit        INT
)
RETURNS TABLE (allowed BOOLEAN, retry_after_seconds INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Upsert the rate-limit row
  INSERT INTO public.rate_limit_log (rate_key, user_id, ip, scope, window_start, window_ms, hit_count)
  VALUES (p_key, p_user_id, p_ip, p_scope, p_window_start, p_window_ms, 1)
  ON CONFLICT (rate_key, window_start)
  DO UPDATE SET hit_count = rate_limit_log.hit_count + 1;

  -- Read back the count
  SELECT hit_count INTO v_count
  FROM public.rate_limit_log
  WHERE rate_key = p_key AND window_start = p_window_start;

  IF v_count <= p_limit THEN
    RETURN QUERY SELECT TRUE, 0;
  ELSE
    RETURN QUERY SELECT FALSE, CEIL(p_window_ms::NUMERIC / 1000)::INT;
  END IF;
END;
$$;


-- ─────────────────────────────────────────────
-- 11. Indexes for performance
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_research_reports_user_id   ON public.research_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_research_reports_status    ON public.research_reports(status);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id      ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id   ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_key_window      ON public.rate_limit_log(rate_key, window_start);
CREATE INDEX IF NOT EXISTS idx_token_usage_user_month     ON public.user_monthly_token_usage(user_id, usage_month);
