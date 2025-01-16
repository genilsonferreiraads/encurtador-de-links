import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const handler: Handler = async (event) => {
  try {
    const slug = event.path.split('/').pop();

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

    const destinationUrl = link.destination_url.startsWith('http://') || link.destination_url.startsWith('https://')
      ? link.destination_url
      : `https://${link.destination_url}`;

    return {
      statusCode: 301,
      headers: {
        'Location': destinationUrl,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      },
      body: ''
    };
  } catch (error) {
    console.error('Erro:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro interno do servidor' }),
    };
  }
}; 