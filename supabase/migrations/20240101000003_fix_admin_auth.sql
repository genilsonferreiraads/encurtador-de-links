-- Desabilitar o trigger temporariamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remover usuário existente se necessário
DELETE FROM auth.users WHERE email = 'genilsonferreiranegocios@gmail.com';
DELETE FROM public.profiles WHERE email = 'genilsonferreiranegocios@gmail.com';

-- Criar usuário admin com senha criptografada
WITH new_user AS (
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    last_sign_in_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), -- Gerar novo UUID em vez de usar um fixo
    'authenticated',
    'authenticated',
    'genilsonferreiranegocios@gmail.com',
    crypt('gfds1994', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb,
    '{"full_name": "Admin"}'::jsonb,
    false,
    now(),
    now(),
    now()
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
  raw_app_meta_data = '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb
WHERE email = 'genilsonferreiranegocios@gmail.com';

-- Recriar o trigger para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 
    case 
      when new.email = 'genilsonferreiranegocios@gmail.com' then 'admin'
      else 'user'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user(); 