-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority    TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  due_date    TEXT NOT NULL DEFAULT '',
  completed   BOOLEAN NOT NULL DEFAULT false,
  frozen      BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add frozen column if upgrading from previous schema
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS frozen BOOLEAN NOT NULL DEFAULT false;

-- Subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  completed   BOOLEAN NOT NULL DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE tasks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own tasks
CREATE POLICY "tasks: own rows" ON tasks
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policies: users can only access subtasks of their own tasks
CREATE POLICY "subtasks: own rows" ON subtasks
  USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid())
  );

-- Enable real-time replication
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE subtasks;
