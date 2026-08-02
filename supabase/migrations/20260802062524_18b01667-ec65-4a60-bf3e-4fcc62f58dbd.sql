ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 1;

UPDATE public.profiles SET credits = 1 WHERE plan = 'free' AND credits > 1;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, plan, credits, last_credit_reset)
  VALUES (NEW.id, NEW.email, 'free', 1, now())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;