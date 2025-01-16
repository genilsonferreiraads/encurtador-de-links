import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth types
export interface UserProfile {
  id: string;
  email: string;
  avatar_url?: string;
  full_name?: string;
  role: 'admin' | 'user';
}

// Função para criar usuário admin
export const createAdminUser = async () => {
  try {
    // Primeiro, tentar criar o usuário
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: 'genilsonferreiranegocios@gmail.com',
      password: 'gfds1994',
      options: {
        data: {
          full_name: 'Admin',
          role: 'admin'
        }
      }
    });

    if (signUpError) {
      console.error('Erro ao criar usuário:', signUpError);
      throw signUpError;
    }

    if (!authData.user) {
      throw new Error('Falha ao criar usuário');
    }

    // Criar o perfil do usuário
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert([
        {
          id: authData.user.id,
          email: authData.user.email,
          full_name: 'Admin',
          role: 'admin'
        }
      ], {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError);
      throw profileError;
    }

    // Tentar confirmar o email diretamente
    const { error: updateError } = await supabase.auth.updateUser({
      data: { email_confirmed: true }
    });

    if (updateError) {
      console.error('Erro ao confirmar email:', updateError);
      // Não vamos lançar o erro aqui, pois o usuário ainda foi criado
    }

    return authData.user;
  } catch (error) {
    console.error('Erro completo ao criar admin:', error);
    throw error;
  }
};

// Auth methods
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  return { ...user, ...profile };
};

export const updateProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const uploadAvatar = async (userId: string, file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  await updateProfile(userId, { avatar_url: publicUrl });
  return publicUrl;
};

export const createUser = async (email: string, password: string, fullName: string) => {
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) throw signUpError;
  if (!user) throw new Error('User creation failed');

  const { error: profileError } = await supabase
    .from('profiles')
    .insert([
      {
        id: user.id,
        email,
        full_name: fullName,
        role: 'user',
      },
    ]);

  if (profileError) throw profileError;
  return user;
};

export interface Link {
  id: number;
  slug: string;
  destination_url: string;
  created_at: string;
  updated_at: string;
}

export const createLink = async (slug: string, destinationUrl: string) => {
  const { data, error } = await supabase
    .from('links')
    .insert([{ slug, destination_url: destinationUrl }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getLinks = async () => {
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getLinkBySlug = async (slug: string) => {
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
};

export const updateLink = async (slug: string, destinationUrl: string) => {
  const { data, error } = await supabase
    .from('links')
    .update({ destination_url: destinationUrl, updated_at: new Date().toISOString() })
    .eq('slug', slug)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteLink = async (slug: string) => {
  const { error } = await supabase
    .from('links')
    .delete()
    .eq('slug', slug);

  if (error) throw error;
}; 