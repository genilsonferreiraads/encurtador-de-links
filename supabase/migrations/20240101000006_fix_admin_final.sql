-- Desabilitar todos os triggers
ALTER TABLE auth.users DISABLE TRIGGER ALL;
ALTER TABLE public.profiles DISABLE TRIGGER ALL;

-- Limpar dados existentes
DELETE FROM auth.users WHERE email = 'genilsonferreiranegocios@gmail.com';
DELETE FROM public.profiles WHERE email = 'genilsonferreiranegocios@gmail.com';

-- Criar usuário admin
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  is_super_admin
) VALUES (
  'ba58c3cf-c185-406a-9ed8-2d730943c53d',
  'genilsonferreiranegocios@gmail.com',
  -- Senha: gfds1994 (gerada com bcrypt)
  '$2a$10$5I9kHuF0RCUxQRWqWUiOxOtVnGRBQlCA4.rQ5K0tg0dVbVKD1zqmG',
  now(),
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
  '{"full_name":"Admin"}'::jsonb,
  now(),
  now(),
  '',
  true
);

-- Criar perfil do admin
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  'ba58c3cf-c185-406a-9ed8-2d730943c53d',
  'genilsonferreiranegocios@gmail.com',
  'Admin',
  'admin',
  now(),
  now()
);

-- Reabilitar triggers
ALTER TABLE auth.users ENABLE TRIGGER ALL;
ALTER TABLE public.profiles ENABLE TRIGGER ALL;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recriar função e trigger para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Não criar perfil se já existir
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = NEW.id
  ) THEN
    INSERT INTO public.profiles (id, email, role)
    VALUES (
      NEW.id,
      NEW.email,
      CASE 
        WHEN NEW.email = 'genilsonferreiranegocios@gmail.com' THEN 'admin'
        ELSE 'user'
      END
    );
  END IF;
  RETURN NEW;
END;
$$ language plpgsql security definer;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user(); 