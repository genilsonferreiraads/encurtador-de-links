-- Criar tabela profiles se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar usuário admin
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Verificar se o usuário já existe
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'genilsonferreiranegocios@gmail.com';

  -- Se o usuário não existir, criar novo
  IF user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      aud,
      role
    )
    VALUES (
      gen_random_uuid(),
      'genilsonferreiranegocios@gmail.com',
      crypt('gfds1994', gen_salt('bf')),
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO user_id;
  END IF;

  -- Inserir ou atualizar o perfil
  INSERT INTO public.profiles (id, email, role, created_at, updated_at)
  VALUES (
    user_id,
    'genilsonferreiranegocios@gmail.com',
    'admin',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      updated_at = now();
END
$$; 