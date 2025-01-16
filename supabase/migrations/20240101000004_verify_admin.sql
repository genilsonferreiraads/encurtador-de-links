-- Verificar usuário na tabela auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'genilsonferreiranegocios@gmail.com';

-- Verificar perfil na tabela profiles
SELECT *
FROM public.profiles
WHERE email = 'genilsonferreiranegocios@gmail.com'; 