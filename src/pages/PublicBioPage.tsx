import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Avatar,
  Paper,
  useTheme,
  alpha,
  Fade,
  Grow
} from '@mui/material';
import {
  Instagram,
  Facebook,
  Twitter,
  LinkedIn,
  YouTube,
  Language,
  Link as LinkIcon,
  WhatsApp,
  Telegram,
  GitHub,
  Reddit,
  Pinterest,
  Email,
  Phone,
  Store,
  LocationOn,
  CalendarMonth,
  PlayArrow,
  Newspaper,
  Storefront,
  Payments,
  Message,
  Public,
  Code,
  Apartment,
  MenuBook,
  School,
  CameraAlt,
  Videocam,
  VerifiedRounded
} from '@mui/icons-material';
import { 
  SiTiktok, 
  SiX, 
  SiThreads, 
  SiSpotify, 
  SiDiscord, 
  SiTwitch,
  SiSnapchat,
  SiMedium,
  SiBuymeacoffee,
  SiSubstack,
  SiPatreon,
  SiKofi
} from 'react-icons/si';
import { motion } from 'framer-motion';
import { supabase } from '../services/supabase';

interface BioLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  sort_order: number;
}

interface UserProfile {
  bio_name: string;
  bio_avatar_url: string | null;
}

interface PublicBioPageProps {
  userId?: string;
}

const AVAILABLE_ICONS = {
  instagram: <Instagram sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  facebook: <Facebook sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  twitter: <Twitter sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  x: <SiX size="24px" />,
  linkedin: <LinkedIn sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  youtube: <YouTube sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  tiktok: <SiTiktok size="24px" />,
  threads: <SiThreads size="24px" />,
  snapchat: <SiSnapchat size="24px" />,
  whatsapp: <WhatsApp sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  telegram: <Telegram sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  github: <GitHub sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  reddit: <Reddit sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  pinterest: <Pinterest sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  spotify: <SiSpotify size="24px" />,
  discord: <SiDiscord size="24px" />,
  twitch: <SiTwitch size="24px" />,
  medium: <SiMedium size="24px" />,
  buymeacoffee: <SiBuymeacoffee size="24px" />,
  substack: <SiSubstack size="24px" />,
  patreon: <SiPatreon size="24px" />,
  kofi: <SiKofi size="24px" />,
  email: <Email sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  phone: <Phone sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  store: <Store sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  location: <LocationOn sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  calendar: <CalendarMonth sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  play: <PlayArrow sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  news: <Newspaper sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  shop: <Storefront sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  payment: <Payments sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  chat: <Message sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  website: <Language sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  globe: <Public sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  code: <Code sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  company: <Apartment sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  blog: <MenuBook sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  education: <School sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  photo: <CameraAlt sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  video: <Videocam sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />,
  link: <LinkIcon sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />
};

