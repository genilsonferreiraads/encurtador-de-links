import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Interface do usuário
export interface Usuario {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
  avatar_url?: string;
}

// Armazena as tentativas de login por IP
const loginAttempts = new Map<string, { count: number; lastAttempt: number; blocked: boolean }>();

// Configurações de segurança
const MAX_LOGIN_ATTEMPTS = 5; // Máximo de tentativas
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutos em milissegundos
const ATTEMPT_RESET_TIME = 30 * 60 * 1000; // 30 minutos em milissegundos

// Nova função de login
export async function signIn(username: string, password: string) {
  // Simula um IP (em produção, usar o IP real do cliente)
  const clientIP = 'dummy-ip';
  
  // Verifica se o IP está bloqueado
  const attempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0, blocked: false };
  
  // Verifica se ainda está no período de bloqueio
  if (attempts.blocked) {
    const timeLeft = BLOCK_DURATION - (Date.now() - attempts.lastAttempt);
    if (timeLeft > 0) {
      throw new Error(`Muitas tentativas de login. Tente novamente em ${Math.ceil(timeLeft / 60000)} minutos.`);
    } else {
      // Remove o bloqueio após o período
      attempts.blocked = false;
      attempts.count = 0;
    }
  }

  // Verifica se deve resetar as tentativas (após 30 minutos)
  if (Date.now() - attempts.lastAttempt > ATTEMPT_RESET_TIME) {
    attempts.count = 0;
  }

  try {
    // Sanitiza as entradas
    const sanitizedUsername = username.trim();
    const sanitizedPassword = password.trim();

    // Verifica se os campos estão vazios
    if (!sanitizedUsername || !sanitizedPassword) {
      throw new Error('Usuário e senha são obrigatórios.');
    }

    console.log('Tentando login com username:', sanitizedUsername);

    // Primeiro, verifica se o usuário existe
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', sanitizedUsername)
      .single();

    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      attempts.count++;
      attempts.lastAttempt = Date.now();
      loginAttempts.set(clientIP, attempts);
      throw new Error(`Credenciais inválidas. Tentativas restantes: ${MAX_LOGIN_ATTEMPTS - attempts.count}`);
    }

    if (!user) {
      console.error('Usuário não encontrado');
      attempts.count++;
      attempts.lastAttempt = Date.now();
      loginAttempts.set(clientIP, attempts);
      throw new Error(`Credenciais inválidas. Tentativas restantes: ${MAX_LOGIN_ATTEMPTS - attempts.count}`);
    }

    console.log('Usuário encontrado, verificando senha...');

    // Se o usuário existe, verifica a senha
    const { data: pwCheck, error: pwError } = await supabase
      .rpc('check_password', {
        input_username: sanitizedUsername,
        input_password: sanitizedPassword
      });

    console.log('Resultado da verificação de senha:', { pwCheck, pwError });

    if (pwError) {
      console.error('Erro ao verificar senha:', pwError);
      attempts.count++;
      attempts.lastAttempt = Date.now();
      loginAttempts.set(clientIP, attempts);
      throw new Error(`Erro ao verificar senha. Tentativas restantes: ${MAX_LOGIN_ATTEMPTS - attempts.count}`);
    }

    // Se pwCheck for false, a senha está incorreta
    if (pwCheck === false) {
      console.log('Senha incorreta');
      attempts.count++;
      attempts.lastAttempt = Date.now();

      if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        attempts.blocked = true;
        loginAttempts.set(clientIP, attempts);
        throw new Error(`Conta bloqueada por ${BLOCK_DURATION / 60000} minutos devido a múltiplas tentativas de login.`);
      }

      loginAttempts.set(clientIP, attempts);
      throw new Error(`Senha incorreta. Tentativas restantes: ${MAX_LOGIN_ATTEMPTS - attempts.count}`);
    }

    console.log('Login bem sucedido!');

    // Login bem sucedido - reseta as tentativas
    loginAttempts.delete(clientIP);
    
    // Salva o ID do usuário
    setCurrentUser(user.id);

    return { user };

  } catch (error: any) {
    // Atualiza as tentativas mesmo em caso de erro
    loginAttempts.set(clientIP, attempts);
    throw error;
  }
}

// Função para verificar se o usuário está logado
export const getCurrentUser = async () => {
  try {
    // Pegar o ID do usuário do localStorage
    const userId = localStorage.getItem('userId');
    if (!userId) return null;

    // Buscar dados do usuário
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Erro ao verificar usuário atual:', error);
    return null;
  }
};

// Função para salvar o ID do usuário no localStorage
export const setCurrentUser = (userId: string) => {
  localStorage.setItem('userId', userId);
};

// Função para limpar o usuário atual
export const clearCurrentUser = () => {
  localStorage.removeItem('userId');
}; 