import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { supabase } from '../services/supabase';

interface Link {
  destination_url: string;
  clicks: number;
}

export default function RedirectPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirectToDestination = async () => {
      try {
        if (!slug) {
          setError('Link inválido');
          return;
        }

        console.log('Tentando redirecionar slug:', slug);

        // Primeiro, vamos verificar se o link existe
        const { data: linkData, error: linkError } = await supabase
          .from('links')
          .select('destination_url, clicks')
          .eq('slug', slug)
          .single();

        if (linkError || !linkData) {
          console.error('Link não encontrado:', linkError);
          setError('Link não encontrado');
          return;
        }

        const link = linkData as Link;
        console.log('Link encontrado:', link);

        // Se o link existe, vamos incrementar o contador
        const { data: updateData, error: updateError } = await supabase
          .from('links')
          .update({ clicks: (link.clicks || 0) + 1 })
          .eq('slug', slug)
          .select('destination_url')
          .single();

        if (updateError) {
          console.error('Erro ao atualizar cliques:', updateError);
          // Mesmo se der erro ao atualizar cliques, vamos redirecionar
          window.location.href = link.destination_url;
          return;
        }

        console.log('Cliques atualizados, redirecionando...');

        // Redirecionar para o destino
        window.location.href = updateData.destination_url;
      } catch (error) {
        console.error('Erro ao redirecionar:', error);
        setError('Erro ao processar redirecionamento');
      }
    };

    redirectToDestination();
  }, [slug, navigate]);

  if (error) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="100vh"
        gap={2}
      >
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        <Typography 
          variant="body2" 
          color="primary" 
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Voltar para página inicial
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="100vh"
      gap={2}
    >
      <CircularProgress size={40} />
      <Typography variant="body1" color="textSecondary">
        Redirecionando...
      </Typography>
    </Box>
  );
} 