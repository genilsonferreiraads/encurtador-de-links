import { supabase } from './supabase';

export const getCurrentUser = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao obter sessão:', error);
      return null;
    }

    if (!session?.user) {
      return null;
    }

    // Buscar dados adicionais do usuário
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('Erro ao buscar dados do usuário:', userError);
      return null;
    }

    return userData;
  } catch (error) {
    console.error('Erro ao verificar usuário atual:', error);
    return null;
  }
}; 