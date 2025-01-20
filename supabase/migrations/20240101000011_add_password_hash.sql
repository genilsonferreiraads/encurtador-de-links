-- Adicionar coluna password_hash à tabela usuarios
ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Criar extensão pgcrypto se não existir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Atualizar a função create_new_user para usar a nova coluna
CREATE OR REPLACE FUNCTION create_new_user(
  p_username TEXT,
  p_password TEXT,
  p_full_name TEXT,
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

  -- Insere o novo usuário
  INSERT INTO usuarios (
    username,
    password_hash,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    p_username,
    crypt(p_password, gen_salt('bf')),
    p_full_name,
    p_role,
    NOW(),
    NOW()
  );
END;
$$; 