import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Fade,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Link as LinkIcon,
  ArrowForward as ArrowForwardIcon,
  Error as ErrorIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { supabase } from '../services/supabase';

interface Link {
  destination_url: string;
  clicks: number;
}

export default function RedirectPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const redirectToDestination = async () => {
      try {
        if (!slug) {
          setError('Link inválido');
          return;
        }

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

        // Se o link existe, vamos incrementar o contador
        const { data: updateData, error: updateError } = await supabase
          .from('links')
          .update({ clicks: (link.clicks || 0) + 1 })
          .eq('slug', slug)
          .select('destination_url')
          .single();

        if (updateError) {
          console.error('Erro ao atualizar cliques:', updateError);
          window.location.href = link.destination_url;
          return;
        }

        // Simular progresso antes do redirecionamento
        const duration = 200; // 0.2 segundos (reduzido de 0.4s)
        const interval = 4; // Reduzido para animação mais rápida
        const steps = duration / interval;
        let currentStep = 0;

        const progressInterval = setInterval(() => {
          currentStep++;
          setProgress((currentStep / steps) * 100);

          if (currentStep >= steps) {
            clearInterval(progressInterval);
            window.location.href = updateData.destination_url;
          }
        }, interval);

      } catch (error) {
        console.error('Erro ao redirecionar:', error);
        setError('Erro ao processar redirecionamento');
      }
    };

    redirectToDestination();
  }, [slug, navigate]);

  if (error) {
    return (
      <Fade in timeout={800}>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
            p: 3
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              textAlign: 'center',
              maxWidth: 400,
              width: '100%',
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid',
              borderColor: 'error.light',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
            }}
          >
            <ErrorIcon
              sx={{
                fontSize: 48,
                color: 'error.main',
                mb: 2,
                animation: 'pulse 2s infinite'
              }}
            />
            <Typography
              variant="h6"
              sx={{
                color: 'error.main',
                fontWeight: 600,
                mb: 1,
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              {error}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mb: 3,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              O link que você está tentando acessar não está disponível.
            </Typography>
            <IconButton
              onClick={() => navigate('/')}
              sx={{
                bgcolor: 'error.light',
                color: '#fff',
                '&:hover': {
                  bgcolor: 'error.main',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease-in-out',
                p: 2
              }}
            >
              <HomeIcon />
            </IconButton>
          </Paper>
        </Box>
      </Fade>
    );
  }

  return (
    <Fade in timeout={200}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
          p: 2
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            textAlign: 'center',
            maxWidth: 300,
            width: '100%',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: 'primary.light',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
          }}
        >
          <Box
            sx={{
              position: 'relative',
              display: 'inline-flex',
              mb: 1.5
            }}
          >
            <CircularProgress
              variant="determinate"
              value={progress}
              size={50}
              thickness={4}
              sx={{
                color: 'primary.main',
                filter: 'drop-shadow(0 4px 12px rgba(25, 118, 210, 0.2))'
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LinkIcon
                sx={{
                  fontSize: 20,
                  color: 'primary.main',
                  animation: 'pulse 0.5s infinite'
                }}
              />
            </Box>
          </Box>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: 'primary.main',
              mb: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            Redirecionando
            <ArrowForwardIcon
              sx={{
                animation: 'slideRight 0.2s infinite',
                fontSize: 16
              }}
            />
          </Typography>
        </Paper>

        <style>
          {`
            @keyframes pulse {
              0% {
                transform: scale(1);
                opacity: 1;
              }
              50% {
                transform: scale(1.03);
                opacity: 0.9;
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }

            @keyframes slideRight {
              0% {
                transform: translateX(-1px);
                opacity: 0.5;
              }
              50% {
                transform: translateX(0);
                opacity: 1;
              }
              100% {
                transform: translateX(1px);
                opacity: 0.5;
              }
            }
          `}
        </style>
      </Box>
    </Fade>
  );
} 