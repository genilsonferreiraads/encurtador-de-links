-- Adicionar colunas bio_name e bio_avatar_url à tabela usuarios
ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS bio_name TEXT,
ADD COLUMN IF NOT EXISTS bio_avatar_url TEXT;

-- Adicionar colunas necessárias na tabela links
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS is_bio_link BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS destination_url TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Criar índice único para slugs de bio
DROP INDEX IF EXISTS links_bio_slug_idx;
CREATE UNIQUE INDEX links_bio_slug_idx ON public.links (slug) WHERE is_bio_link = true;

-- Criar bucket para armazenar avatars do bio se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('bio-avatars', 'bio-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas existentes se necessário
DROP POLICY IF EXISTS "Todos podem ver avatars do bio" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de avatars" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios avatars" ON storage.objects;

-- Criar políticas de storage para os avatars do bio
CREATE POLICY "Todos podem ver avatars do bio"
ON storage.objects FOR SELECT
USING (bucket_id = 'bio-avatars');

CREATE POLICY "Usuários autenticados podem fazer upload de avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'bio-avatars' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Usuários podem atualizar seus próprios avatars"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'bio-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
); 