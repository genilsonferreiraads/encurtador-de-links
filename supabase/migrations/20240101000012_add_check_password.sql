-- Criar função para verificar senha
CREATE OR REPLACE FUNCTION check_password(
  input_username TEXT,
  input_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM usuarios
    WHERE username = input_username
    AND password_hash = crypt(input_password, password_hash)
  );
END;
$$; 