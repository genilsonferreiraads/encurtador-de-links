-- Adiciona coluna para função de download
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS is_download boolean DEFAULT false;

-- Atualiza a política de RLS para incluir a nova coluna
DROP POLICY IF EXISTS "Links are viewable by everyone." ON public.links;
CREATE POLICY "Links are viewable by everyone."
  ON public.links FOR SELECT
  USING (
    CASE
      WHEN advanced_type = 'expirable' THEN
        expires_at IS NULL OR expires_at > NOW()
      WHEN advanced_type = 'selfDestruct' THEN
        NOT is_destroyed
      ELSE
        true
    END
  ); 