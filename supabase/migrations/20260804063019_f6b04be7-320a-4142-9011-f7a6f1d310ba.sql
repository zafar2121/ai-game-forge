ALTER TABLE public.profiles ALTER COLUMN credits TYPE numeric(10,2) USING credits::numeric;
ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 0;

CREATE TABLE public.daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  task_key text NOT NULL,
  reward numeric(10,2) NOT NULL DEFAULT 0,
  progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day, task_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_tasks TO authenticated;
GRANT ALL ON public.daily_tasks TO service_role;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own daily tasks" ON public.daily_tasks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER daily_tasks_updated_at BEFORE UPDATE ON public.daily_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS share_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT true;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS creator_name text;
CREATE UNIQUE INDEX IF NOT EXISTS projects_share_id_key ON public.projects (share_id);

GRANT SELECT ON public.projects TO anon;
CREATE POLICY "Anyone can view shared projects" ON public.projects
  FOR SELECT TO anon, authenticated USING (is_shared = true);