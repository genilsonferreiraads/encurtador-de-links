-- Remover todas as políticas existentes da tabela links
DROP POLICY IF EXISTS "Links are viewable by everyone." ON links;
DROP POLICY IF EXISTS "Authenticated users can create links." ON links;
DROP POLICY IF EXISTS "Users can update own links." ON links;
DROP POLICY IF EXISTS "Users can delete own links." ON links;
DROP POLICY IF EXISTS "Links view policy" ON links;
DROP POLICY IF EXISTS "Links insert policy" ON links;
DROP POLICY IF EXISTS "Links update policy" ON links;
DROP POLICY IF EXISTS "Links delete policy" ON links;

-- Criar novas políticas
CREATE POLICY "Users can view own links"
  ON links FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create own links"
  ON links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own links"
  ON links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own links"
  ON links FOR DELETE
  USING (auth.uid() = user_id);

-- Garantir que RLS está habilitado
ALTER TABLE links ENABLE ROW LEVEL SECURITY; 