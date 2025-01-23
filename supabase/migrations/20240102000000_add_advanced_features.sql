-- Adiciona colunas para funções avançadas
ALTER TABLE links
ADD COLUMN IF NOT EXISTS advanced_type text CHECK (advanced_type IN ('expirable', 'selfDestruct', 'password')),
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_self_destruct boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS password text,
ADD COLUMN IF NOT EXISTS is_destroyed boolean DEFAULT false;

-- Atualiza a política de RLS para incluir as novas colunas
DROP POLICY IF EXISTS "Links are viewable by everyone." ON links;
CREATE POLICY "Links are viewable by everyone."
  ON links FOR SELECT
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