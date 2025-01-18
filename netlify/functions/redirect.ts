import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('As variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const handler: Handler = async (event) => {
  try {
    console.log('Event path:', event.path);
    const path = event.path.replace('/.netlify/functions/redirect', '').replace('/l/', '/');
    console.log('Path after replace:', path);
    const slug = path.split('/').filter(Boolean)[0];
    console.log('Extracted slug:', slug);

    if (!slug) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Slug não fornecido' }),
      };
    }

    const { data: link, error } = await supabase
      .from('links')
      .select('*')
      .eq('slug', slug)
      .single();

    console.log('Supabase response:', { data: link, error });

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Link não encontrado', error }),
      };
    }

    if (!link) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Link não encontrado' }),
      };
    }

    const destinationUrl = link.destination_url.startsWith('http://') || link.destination_url.startsWith('https://')
      ? link.destination_url
      : `https://${link.destination_url}`;

    console.log('Redirecting to:', destinationUrl);

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
    console.error('Error details:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro interno do servidor', error: error.message }),
    };
  }
}; 