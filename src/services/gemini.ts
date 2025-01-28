import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('VITE_GEMINI_API_KEY não está definida no arquivo .env');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface SuggestionResponse {
  title: string;
  slug: string;
}

// Função para extrair o ID do vídeo do YouTube de uma URL
function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Função para buscar metadados do vídeo do YouTube
async function fetchYoutubeMetadata(url: string): Promise<{ title: string; description?: string; author?: string } | null> {
  try {
    const videoId = extractYoutubeVideoId(url);
    if (!videoId) return null;

    // Usando a API de oEmbed do YouTube para obter mais informações
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    const data = await response.json();
    
    return {
      title: data.title,
      description: data.description || undefined,
      author: data.author_name || undefined
    };
  } catch (error) {
    console.error('Erro ao buscar metadados do YouTube:', error);
    return null;
  }
}

async function fetchUrlContent(url: string): Promise<string> {
  try {
    // Primeiro verifica se é um link do YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const metadata = await fetchYoutubeMetadata(url);
      if (metadata) {
        return `YOUTUBE_VIDEO_TITLE: ${metadata.title}`;
      }
    }

    // Se não for YouTube ou falhar, tenta buscar o conteúdo normalmente
    const response = await fetch(url);
    const html = await response.text();
    return html;
  } catch (error) {
    console.error('Erro ao acessar URL:', error);
    return ''; // Retorna string vazia se não conseguir acessar
  }
}

async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    // Verifica se o slug existe no banco
    const { data, error } = await supabase
      .from('links')
      .select('slug')
      .eq('slug', slug)
      .single();
    
    if (error || !data) {
      // Se der erro ou não encontrar, significa que o slug está disponível
      return slug;
    }
    
    // Se encontrou, adiciona um número ao final e tenta novamente
    slug = `${baseSlug}-${counter}`;
    counter++;
    
    // Proteção para não entrar em loop infinito
    if (counter > 100) {
      throw new Error('Não foi possível gerar um slug único');
    }
  }
}

// Função para extrair metadados de uma página web
async function fetchWebsiteMetadata(url: string): Promise<{ 
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
} | null> {
  try {
    // Usa o servidor proxy para evitar problemas de CORS
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const html = await response.text();
    
    // Cria um parser de DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extrai os metadados
    const metadata: any = {};
    
    // Título da página
    metadata.title = doc.querySelector('title')?.textContent?.trim();
    
    // Meta description
    metadata.description = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim();
    
    // Meta keywords
    metadata.keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content')?.trim();
    
    // Open Graph tags
    metadata.ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim();
    metadata.ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim();
    
    return metadata;
  } catch (error) {
    console.error('Erro ao extrair metadados:', error);
    return null;
  }
}

export async function generateTitleAndSlug(url: string): Promise<SuggestionResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Primeiro tenta extrair informações do YouTube se for um vídeo
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const metadata = await fetchYoutubeMetadata(url);
      if (metadata) {
        const prompt = `
          Analise este vídeo do YouTube:
          Título: "${metadata.title}"
          ${metadata.author ? `Canal: "${metadata.author}"` : ''}
          ${metadata.description ? `Descrição: "${metadata.description}"` : ''}
          
          Gere:
          1. Um título curto e descritivo em português que represente o conteúdo do vídeo.
          2. Um slug ultra curto (máximo 20 caracteres) que capture a essência do conteúdo.
          
          Para o título:
          - Máximo 50 caracteres
          - Se já estiver em português, apenas remova partes desnecessárias
          - Se estiver em inglês, traduza mantendo o significado principal
          
          Para o slug:
          - Máximo 20 caracteres
          - Use apenas palavras-chave essenciais
          - Evite artigos e preposições
          - Prefira substantivos e verbos principais
          
          Responda APENAS no seguinte formato JSON:
          {
            "title": "título sugerido",
            "slug": "slug-curto"
          }
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          // Se falhar em gerar, usa o título original
          const slug = metadata.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          
          return {
            title: metadata.title,
            slug: await generateUniqueSlug(slug)
          };
        }

        const suggestion = JSON.parse(jsonMatch[0]) as SuggestionResponse;
        suggestion.slug = suggestion.slug
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '')
          .replace(/--+/g, '-')
          .replace(/^-|-$/g, '');

        return {
          title: suggestion.title,
          slug: await generateUniqueSlug(suggestion.slug)
        };
      }
    }
    
    // Para outros sites, tenta extrair metadados
    const metadata = await fetchWebsiteMetadata(url);
    
    const prompt = `
      Analise esta página web:
      URL: "${url}"
      ${metadata?.title ? `Título: "${metadata.title}"` : ''}
      ${metadata?.description ? `Descrição: "${metadata.description}"` : ''}
      ${metadata?.keywords ? `Palavras-chave: "${metadata.keywords}"` : ''}
      ${metadata?.ogTitle ? `Título OG: "${metadata.ogTitle}"` : ''}
      ${metadata?.ogDescription ? `Descrição OG: "${metadata.ogDescription}"` : ''}
      
      Gere:
      1. Um título descritivo em português que represente bem o conteúdo
      2. Um slug ultra curto (máximo 20 caracteres) que capture a essência do conteúdo
      
      Para o título:
      - Máximo 50 caracteres
      - Deve ser atraente e informativo
      - Se já estiver em português, apenas simplifique
      - Se estiver em outro idioma, traduza para português
      
      Para o slug:
      - Máximo 20 caracteres
      - Use apenas palavras-chave essenciais
      - Evite artigos e preposições
      - Prefira substantivos e verbos principais
      - Exemplos bons: "receita-bolo", "curso-js", "guia-react"
      - Exemplos ruins: "como-fazer-um-bolo", "curso-completo-de-js"
      
      Responda APENAS no seguinte formato JSON:
      {
        "title": "título sugerido",
        "slug": "slug-curto"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Se tiver metadados e o Gemini falhar, usa o título da página
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch && metadata?.title) {
      // Gera um slug curto a partir do título
      const words = metadata.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2) // Remove palavras muito curtas
        .filter(word => !['como', 'para', 'com', 'dos', 'das', 'que', 'por'].includes(word)); // Remove palavras comuns
      
      const slug = words
        .slice(0, 2) // Pega apenas as duas primeiras palavras relevantes
        .join('-')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');
      
      return {
        title: metadata.title,
        slug: await generateUniqueSlug(slug)
      };
    }

    // Extrair o JSON da resposta
    if (!jsonMatch) {
      throw new Error('Formato de resposta inválido');
    }

    const suggestion = JSON.parse(jsonMatch[0]) as SuggestionResponse;

    // Garantir que o slug esteja no formato correto
    suggestion.slug = suggestion.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Gerar um slug único
    suggestion.slug = await generateUniqueSlug(suggestion.slug);

    return suggestion;
  } catch (error) {
    console.error('Erro ao gerar sugestões:', error);
    throw new Error('Não foi possível gerar sugestões para o link');
  }
} 