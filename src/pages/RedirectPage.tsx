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
  Download as DownloadIcon,
} from '@mui/icons-material';
import { supabase } from '../services/supabase';
import PublicBioPage from '../pages/PublicBioPage';

interface Link {
  id: number;
  user_id: string;
  title: string;
  slug: string;
  url: string;
  destination_url: string;
  clicks: number;
  is_bio_link?: boolean;
  is_download?: boolean;
  is_self_destruct?: boolean;
  is_destroyed?: boolean;
  expires_at?: string;
  password?: string;
  created_at: string;
  advanced_type?: string;
}

const RedirectPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
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
  const [isDownloadPage, setIsDownloadPage] = useState(false);
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
    setError('');

    try {
      if (!linkData) {
        setError('Link não encontrado');
        return;
      }

      if (password !== linkData.password) {
        setError('Senha incorreta');
        return;
      }

        // Incrementar o contador de cliques
        const { error: updateError } = await supabase
          .from('links')
          .update({ 
          clicks: (linkData.clicks || 0) + 1,
          is_destroyed: linkData.is_self_destruct ? true : undefined
          })
          .eq('id', linkData.id);

        if (updateError) {
          console.error('Erro ao atualizar cliques:', updateError);
        }

        // Redirecionar para o destino
        window.location.href = linkData.destination_url;
    } catch (err) {
      console.error('Erro ao verificar senha:', err);
      setError('Erro ao verificar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (linkData?.destination_url) {
      try {
        // Incrementar o contador de cliques antes do download
        const { error: updateError } = await supabase
          .from('links')
          .update({ clicks: (linkData.clicks || 0) + 1 })
          .eq('id', linkData.id);

        if (updateError) {
          console.error('Erro ao atualizar cliques:', updateError);
        }

        // Redirecionar para o download
        window.location.href = linkData.destination_url;
      } catch (err) {
        console.error('Erro ao processar download:', err);
      }
    }
  };

  useEffect(() => {
    if (!slug) {
      navigate('/404');
      return;
    }

    const loadLink = async () => {
      try {
        // Buscar o link pelo slug
        const { data: link, error } = await supabase
          .from('links')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) {
          console.error('Erro ao carregar link:', error);
          navigate('/404');
          return;
        }

        if (!link) {
          navigate('/404');
          return;
        }

        // Verificar se o link expirou
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
          setError('Este link expirou');
          setExpiresAt(link.expires_at);
          return;
        }

        // Se for um link autodestrutivo (verificar ambas as flags)
        if (link.is_self_destruct || link.advanced_type === 'selfDestruct') {
          // Primeiro, verificar se já foi destruído
          const { data: currentLink, error: checkError } = await supabase
            .from('links')
            .select('is_destroyed')
            .eq('id', link.id)
            .single();

          if (checkError) {
            console.error('Erro ao verificar estado do link:', checkError);
            setError('Erro ao verificar estado do link');
            return;
          }

          // Se já foi destruído, mostrar mensagem
          if (currentLink?.is_destroyed) {
            setError('Este link já foi destruído');
            setDestroyed(true);
            return;
          }

          // Se não foi destruído ainda, marcar como destruído
          const { error: updateError } = await supabase
            .from('links')
            .update({ 
              is_destroyed: true,
              clicks: (link.clicks || 0) + 1,
              advanced_type: 'selfDestruct'
            })
            .eq('id', link.id);

          if (updateError) {
            console.error('Erro ao marcar link como destruído:', updateError);
            setError('Erro ao processar o link');
            return;
          }

          // Verificar se a atualização foi bem sucedida
          const { data: verifyLink, error: verifyError } = await supabase
            .from('links')
            .select('is_destroyed')
            .eq('id', link.id)
            .single();

          if (verifyError || !verifyLink?.is_destroyed) {
            console.error('Erro ao verificar atualização do link:', verifyError);
            setError('Erro ao processar o link');
          return;
        }

          // Se for um link de download
          if (link.is_download) {
            setLinkData({
              ...link,
              is_destroyed: true
            });
            setIsDownloadPage(true);
          return;
        }

          // Redirecionar para o destino
          window.location.href = link.destination_url;
          return;
        }

        // Verificar se é um link protegido por senha
        if (link.password) {
          setIsPasswordProtected(true);
          setLinkData(link);
          return;
        }

        // Se for um link de download
        if (link.is_download) {
          setIsDownloadPage(true);
          setLinkData(link);
          return;
        }

        // Se for uma página de bio
        if (link.is_bio_link) {
          console.log('Carregando bio:', link.user_id);
          setLinkData({
            ...link,
            isBioPage: true,
            userId: link.user_id
          });
          return;
        }

        // Incrementar o contador de cliques
        const { error: updateError } = await supabase
          .from('links')
          .update({ clicks: (link.clicks || 0) + 1 })
          .eq('id', link.id);

        if (updateError) {
          console.error('Erro ao atualizar cliques:', updateError);
        }

        // Redirecionar para o destino
        window.location.href = link.destination_url;
      } catch (err) {
        console.error('Erro ao carregar link:', err);
        navigate('/404');
      }
    };

    loadLink();
  }, [slug, navigate]);

  // Se for uma página de bio
  if (linkData?.is_bio_link) {
    return <PublicBioPage userId={linkData.user_id} />;
  }

  // Se for uma página de download
  if (isDownloadPage && linkData) {
    return (
      <Fade in timeout={800}>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
            p: 3,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Círculo animado com ondas */}
          <Box
            onClick={handleDownload}
            sx={{
              position: 'relative',
              width: { xs: 200, sm: 240 },
              height: { xs: 200, sm: 240 },
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              '&:hover': {
                '& .wave': {
                  animation: 'wave 1s linear infinite',
                }
              }
            }}
          >
            {/* Bolha de conversa flutuante */}
            <Box
              sx={{
                position: 'absolute',
                bottom: '102%',
                left: 0,
                right: 0,
                margin: '0 auto',
                width: '160px',
                animation: 'float 3s ease-in-out infinite',
                zIndex: 1,
                '@keyframes float': {
                  '0%, 100%': {
                    transform: 'translateY(0px)',
                  },
                  '50%': {
                    transform: 'translateY(-8px)',
                  },
                }
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: '8px 16px',
                  borderRadius: '16px',
                  position: 'relative',
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid',
                  borderColor: 'primary.light',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderWidth: '10px 10px 0',
                    borderStyle: 'solid',
                    borderColor: 'rgba(255, 255, 255, 0.9) transparent transparent',
                    filter: 'drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1))'
                  }
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    textAlign: 'center',
                    letterSpacing: '-0.02em',
                    whiteSpace: 'nowrap',
                    fontSize: '1rem'
                  }}
                >
                  Clique para baixar
                </Typography>
              </Paper>
            </Box>

            {/* Ondas animadas */}
            {[...Array(5)].map((_, index) => (
              <Box
                key={index}
                className="wave"
                sx={{
                  position: 'absolute',
                  border: `${20 - (index * 2)}px solid`,
                  borderColor: 'primary.main',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  opacity: 0,
                  filter: 'blur(2px)',
                  animation: 'wave 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                  animationDelay: `${index * 0.7}s`,
                  '@keyframes wave': {
                    '0%': {
                      transform: 'scale(1)',
                      opacity: 0.3,
                    },
                    '100%': {
                      transform: 'scale(1.5)',
                      opacity: 0,
                    }
                  }
                }}
              />
            ))}

            {/* Círculo central */}
            <Paper
              elevation={0}
              onClick={handleDownload}
              sx={{
                width: { xs: 160, sm: 200 },
                height: { xs: 160, sm: 200 },
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.main',
                color: 'white',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 8px 32px rgba(25, 118, 210, 0.25)',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 12px 48px rgba(25, 118, 210, 0.35)',
                },
                '&:active': {
                  bgcolor: 'primary.dark',
                  transform: 'scale(0.98)',
                  '& svg': {
                    animation: 'rotate 1.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }
                },
                '@keyframes rotate': {
                  '0%': {
                    transform: 'scale(1) rotate(0deg)',
                  },
                  '20%': {
                    transform: 'scale(0.98) rotate(90deg)',
                  },
                  '40%': {
                    transform: 'scale(0.95) rotate(180deg)',
                  },
                  '60%': {
                    transform: 'scale(0.95) rotate(270deg)',
                  },
                  '80%': {
                    transform: 'scale(0.98) rotate(330deg)',
                  },
                  '100%': {
                    transform: 'scale(1) rotate(360deg)',
                  }
                }
              }}
            >
              <Box
                component="svg"
                viewBox="0 0 512 512"
                xmlns="http://www.w3.org/2000/svg"
                sx={{ 
                  width: { xs: 64, sm: 80 },
                  height: { xs: 64, sm: 80 },
                  animation: 'pulse 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                  '@keyframes pulse': {
                    '0%': {
                      transform: 'scale(1)',
                    },
                    '50%': {
                      transform: 'scale(1.08)',
                    },
                    '100%': {
                      transform: 'scale(1)',
                    }
                  }
                }}
              >
                <path
                  fill="currentColor"
                  d="M256 0a256 256 0 1 0 0 512A256 256 0 1 0 256 0zM244.7 395.3l-112-112c-4.6-4.6-5.9-11.5-3.5-17.4s8.3-9.9 14.8-9.9l64 0 0-96c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32l0 96 64 0c6.5 0 12.3 3.9 14.8 9.9s1.1 12.9-3.5 17.4l-112 112c-6.2 6.2-16.4 6.2-22.6 0z"
                />
              </Box>
            </Paper>
          </Box>

          {/* Título do link */}
          <Box
            sx={{
              mt: 6,
              maxWidth: '90%',
              width: '500px',
              textAlign: 'center',
              animation: 'fadeIn 0.8s ease-out',
              '@keyframes fadeIn': {
                from: {
                  opacity: 0,
                  transform: 'translateY(10px)'
                },
                to: {
                  opacity: 1,
                  transform: 'translateY(0)'
                }
              }
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: 'primary.light',
                boxShadow: '0 4px 24px rgba(25, 118, 210, 0.12)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 32px rgba(25, 118, 210, 0.18)',
                  transform: 'translateY(-2px)',
                  borderColor: 'primary.main',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                  }}
                >
                  <LinkIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 600,
                    fontSize: { xs: '1.1rem', sm: '1.2rem' },
                    letterSpacing: '-0.01em',
                  }}
                >
                  Detalhes do Link
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 2.5,
                  bgcolor: 'rgba(25, 118, 210, 0.04)',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: 'primary.light',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    borderColor: 'primary.main',
                  }
                }}
              >
                <Box
                  component="svg"
                  viewBox="0 0 24 24"
                  sx={{
                    width: 22,
                    height: 22,
                    color: 'primary.main',
                    opacity: 0.9,
                  }}
                >
                  <path
                    fill="currentColor"
                    d="M18.5,4L19.66,8.35L18.7,8.61C18.25,7.74 17.79,6.87 17.26,6.43C16.73,6 16.11,6 15.5,6H13V16.5C13,17 13,17.5 13.33,17.75C13.67,18 14.33,18 15,18V19H9V18C9.67,18 10.33,18 10.67,17.75C11,17.5 11,17 11,16.5V6H8.5C7.89,6 7.27,6 6.74,6.43C6.21,6.87 5.75,7.74 5.3,8.61L4.34,8.35L5.5,4H18.5Z"
                  />
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    lineHeight: 1.5,
                    flex: 1,
                    wordBreak: 'break-word',
                    fontFamily: '"Inter", sans-serif',
                    letterSpacing: '-0.01em',
                    textShadow: '0 1px 2px rgba(25, 118, 210, 0.1)',
                    '&:hover': {
                      color: 'primary.dark',
                    },
                    transition: 'color 0.2s ease'
                  }}
                >
                  {(linkData?.title || 'Link sem título').split(' ').map((word, index) => (
                    word.length > 3 || index === 0 
                      ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                      : word.toLowerCase()
                  )).join(' ')}
                </Typography>
              </Box>
            </Paper>
          </Box>

          {/* Estilo global para animações */}
          <style>
            {`
              @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
              }
              @keyframes wave {
                0% {
                  transform: scale(1);
                  opacity: 0.3;
                }
                100% {
                  transform: scale(1.5);
                  opacity: 0;
                }
              }
            `}
          </style>
        </Box>
      </Fade>
    );
  }

  // Se o link expirou
  if (expiresAt) {
    return (
      <Fade in timeout={800}>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(145deg, #1976d2 0%, #1565c0 100%)',
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
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            <AccessTimeIcon
              sx={{
                fontSize: 64,
                color: '#1976d2',
                mb: 2,
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': {
                    transform: 'scale(1)',
                    opacity: 0.8,
                  },
                  '50%': {
                    transform: 'scale(1.1)',
                    opacity: 1,
                  },
                  '100%': {
                    transform: 'scale(1)',
                    opacity: 0.8,
                  },
                },
              }}
            />
            <Typography
              variant="h5"
              sx={{
                color: '#1976d2',
                fontWeight: 600,
                mb: 2
              }}
            >
              Link Expirado
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.primary',
                fontWeight: 500
              }}
            >
              Este link não está mais disponível pois atingiu sua data de expiração.
            </Typography>
          </Paper>
        </Box>
      </Fade>
    );
  }

  // Se o link foi destruído
  if (destroyed) {
    return (
      <Fade in timeout={800}>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
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
              borderColor: 'primary.light',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
            }}
          >
            <FlashOnIcon
              sx={{
                fontSize: 48,
                color: 'primary.main',
                mb: 2,
                animation: 'pulse 2s infinite'
              }}
            />
            <Typography
              variant="h6"
              sx={{
                color: 'primary.main',
                fontWeight: 600,
                mb: 1
              }}
            >
              Link Autodestrutivo
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mb: 2
              }}
            >
              Este link já foi acessado e se autodestruiu
            </Typography>
          </Paper>
        </Box>
      </Fade>
    );
  }

  // Se o link é protegido por senha
  if (isPasswordProtected && linkData) {
    return (
      <Fade in timeout={800}>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
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
            flexDirection: 'column',
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
    <Box sx={{ 
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
      background: 'linear-gradient(135deg, #f6f8fc 0%, #e9eef6 100%)'
    }}>
      <CircularProgress />
            </Box>
  );
};

export default RedirectPage; 