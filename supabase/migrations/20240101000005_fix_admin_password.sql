-- Remover usuário existente se necessário
DELETE FROM auth.users WHERE email = 'genilsonferreiranegocios@gmail.com';
DELETE FROM public.profiles WHERE email = 'genilsonferreiranegocios@gmail.com';

-- Criar usuário admin com senha criptografada usando o método do Supabase
WITH new_user AS (
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
    confirmation_token
  ) VALUES (
    gen_random_uuid(),
    'genilsonferreiranegocios@gmail.com',
    -- Senha: gfds1994
    '$2a$10$5I9kHuF0RCUxQRWqWUiOxOtVnGRBQlCA4.rQ5K0tg0dVbVKD1zqmG',
    now(),
    'authenticated',
    'authenticated',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    ''
  )
  RETURNING id
)
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
)
SELECT 
  id,
  'genilsonferreiranegocios@gmail.com',
  'Admin',
  'admin',
  now(),
  now()
FROM new_user;

-- Garantir que o usuário está confirmado
UPDATE auth.users
SET 
  email_confirmed_at = now(),
  updated_at = now(),
  raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb
WHERE email = 'genilsonferreiranegocios@gmail.com'; 