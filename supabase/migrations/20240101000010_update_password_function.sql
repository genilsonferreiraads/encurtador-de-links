-- Função para atualizar usuário (senha e nome de usuário)
CREATE OR REPLACE FUNCTION update_user_info(
  p_user_id UUID,
  p_new_username TEXT,
  p_new_password TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Verifica se o novo nome de usuário já existe para outro usuário
  IF EXISTS (
    SELECT 1 
    FROM usuarios 
    WHERE username = p_new_username 
    AND id != p_user_id
  ) THEN
    RAISE EXCEPTION 'Nome de usuário já está em uso';
  END IF;

  -- Atualiza o usuário
  IF p_new_password IS NOT NULL THEN
    -- Atualiza username e senha
    UPDATE usuarios
    SET 
      username = p_new_username,
      password_hash = crypt(p_new_password, gen_salt('bf')),
      updated_at = NOW()
    WHERE id = p_user_id;
  ELSE
    -- Atualiza apenas o username
    UPDATE usuarios
    SET 
      username = p_new_username,
      updated_at = NOW()
    WHERE id = p_user_id;
  END IF;
END;
$$; 