const PublicBioPage: React.FC<PublicBioPageProps> = ({ userId: propUserId }) => {
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const [links, setLinks] = useState<BioLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const theme = useTheme();

  // Usar o userId da prop se disponível, senão usar o da URL
  const userId = propUserId || paramUserId;

  useEffect(() => {
    if (!userId) {
      setError('ID do usuário não encontrado');
      setLoading(false);
      return;
    }

    loadUserAndLinks();
  }, [userId]);

  const loadUserAndLinks = async () => {
    try {
      if (!userId) {
        throw new Error('ID do usuário não encontrado');
      }

      // Carregar perfil do usuário
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id, bio_name, bio_avatar_url')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Erro ao carregar usuário:', userError);
        throw userError;
      }

      if (!userData) {
        throw new Error('Usuário não encontrado');
      }

      setUserProfile(userData);

      // Carregar links
      const { data: bioLinks, error: linksError } = await supabase
        .from('bio_links')
        .select('*')
        .eq('user_id', userData.id)
        .order('sort_order');

      if (linksError) {
        console.error('Erro ao carregar links:', linksError);
        throw linksError;
      }

      setLinks(bioLinks || []);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message || 'Erro ao carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f6f8fc 0%, #e9eef6 100%)'
      }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      sx={{ 
        height: ['100vh', '100dvh'],
        background: 'linear-gradient(145deg, #f8fafc 0%, #e9eef6 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Animated Background */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '0%',
          left: '0%',
          width: '200%',
          height: '200%',
          background: `
            radial-gradient(circle at 50% 50%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 50%),
            radial-gradient(circle at 0% 0%, ${alpha(theme.palette.primary.light, 0.12)} 0%, transparent 40%),
            radial-gradient(circle at 100% 0%, ${alpha(theme.palette.secondary.main, 0.08)} 0%, transparent 40%),
            radial-gradient(circle at 100% 100%, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 40%),
            radial-gradient(circle at 0% 100%, ${alpha(theme.palette.secondary.light, 0.08)} 0%, transparent 40%)
          `,
          animation: 'moveGradient 15s ease infinite'
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '0%',
          left: '0%',
          width: '200%',
          height: '200%',
          background: `
            radial-gradient(circle at 30% 70%, ${alpha(theme.palette.primary.light, 0.08)} 0%, transparent 50%),
            radial-gradient(circle at 70% 30%, ${alpha(theme.palette.secondary.light, 0.08)} 0%, transparent 50%)
          `,
          animation: 'moveGradient 20s ease infinite reverse'
        },
        '@keyframes moveGradient': {
          '0%': {
            transform: 'translate(0%, 0%) rotate(0deg)'
          },
          '25%': {
            transform: 'translate(-25%, 0%) rotate(2deg)'
          },
          '50%': {
            transform: 'translate(-25%, -25%) rotate(0deg)'
          },
          '75%': {
            transform: 'translate(0%, -25%) rotate(-2deg)'
          },
          '100%': {
            transform: 'translate(0%, 0%) rotate(0deg)'
          }
        }
      }} />

      {/* Floating Shapes */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        overflow: 'hidden',
        opacity: 0.5,
        '& > div': {
          position: 'absolute',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.primary.light, 0.2)})`,
          animation: 'float 20s infinite',
          '&:nth-of-type(1)': {
            width: '300px',
            height: '300px',
            left: '-150px',
            top: '-150px',
            animationDelay: '0s'
          },
          '&:nth-of-type(2)': {
            width: '250px',
            height: '250px',
            right: '-125px',
            top: '30%',
            animationDelay: '-5s'
          },
          '&:nth-of-type(3)': {
            width: '200px',
            height: '200px',
            left: '20%',
            bottom: '-100px',
            animationDelay: '-10s'
          }
        },
        '@keyframes float': {
          '0%, 100%': {
            transform: 'translate(0, 0) rotate(0deg)'
          },
          '25%': {
            transform: 'translate(10%, 10%) rotate(5deg)'
          },
          '50%': {
            transform: 'translate(5%, -5%) rotate(0deg)'
          },
          '75%': {
            transform: 'translate(-5%, 5%) rotate(-5deg)'
          }
        }
      }}>
        <div />
        <div />
        <div />
      </Box>

      <Container 
        maxWidth="sm" 
        sx={{ 
          position: 'relative',
          zIndex: 1,
          py: { xs: 4, sm: 6 },
          px: { xs: 2, sm: 3 },
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          flex: 1
        }}>
          {/* Profile Section */}
          <Fade in timeout={1000}>
            <Box sx={{ 
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: { xs: 4, sm: 5 }
            }}>
              <Box
                component={motion.div}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300 }}
                sx={{
                  position: 'relative',
                  width: { xs: 100, sm: 120 },
                  height: { xs: 100, sm: 120 },
                  mb: { xs: 2, sm: 2.5 },
                  '@media (max-height: 667px)': {
                    width: 80,
                    height: 80
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -3,
                    left: -3,
                    right: -3,
                    bottom: -3,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.light, 0.8)}, ${theme.palette.primary.main})`,
                    backgroundSize: '300% 300%',
                    animation: 'spin 3s linear infinite, pulse 2s ease-in-out infinite',
                    boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.5)}`,
                    zIndex: 0
                  },
                  '@keyframes spin': {
                    '0%': {
                      backgroundPosition: '0% 0%'
                    },
                    '100%': {
                      backgroundPosition: '300% 300%'
                    }
                  },
                  '@keyframes pulse': {
                    '0%': {
                      transform: 'scale(1)',
                      opacity: 1
                    },
                    '50%': {
                      transform: 'scale(1.05)',
                      opacity: 0.8
                    },
                    '100%': {
                      transform: 'scale(1)',
                      opacity: 1
                    }
                  }
                }}
              >
                <Avatar
                  src={userProfile?.bio_avatar_url || undefined}
                  sx={{
                    width: '100%',
                    height: '100%',
                    border: '4px solid white',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
                    bgcolor: userProfile?.bio_name 
                      ? `hsl(${userProfile.bio_name.charCodeAt(0) * 10}, 70%, 50%)`
                      : theme.palette.primary.main,
                    fontSize: { xs: '2.25rem', sm: '2.75rem' },
                    fontWeight: 600,
                    transition: 'all 0.3s ease-in-out',
                    position: 'relative',
                    zIndex: 1,
                    '@media (max-height: 667px)': {
                      fontSize: '1.75rem'
                    }
                  }}
                >
                  {userProfile?.bio_name?.charAt(0).toUpperCase() || '?'}
                </Avatar>
              </Box>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 600,
                  textAlign: 'center',
                  color: 'text.primary',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  opacity: 0.9,
                  letterSpacing: '-0.02em',
                  px: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  '@media (max-height: 667px)': {
                    fontSize: '1.125rem'
                  }
                }}
              >
                {userProfile?.bio_name || 'Usuário'}
                <VerifiedRounded 
                  sx={{ 
                    color: theme.palette.primary.main,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    '@media (max-height: 667px)': {
                      fontSize: '1.125rem'
                    }
                  }} 
                />
              </Typography>
            </Box>
          </Fade>

          {/* Links Section */}
          <Box sx={{ 
            width: '100%',
            flex: 1,
      display: 'flex',
      flexDirection: 'column',
            gap: { xs: 2, sm: 2.5 }
          }}>
            {links.length === 0 ? (
              <Grow in timeout={1000}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: { xs: 3, sm: 4 },
                    borderRadius: { xs: 2.5, sm: 3 },
                    textAlign: 'center',
                    bgcolor: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    Nenhum link disponível.
                  </Typography>
                </Paper>
              </Grow>
            ) : (
              links.map((link, index) => (
                <Grow
                  key={link.id}
                  in
                  timeout={400 + (index * 100)}
                >
                  <Box
                    component={motion.div}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                  >
          <Button
            variant="contained"
            fullWidth
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={AVAILABLE_ICONS[link.icon as keyof typeof AVAILABLE_ICONS]}
            sx={{
              py: { xs: 2.5, sm: 3 },
              px: { xs: 2.5, sm: 3 },
              borderRadius: { xs: '16px', sm: '18px' },
              textTransform: 'none',
              fontSize: { xs: '1rem', sm: '1.125rem' },
              fontWeight: 600,
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
              fontFamily: theme.typography.fontFamily,
              bgcolor: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              color: theme.palette.primary.main,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              height: { xs: '64px', sm: '72px' },
              position: 'relative',
              display: 'flex !important',
              alignItems: 'center !important',
              justifyContent: 'center !important',
              '@media (max-height: 667px)': {
                height: '56px'
              },
              '&:hover': {
                bgcolor: 'white',
                borderColor: theme.palette.primary.main,
                boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
                transform: 'translateY(-1px)',
                '& .MuiButton-startIcon': {
                  color: theme.palette.primary.dark
                },
                color: theme.palette.primary.dark
              },
              '&:active': {
                boxShadow: 'none',
                transform: 'translateY(0)'
              },
              transition: 'all 0.2s ease-in-out',
              '& .MuiButton-startIcon': {
                position: 'absolute',
                left: '16px',
                margin: '0 !important',
                color: theme.palette.primary.main,
                display: 'flex !important',
                alignItems: 'center !important',
                justifyContent: 'center !important',
                minWidth: '40px',
                transition: 'color 0.2s ease-in-out',
                '& > *': {
                  margin: '0 !important',
                  fontSize: 'inherit !important',
                  width: 'auto !important',
                  height: 'auto !important',
                  display: 'flex !important'
                },
                '& > svg': {
                  fontSize: { xs: '1.5rem', sm: '1.75rem' } 
                }
              },
              '& .MuiButton-endIcon': {
                margin: 0
              },
              '&:hover .MuiButton-startIcon': {
                transform: 'scale(1.1)'
              }
            }}
          >
            {link.title}
          </Button>
                  </Box>
                </Grow>
              ))
            )}
          </Box>
      </Box>
    </Container>
    </Box>
  );
};

export default PublicBioPage; 