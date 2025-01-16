import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress, Box, Typography, Button } from '@mui/material';
import { getLinkBySlug } from '../services/supabase';

function RedirectPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const redirectToDestination = async () => {
      try {
        if (!slug) {
          navigate('/admin');
          return;
        }

        const link = await getLinkBySlug(slug);
        
        if (!link) {
          setError('Link não encontrado');
          return;
        }

        const destinationUrl = link.destination_url.startsWith('http://') || link.destination_url.startsWith('https://')
          ? link.destination_url
          : `https://${link.destination_url}`;

        window.location.href = destinationUrl;
      } catch (err) {
        setError('Erro ao buscar o link');
        console.error(err);
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
      >
        <Typography variant="h5" color="error" gutterBottom>
          {error}
        </Typography>
        <Typography variant="body1">
          O link solicitado não foi encontrado ou não está mais disponível.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/admin')} 
          sx={{ mt: 2 }}
        >
          Voltar ao Painel
        </Button>
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
    >
      <CircularProgress />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Redirecionando...
      </Typography>
    </Box>
  );
}

export default RedirectPage; 