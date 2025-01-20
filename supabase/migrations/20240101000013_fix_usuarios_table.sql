-- Criar extensão pgcrypto se não existir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criar tabela usuarios se não existir
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Remover a coluna password se existir
ALTER TABLE public.usuarios
DROP COLUMN IF EXISTS password;

-- Atualizar registros existentes que têm password_hash nulo
UPDATE public.usuarios
SET password_hash = crypt('senha_temporaria' || id::text, gen_salt('bf'))
WHERE password_hash IS NULL;

-- Garantir que password_hash não é nulo
ALTER TABLE public.usuarios
ALTER COLUMN password_hash SET NOT NULL;

-- Atualizar a função create_new_user
CREATE OR REPLACE FUNCTION create_new_user(
  p_username TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_email TEXT,
  p_role TEXT DEFAULT 'user'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se o usuário já existe
  IF EXISTS (SELECT 1 FROM usuarios WHERE username = p_username) THEN
    RAISE EXCEPTION 'Usuário já existe';
  END IF;

  -- Verifica se o email já existe
  IF EXISTS (SELECT 1 FROM usuarios WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email já está em uso';
  END IF;

  -- Insere o novo usuário
  INSERT INTO usuarios (
    username,
    password_hash,
    full_name,
    role,
    email,
    created_at,
    updated_at
  ) VALUES (
    p_username,
    crypt(p_password, gen_salt('bf')),
    p_full_name,
    p_role,
    p_email,
    NOW(),
    NOW()
  );
END;
$$; 