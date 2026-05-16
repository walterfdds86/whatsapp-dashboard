-- raw_messages: stores every incoming webhook message
CREATE TABLE raw_messages (
  id           text PRIMARY KEY,
  body         text NOT NULL,
  from_number  text NOT NULL,
  from_name    text,
  chat_id      text NOT NULL,
  chat_name    text,
  processed    boolean DEFAULT false,
  received_at  timestamptz NOT NULL
);

-- team_members: the user's team, used by AI to assign tasks
CREATE TABLE team_members (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name  text NOT NULL,
  phone text UNIQUE NOT NULL,
  role  text
);

-- tasks: AI-generated tasks from messages
CREATE TABLE tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text,
  priority      text NOT NULL CHECK (priority IN ('urgent','today','week','no_date')),
  status        text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','delegated','done','flagged')),
  sender_name   text NOT NULL,
  sender_phone  text NOT NULL,
  assignee      text NOT NULL DEFAULT 'Walter',
  due_date      timestamptz,
  source        text NOT NULL CHECK (source IN ('direct','group')),
  group_name    text,
  message_id    text REFERENCES raw_messages(id),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- auto-update updated_at on tasks
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
