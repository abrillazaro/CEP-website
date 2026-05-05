-- Discussion feed tables

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_role text not null check (author_role in ('teacher','student')),
  title       text not null,
  body        text not null,
  image_url   text,
  video_url   text,
  created_at  timestamptz not null default now()
);

create table if not exists public.replies (
  id              uuid primary key default gen_random_uuid(),
  post_id         uuid not null references public.posts(id) on delete cascade,
  parent_reply_id uuid references public.replies(id) on delete cascade,
  author_id       uuid not null references auth.users(id) on delete cascade,
  author_name     text not null,
  body            text not null,
  created_at      timestamptz not null default now()
);

create table if not exists public.likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

-- Indexes
create index if not exists replies_post_id_idx on public.replies(post_id);
create index if not exists likes_post_id_idx   on public.likes(post_id);

-- Enable RLS
alter table public.posts   enable row level security;
alter table public.replies enable row level security;
alter table public.likes   enable row level security;

-- posts: everyone authenticated can read
create policy "posts_read" on public.posts
  for select to authenticated using (true);

-- posts: only teachers can insert
create policy "posts_insert_teacher" on public.posts
  for insert to authenticated
  with check (is_teacher());

-- posts: authors can update/delete their own posts
create policy "posts_update_own" on public.posts
  for update to authenticated
  using (auth.uid() = author_id);

create policy "posts_delete_own" on public.posts
  for delete to authenticated
  using (auth.uid() = author_id);

-- replies: everyone authenticated can read
create policy "replies_read" on public.replies
  for select to authenticated using (true);

-- replies: authenticated users can insert
create policy "replies_insert" on public.replies
  for insert to authenticated
  with check (auth.uid() = author_id);

-- replies: authors can delete their own replies
create policy "replies_delete_own" on public.replies
  for delete to authenticated
  using (auth.uid() = author_id);

-- likes: everyone authenticated can read
create policy "likes_read" on public.likes
  for select to authenticated using (true);

-- likes: authenticated users can insert their own likes
create policy "likes_insert" on public.likes
  for insert to authenticated
  with check (auth.uid() = user_id);

-- likes: users can delete their own likes
create policy "likes_delete_own" on public.likes
  for delete to authenticated
  using (auth.uid() = user_id);

-- Storage bucket for post images (run in dashboard if not using migrations)
-- insert into storage.buckets (id, name, public) values ('post-images', 'post-images', true)
-- on conflict do nothing;
