import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('As variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para detectar o tipo de dispositivo
const detectDeviceType = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
};

export const handler: Handler = async (event) => {
  try {
    console.log('Event received:', {
      path: event.path,
      headers: event.headers,
      method: event.httpMethod
    });

    // Extrair o slug da URL
    const slug = event.path.split('/').filter(Boolean)[0];
    console.log('Extracted slug:', slug);

    if (!slug) {
      console.log('No slug provided');
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Slug não fornecido' }),
      };
    }

    // Buscar o link no Supabase
    const { data: link, error } = await supabase
      .from('links')
      .select('*')
      .eq('slug', slug)
      .single();

    console.log('Supabase link query result:', { link, error });

    if (error || !link) {
      console.error('Link not found:', error);
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Link não encontrado' }),
      };
    }

    // Detectar tipo de dispositivo
    const deviceType = detectDeviceType(event.headers['user-agent'] || '');
    console.log('Device detection:', {
      userAgent: event.headers['user-agent'],
      detectedType: deviceType
    });

    // Registrar o clique
    try {
      const clickResult = await supabase
        .from('clicks')
        .insert({
          link_id: Number(link.id),
          device_type: deviceType,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      console.log('Click registration result:', clickResult);
    } catch (clickError) {
      console.error('Error registering click:', clickError);
    }

    // Preparar URL de destino
    const destinationUrl = link.destination_url.startsWith('http://') || link.destination_url.startsWith('https://')
      ? link.destination_url
      : `https://${link.destination_url}`;

    console.log('Redirecting to:', destinationUrl);

    // Retornar redirecionamento
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
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro interno do servidor', error: error.message }),
    };
  }
}; 