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
  TextField,
  Button,
} from '@mui/material';
import {
  Link as LinkIcon,
  ArrowForward as ArrowForwardIcon,
  Error as ErrorIcon,
  Home as HomeIcon,
  AccessTime as AccessTimeIcon,
  FlashOn as FlashOnIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { supabase } from '../services/supabase';

interface Link {
  destination_url: string;
  clicks: number;
  advanced_type?: string;
  expires_at?: string | null;
  password?: string | null;
  id: number;
}

export default function RedirectPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [destroyed, setDestroyed] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linkData, setLinkData] = useState<Link | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diff = expiration.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    const parts = [];
    if (days > 0) parts.push(`${days} dias`);
    if (hours > 0) parts.push(`${hours} horas`);
    if (minutes > 0) parts.push(`${minutes} minutos`);
    
    return parts.join(', ');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!linkData) return;

      if (password === linkData.password) {
        // Incrementar o contador de cliques
        const { error: updateError } = await supabase
          .from('links')
          .update({ 
            clicks: (linkData.clicks || 0) + 1 
          })
          .eq('id', linkData.id);

        if (updateError) {
          console.error('Erro ao atualizar cliques:', updateError);
        }

        // Redirecionar para o destino
        window.location.href = linkData.destination_url;
      } else {
        setError('Senha incorreta');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error('Erro ao verificar senha:', err);
      setError('Erro ao verificar senha');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const redirect = async () => {
      try {
        // Buscar o link pelo slug
        const { data: links, error: linkError } = await supabase
          .from('links')
          .select('id, destination_url, advanced_type, expires_at, is_destroyed, clicks, password')
          .eq('slug', slug)
          .single();

        if (linkError || !links) {
          navigate('/404');
          return;
        }

        setLinkData(links);

        // Verificar se o link expirou
        if (links.advanced_type === 'expirable' && links.expires_at) {
          const now = new Date();
          const expirationDate = new Date(links.expires_at);
          
          if (now > expirationDate) {
            navigate('/link-expirado');
            return;
          }
        }

        // Verificar se o link é autodestrutivo e já foi destruído
        if (links.advanced_type === 'selfDestruct' && links.is_destroyed) {
          setError('Este link já foi acessado e se autodestruiu');
          setDestroyed(true);
          return;
        }

        // Verificar se o link é protegido por senha
        if (links.advanced_type === 'password' && links.password) {
          setIsPasswordProtected(true);
          return;
        }

        // Se não for protegido por senha, continuar com o redirecionamento normal
        const { error: updateError } = await supabase
          .from('links')
          .update({ 
            clicks: (links.clicks || 0) + 1 
          })
          .eq('id', links.id);

        if (updateError) {
          console.error('Erro ao atualizar cliques:', updateError);
        }

        // Se for um link autodestrutivo, marcar como destruído
        if (links.advanced_type === 'selfDestruct') {
          await supabase
            .from('links')
            .update({ is_destroyed: true })
            .eq('id', links.id);
        }

        // Redirecionar para o destino
        window.location.href = links.destination_url;
      } catch (error) {
        console.error('Erro ao redirecionar:', error);
        navigate('/404');
      }
    };

    redirect();
  }, [slug, navigate]);

  if (isPasswordProtected) {
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
            component="form"
            onSubmit={handlePasswordSubmit}
            sx={{
              p: 4,
              borderRadius: 4,
              textAlign: 'center',
              maxWidth: 400,
              width: '100%',
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid',
              borderColor: error ? 'error.light' : 'primary.light',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s ease-in-out'
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 2,
                  transform: 'rotate(-5deg)',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
                }}
              >
                <LinkIcon sx={{ fontSize: 28, color: '#fff' }} />
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  mb: 1,
                  letterSpacing: '-0.02em'
                }}
              >
                Link Protegido
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.875rem'
                }}
              >
                Digite a senha para acessar este link
              </Typography>
            </Box>

            <Box sx={{ position: 'relative' }}>
              <TextField
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                fullWidth
                error={!!error}
                helperText={error}
                disabled={loading}
                required
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      sx={{ color: 'text.secondary' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                  sx: {
                    height: '44px',
                    bgcolor: '#f8fafc',
                    '&:hover': {
                      bgcolor: '#fff'
                    }
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'divider'
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main'
                    }
                  }
                }}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                height: '44px',
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                  bgcolor: 'primary.dark'
                }
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: '#fff' }} />
              ) : (
                'Acessar Link'
              )}
            </Button>
          </Paper>
        </Box>
      </Fade>
    );
  }

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
              borderColor: destroyed ? 'primary.light' : 'error.light',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
            }}
          >
            {destroyed ? (
              <FlashOnIcon
                sx={{
                  fontSize: 48,
                  color: 'primary.main',
                  mb: 2,
                  animation: 'pulse 2s infinite'
                }}
              />
            ) : (
              <ErrorIcon
                sx={{
                  fontSize: 48,
                  color: 'error.main',
                  mb: 2,
                  animation: 'pulse 2s infinite'
                }}
              />
            )}
            <Typography
              variant="h6"
              sx={{
                color: destroyed ? 'primary.main' : 'error.main',
                fontWeight: 600,
                mb: 1,
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              {error}
            </Typography>
            {destroyed && (
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  mb: 3,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Links autodestrutivos só podem ser acessados uma única vez.
              </Typography>
            )}
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

          {expiresAt && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <AccessTimeIcon sx={{ color: 'primary.main', fontSize: 16 }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Expira em {getTimeRemaining(expiresAt)}
              </Typography>
            </Box>
          )}

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
        </Paper>
      </Box>
    </Fade>
  );
} 