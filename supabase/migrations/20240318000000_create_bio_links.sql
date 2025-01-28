create table public.bio_links (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  url text not null,
  icon text not null default 'link',
  order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.bio_links enable row level security;

-- Create policies
create policy "Users can view their own bio links"
  on public.bio_links for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bio links"
  on public.bio_links for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bio links"
  on public.bio_links for update
  using (auth.uid() = user_id);

create policy "Users can delete their own bio links"
  on public.bio_links for delete
  using (auth.uid() = user_id);

-- Create function to automatically set updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger set_updated_at
  before update on public.bio_links
  for each row
  execute procedure public.handle_updated_at(); 