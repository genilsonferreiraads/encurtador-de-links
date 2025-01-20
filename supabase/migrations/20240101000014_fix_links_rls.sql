-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Links are viewable by everyone." ON links;
DROP POLICY IF EXISTS "Authenticated users can create links." ON links;
DROP POLICY IF EXISTS "Users can update own links." ON links;
DROP POLICY IF EXISTS "Users can delete own links." ON links;
DROP POLICY IF EXISTS "Users can view their own links" ON links;
DROP POLICY IF EXISTS "Users can create their own links" ON links;
DROP POLICY IF EXISTS "Admin can view all links" ON links;
DROP POLICY IF EXISTS "Links view policy" ON links;
DROP POLICY IF EXISTS "Links insert policy" ON links;
DROP POLICY IF EXISTS "Links update policy" ON links;
DROP POLICY IF EXISTS "Links delete policy" ON links;

-- Criar novas políticas
CREATE POLICY "Links view policy"
  ON links FOR SELECT
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Links insert policy"
  ON links FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Links update policy"
  ON links FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Links delete policy"
  ON links FOR DELETE
  USING (user_id = auth.uid());

-- Garantir que RLS está habilitado
ALTER TABLE links ENABLE ROW LEVEL SECURITY; 