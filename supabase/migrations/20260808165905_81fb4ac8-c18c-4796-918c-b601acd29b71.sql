ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS afk_pending numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS afk_last_tick timestamptz;

-- Accrue AFK earnings using server time only. Returns the new pending balance.
CREATE OR REPLACE FUNCTION public.afk_tick()
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  last timestamptz;
  delta numeric;
  pending numeric;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT afk_last_tick INTO last FROM public.profiles WHERE user_id = uid FOR UPDATE;

  IF last IS NULL THEN
    UPDATE public.profiles SET afk_last_tick = now() WHERE user_id = uid
      RETURNING afk_pending INTO pending;
    RETURN COALESCE(pending, 0);
  END IF;

  -- cap each tick at 60s so a long absence cannot be credited
  delta := LEAST(GREATEST(EXTRACT(EPOCH FROM (now() - last)), 0), 60);

  UPDATE public.profiles
     SET afk_pending = ROUND(afk_pending + delta * 0.0001, 6),
         afk_last_tick = now()
   WHERE user_id = uid
   RETURNING afk_pending INTO pending;

  RETURN COALESCE(pending, 0);
END;
$$;

-- Leaving the AFK zone: stop accrual, keep pending balance intact.
CREATE OR REPLACE FUNCTION public.afk_stop()
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  pending numeric;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  UPDATE public.profiles SET afk_last_tick = NULL WHERE user_id = uid
    RETURNING afk_pending INTO pending;
  RETURN COALESCE(pending, 0);
END;
$$;

-- Atomic transfer of the whole pending balance into the main credit balance.
CREATE OR REPLACE FUNCTION public.afk_claim()
RETURNS TABLE (credits numeric, afk_pending numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  RETURN QUERY
  UPDATE public.profiles p
     SET credits = ROUND(p.credits + p.afk_pending, 6),
         afk_pending = 0,
         afk_last_tick = CASE WHEN p.afk_last_tick IS NULL THEN NULL ELSE now() END
   WHERE p.user_id = uid
     AND p.afk_pending > 0
  RETURNING p.credits, p.afk_pending;

  IF NOT FOUND THEN
    RETURN QUERY SELECT p.credits, p.afk_pending FROM public.profiles p WHERE p.user_id = uid;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.afk_tick() FROM public, anon;
REVOKE ALL ON FUNCTION public.afk_stop() FROM public, anon;
REVOKE ALL ON FUNCTION public.afk_claim() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.afk_tick() TO authenticated;
GRANT EXECUTE ON FUNCTION public.afk_stop() TO authenticated;
GRANT EXECUTE ON FUNCTION public.afk_claim() TO authenticated;