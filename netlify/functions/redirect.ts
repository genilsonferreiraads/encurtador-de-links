import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const handler: Handler = async (event) => {
  try {
    const path = event.path.replace('/.netlify/functions/redirect/', '');
    const slug = path.split('/')[0];

    if (!slug) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Slug não fornecido' }),
      };
    }

    const { data: link, error } = await supabase
      .from('links')
      .select('destination_url')
      .eq('slug', slug)
      .single();

    if (error || !link) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Link não encontrado' }),
      };
    }

    return {
      statusCode: 301,
      headers: {
        'Location': link.destination_url,
        'Cache-Control': 'public, max-age=0, must-revalidate'
      },
      body: ''
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro interno do servidor' }),
    };
  }
}; 