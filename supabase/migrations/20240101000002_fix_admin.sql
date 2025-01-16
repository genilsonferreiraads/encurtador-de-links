-- Verificar e corrigir usuário admin
DO $$
DECLARE
  admin_user_id uuid;
  admin_email text := 'genilsonferreiranegocios@gmail.com';
  admin_password text := 'gfds1994';
BEGIN
  -- Verificar se o usuário existe
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;

  -- Se não existir, criar novo
  IF admin_user_id IS NULL THEN
    -- Criar usuário
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      aud,
      role,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin
    )
    VALUES (
      gen_random_uuid(),
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      false
    )
    RETURNING id INTO admin_user_id;

    -- Criar perfil
    INSERT INTO public.profiles (id, email, role, created_at, updated_at)
    VALUES (
      admin_user_id,
      admin_email,
      'admin',
      now(),
      now()
    );
  ELSE
    -- Atualizar senha do usuário existente
    UPDATE auth.users
    SET 
      encrypted_password = crypt(admin_password, gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at = now(),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      is_super_admin = false
    WHERE id = admin_user_id;

    -- Garantir que o perfil existe e está como admin
    INSERT INTO public.profiles (id, email, role, created_at, updated_at)
    VALUES (
      admin_user_id,
      admin_email,
      'admin',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      role = 'admin',
      updated_at = now();
  END IF;

  -- Verificar se as políticas RLS existem
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Public profiles are viewable by everyone.'
  ) THEN
    CREATE POLICY "Public profiles are viewable by everyone."
      ON public.profiles FOR SELECT
      USING ( true );
  END IF;
END
$$; 