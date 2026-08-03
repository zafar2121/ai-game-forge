CREATE TABLE public.signup_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.signup_attempts TO service_role;

ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_signup_attempts_ip_created ON public.signup_attempts (ip_hash, created_at DESC);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS starter_credit_granted boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 0;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, plan, credits, last_credit_reset)
  VALUES (NEW.id, NEW.email, 'free', 0, now())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;