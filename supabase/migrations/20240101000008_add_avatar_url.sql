-- Adicionar coluna avatar_url à tabela usuarios
ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS avatar_url TEXT; 