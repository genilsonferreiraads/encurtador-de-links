import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  TextField,
  CircularProgress,
  IconButton,
  Tooltip,
  Link,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  Zoom,
  Paper,
  Snackbar,
  Alert,
  Avatar,
  InputBase,
  InputAdornment,
  Stack,
  FormControlLabel,
  Radio,
  Collapse,
} from '@mui/material';
import {
  ContentCopy as ContentCopyIcon,
  Launch as LaunchIcon,
  Link as LinkIcon,
  AccessTime as TimeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Title as TitleIcon,
  InsertLink as InsertLinkIcon,
  Download as DownloadIcon,
  QrCode as QrCodeIcon,
  Share as ShareIcon,
  AccessTime as AccessTimeIcon,
  Lock as LockIcon,
  FlashOn as FlashOnIcon,
  Timer as TimerIcon,
  Visibility as VisibilityIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { supabase, getCurrentUser } from '../services/supabase';
import { QRCodeSVG } from 'qrcode.react';

interface Link {
  id: number;
  title: string;
  slug: string;
  destination_url: string;
  created_at: string;
  clicks: number;
  advanced_type: 'expirable' | 'selfDestruct' | 'password' | null;
  expires_at: string | null;
  is_destroyed: boolean;
}

interface EditForm {
  title: string;
  slug: string;
  destinationUrl: string;
}

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [editForm, setEditForm] = useState<EditForm>({ title: '', slug: '', destinationUrl: '' });
  const [openPopupId, setOpenPopupId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    open: false,
    message: '',
    type: 'success'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [openQRCodeId, setOpenQRCodeId] = useState<number | null>(null);
  const [highlightedLinkId, setHighlightedLinkId] = useState<number | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          navigate('/login');
          return;
        }
        setUser(currentUser);
        await loadLinks();
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  useEffect(() => {
    if (location.state?.successMessage) {
      showNotification(location.state.successMessage, 'success');
      navigate(location.pathname, { replace: true });
    }

    if (location.state?.newLinkId) {
      setHighlightedLinkId(location.state.newLinkId);
      setTimeout(() => setHighlightedLinkId(null), 3000);
    }
  }, [location]);

  const loadLinks = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: linksData, error } = await supabase
        .from('links')
        .select('id, title, slug, destination_url, created_at, clicks, advanced_type, expires_at, is_destroyed')
        .eq('user_id', user.id)
        .eq('is_bio_link', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setLinks(linksData || []);
    } catch (error) {
      console.error('Erro ao carregar links:', error);
      showNotification('Erro ao carregar links', 'error');
    }
  };

  const handleCopyLink = async (shortUrl: string) => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopySuccess(shortUrl);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar link:', err);
    }
  };

  const getShortUrl = (slug: string) => {
    return `${window.location.origin}/${slug}`;
  };

  const cleanSlug = (value: string) => {
    // Remove espaços, pontos e caracteres especiais
    // Mantém apenas letras, números, hífen e underscore
    return value.toLowerCase()
      .replace(/[^a-z0-9-_]/g, '')
      .replace(/\.+/g, '')
      .replace(/\s+/g, '-');
  };

  const handleEditClick = (link: any) => {
    setEditingLink(link);
    setEditForm({
      title: link.title || '',
      slug: link.slug,
      destinationUrl: link.destination_url
    });
  };

  const handleEditClose = () => {
    setEditingLink(null);
    setEditForm({ title: '', slug: '', destinationUrl: '' });
  };

  const handleEditSave = async () => {
    try {
      const formattedUrl = editForm.destinationUrl.startsWith('http://') || editForm.destinationUrl.startsWith('https://')
        ? editForm.destinationUrl
        : `https://${editForm.destinationUrl}`;

      const { error } = await supabase
        .from('links')
        .update({
          title: editForm.title,
          slug: editForm.slug,
          destination_url: formattedUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingLink.id);

      if (error) throw error;

      await loadLinks();
      handleEditClose();
      showNotification('Link atualizado com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao atualizar link:', error);
      showNotification(error.message || 'Erro ao atualizar link. Tente novamente.', 'error');
    }
  };

  const handleDeleteClick = async (link: any) => {
    try {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', link.id);

      if (error) throw error;

      await loadLinks();
      showNotification('Link excluído com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao excluir link:', error);
      showNotification(error.message || 'Erro ao excluir link. Tente novamente.', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({
      open: true,
      message,
      type
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Filtrar os links baseado no termo de pesquisa
  const filteredLinks = links.filter(link => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      link.title?.toLowerCase().includes(searchTermLower) ||
      link.slug.toLowerCase().includes(searchTermLower) ||
      link.destination_url.toLowerCase().includes(searchTermLower)
    );
  });

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diff = expiration.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days} ${days === 1 ? 'dia' : 'dias'} para expirar`;
    if (hours > 0) return `${hours} ${hours === 1 ? 'hora' : 'horas'} para expirar`;
    if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} para expirar`;
    
    return 'Menos de 1 minuto para expirar';
  };

  const handleQRCodeClick = (id: number) => {
    setOpenQRCodeId(id);
  };

  const handleQRCodeClose = () => {
    setOpenQRCodeId(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100%',
      background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
      py: { xs: 0, sm: 4 },
      width: '100%',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <Container 
        maxWidth="md" 
        sx={{ 
          px: { xs: 0, sm: 3 },
          maxWidth: { sm: '800px' },
          margin: '0 auto'
        }}
      >
        {/* Card Principal */}
        <Paper 
          elevation={0} 
            sx={{ 
            borderRadius: { xs: 0, sm: '24px' },
            overflow: 'hidden',
            border: { xs: 'none', sm: '1px solid' },
            borderColor: { xs: 'transparent', sm: 'rgba(0,0,0,0.08)' },
            bgcolor: '#ffffff',
            boxShadow: { xs: 'none', sm: '0 4px 40px rgba(0,0,0,0.03)' },
            transition: 'all 0.3s ease-in-out',
            minHeight: { xs: '100vh', sm: 'auto' },
              '&:hover': {
              boxShadow: { xs: 'none', sm: '0 4px 40px rgba(0,0,0,0.06)' },
              transform: { xs: 'none', sm: 'translateY(-2px)' },
              borderColor: { xs: 'transparent', sm: 'rgba(25, 118, 210, 0.2)' }
            }
          }}
        >
          {/* Cabeçalho Estilizado */}
          <Box 
            sx={{ 
              p: { xs: 2.5, sm: 4 },
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 2, sm: 2 }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  bgcolor: 'primary.main', 
                  p: 1.5,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(25, 118, 210, 0.2)',
                  transform: 'rotate(-5deg)'
                }}>
                  <TimeIcon sx={{ 
                    fontSize: { xs: 24, sm: 28 }, 
                    color: '#fff',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                  }} />
        </Box>
                <Box>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 700, 
                    color: '#1e293b',
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    letterSpacing: '-0.02em',
                    mb: 0.5
                  }}>
              Links Criados
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#64748b',
                    fontWeight: 500,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    Gerencie todos os seus links encurtados
            </Typography>
          </Box>
        </Box>
        
              <Box sx={{ 
                display: 'flex', 
                gap: 1.5, 
                alignItems: 'center',
                width: { xs: '100%', sm: 'auto' }
              }}>
                <Tooltip title="Atualizar lista" arrow placement="left">
                  <IconButton 
                    onClick={loadLinks} 
                    disabled={loading}
                  sx={{ 
                      width: { xs: 40, sm: 42 },
                      height: { xs: 40, sm: 42 },
                      bgcolor: 'rgba(25, 118, 210, 0.08)',
                      backdropFilter: 'blur(8px)',
                    '&:hover': {
                        bgcolor: 'rgba(25, 118, 210, 0.16)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <RefreshIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                  </IconButton>
                </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
                  onClick={() => navigate('/criar-link')}
            sx={{ 
                    height: { xs: 40, sm: 42 },
                    px: { xs: 2, sm: 3 },
                    flex: { xs: 1, sm: 'none' },
                    borderRadius: '12px',
              textTransform: 'none',
                    fontSize: { xs: '0.875rem', sm: '0.95rem' },
                                fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              '&:hover': {
                      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  Novo Link
          </Button>
              </Box>
            </Box>
        </Box>

          {/* Lista de Links */}
          <Box sx={{ 
            p: { xs: 2, sm: 3 },
            pb: { xs: 4, sm: 3 }
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: { xs: 2, sm: 3 }
            }}>
              <Paper
                elevation={0}
                          sx={{ 
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: { xs: 0, sm: '24px' },
                  border: { xs: 'none', sm: '1px solid rgba(0,0,0,0.08)' },
                  mx: { xs: -2, sm: 0 },
                  bgcolor: '#fff',
                  position: 'sticky',
                  top: 88,
                  zIndex: 2,
                  boxShadow: { 
                    xs: '0 1px 2px rgba(0,0,0,0.05)', 
                    sm: '0 4px 12px rgba(0,0,0,0.05)' 
                  }
                }}
              >
                      <Box 
                        sx={{ 
                    display: 'flex',
                          alignItems: 'center',
                    gap: 1.5,
                    bgcolor: '#f8fafc',
                    borderRadius: '12px',
                    p: '4px',
                    pl: 2,
                                  transition: 'all 0.2s ease-in-out',
                    '&:focus-within': {
                      bgcolor: '#fff',
                      boxShadow: '0 0 0 2px #1976d2',
                      '& .search-icon': {
                        color: '#1976d2'
                      }
                    }
                  }}
                >
                  <SearchIcon 
                    className="search-icon"
                                  sx={{
                      fontSize: { xs: 20, sm: 22 },
                      color: '#64748b',
                      transition: 'color 0.2s ease-in-out'
                    }} 
                  />
                  <InputBase
                    placeholder="Pesquisar links..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                      flex: 1,
                      fontSize: { xs: '0.9375rem', sm: '1rem' },
                      '& .MuiInputBase-input': {
                        py: 1,
                        px: 0,
                        color: '#1e293b',
                        '&::placeholder': {
                          color: '#94a3b8',
                          opacity: 1
                        }
                      }
                    }}
                  />
                  {searchTerm && (
                                  <IconButton
                                    size="small"
                      onClick={() => setSearchTerm('')}
                          sx={{
                        color: '#94a3b8',
                        p: '6px',
                        mr: 0.5,
                                      '&:hover': { 
                          bgcolor: 'rgba(0,0,0,0.04)',
                          color: '#64748b'
                                      }
                                    }}
                                  >
                      <ClearIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                  )}
        </Box>
              </Paper>
        
              <Grid container spacing={2}>
                {filteredLinks.map((link) => {
            const shortUrl = getShortUrl(link.slug);
            
            return (
                    <Grid item xs={12} key={link.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease-in-out',
                    animation: link.id === highlightedLinkId ? 'highlight 3s ease-in-out' : 'none',
                    '@keyframes highlight': {
                      '0%': {
                        transform: 'scale(1)',
                        boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.4)',
                      },
                      '50%': {
                        transform: 'scale(1.02)',
                        boxShadow: '0 0 0 10px rgba(25, 118, 210, 0)',
                      },
                      '100%': {
                        transform: 'scale(1)',
                        boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)',
                      }
                    }
                  }}
                >
                  <CardContent sx={{ 
                    p: { xs: 1, sm: 3 },
                    '&:last-child': { pb: { xs: 1, sm: 3 } }
                  }}>
                    <Grid container spacing={{ xs: 1, sm: 2 }}>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.25, sm: 0.5 } }}>
                          {/* Título e Data */}
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: { xs: 0.25, sm: 0.5 }
                          }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1.5,
                              mb: { xs: 0.25, sm: 1 },
                              flexWrap: 'wrap'
                            }}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: 2,
                                color: '#64748b',
                                fontSize: '0.875rem'
                              }}>
                                <Typography variant="h6" sx={{ 
                                  fontSize: '1rem',
                                  fontWeight: 600,
                                  color: '#1e293b'
                                }}>
                                  {link.title}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          {/* Links e Ações */}
                          <Box sx={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            gap: { xs: 1, sm: 1 }
                          }}>
                            {/* Mobile View */}
                            <Box sx={{ 
                              display: { xs: 'flex', sm: 'none' },
                              flexDirection: 'column',
                              gap: 1
                            }}>
                              <Button
                                onClick={() => setOpenPopupId(link.id)}
                                sx={{ 
                                  width: '100%',
                                  height: 42,
                                  bgcolor: 'primary.main',
                                  color: '#fff',
                                  borderRadius: 2,
                                  px: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 1,
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  fontSize: '0.875rem',
                                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
                                  }
                                }}
                              >
                                <LinkIcon sx={{ fontSize: 18 }} />
                                Ver Links
                              </Button>

                              <Box sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                px: 0.5
                              }}>
                                {/* Contador de Cliques */}
                                <Tooltip title={`${link.clicks || 0} ${link.clicks === 1 ? 'clique' : 'cliques'}`}>
                                  <Box sx={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(25, 118, 210, 0.04)',
                                    border: '1px solid',
                                    borderColor: 'rgba(25, 118, 210, 0.1)',
                                    position: 'relative',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                      bgcolor: 'rgba(25, 118, 210, 0.08)',
                                      transform: 'translateY(-2px)'
                                    }
                                  }}>
                                    <Typography sx={{ 
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      color: 'primary.main'
                                    }}>
                                      {link.clicks || 0}
                                    </Typography>
                                  </Box>
                                </Tooltip>

                                {/* Tempo para Expirar */}
                                {link.advanced_type === 'expirable' && link.expires_at && (
                                  <Tooltip title={getTimeRemaining(link.expires_at)}>
                                    <Box sx={{ 
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 32,
                                      height: 32,
                                      borderRadius: '50%',
                                      bgcolor: 'rgba(25, 118, 210, 0.04)',
                                      border: '1px solid',
                                      borderColor: 'rgba(25, 118, 210, 0.1)',
                                      transition: 'all 0.2s ease-in-out',
                                      '&:hover': {
                                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                                        transform: 'translateY(-2px)'
                                      }
                                    }}>
                                      <AccessTimeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                    </Box>
                                  </Tooltip>
                                )}

                                {/* Link Autodestrutivo */}
                                {link.advanced_type === 'selfDestruct' && (
                                  <Tooltip title={link.is_destroyed ? 'Destruído' : 'Autodestrutivo'}>
                                    <Box sx={{ 
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 32,
                                      height: 32,
                                      borderRadius: '50%',
                                      bgcolor: link.is_destroyed ? 'rgba(239, 68, 68, 0.04)' : 'rgba(25, 118, 210, 0.04)',
                                      border: '1px solid',
                                      borderColor: link.is_destroyed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(25, 118, 210, 0.1)',
                                      transition: 'all 0.2s ease-in-out',
                                      '&:hover': {
                                        bgcolor: link.is_destroyed ? 'rgba(239, 68, 68, 0.08)' : 'rgba(25, 118, 210, 0.08)',
                                        transform: 'translateY(-2px)'
                                      }
                                    }}>
                                      <FlashOnIcon sx={{ 
                                        fontSize: 16, 
                                        color: link.is_destroyed ? '#ef4444' : 'primary.main'
                                      }} />
                                    </Box>
                                  </Tooltip>
                                )}

                                {/* Link Protegido */}
                                {link.advanced_type === 'password' && (
                                  <Tooltip title="Protegido por senha">
                                    <Box sx={{ 
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 32,
                                      height: 32,
                                      borderRadius: '50%',
                                      bgcolor: 'rgba(25, 118, 210, 0.04)',
                                      border: '1px solid',
                                      borderColor: 'rgba(25, 118, 210, 0.1)',
                                      transition: 'all 0.2s ease-in-out',
                                      '&:hover': {
                                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                                        transform: 'translateY(-2px)'
                                      }
                                    }}>
                                      <LockIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                    </Box>
                                  </Tooltip>
                                )}

                                {/* Data de Criação */}
                                <Box sx={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  p: 1,
                                  pl: 1.5,
                                  borderRadius: 2,
                                  bgcolor: 'rgba(25, 118, 210, 0.04)',
                                  border: '1px solid',
                                  borderColor: 'rgba(25, 118, 210, 0.1)',
                                  transition: 'all 0.2s ease-in-out',
                                  '&:hover': {
                                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                                    transform: 'translateY(-2px)'
                                  }
                                }}>
                                  <TimeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                  <Typography sx={{ 
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    color: 'primary.main'
                                  }}>
                                    {new Date(link.created_at).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: 'short'
                                    })}
                                  </Typography>
                                </Box>
                              </Box>

                              <Box sx={{ 
                                display: 'flex', 
                                gap: 1,
                                mt: 0
                              }}>
                                <IconButton
                                  onClick={() => handleQRCodeClick(link.id)}
                                  size="small"
                                  sx={{
                                    flex: 1,
                                    height: 42,
                                    color: '#1976d2',
                                    bgcolor: 'rgba(25, 118, 210, 0.04)',
                                    border: '1px solid',
                                    borderColor: 'rgba(25, 118, 210, 0.1)',
                                    borderRadius: 2,
                                    '&:hover': {
                                      bgcolor: 'rgba(25, 118, 210, 0.08)'
                                    }
                                  }}
                                >
                                  <QrCodeIcon sx={{ fontSize: 18 }} />
                                </IconButton>

                                <IconButton
                                  onClick={() => handleEditClick(link)}
                                  size="small"
                                  sx={{
                                    flex: 1,
                                    height: 42,
                                    color: '#1976d2',
                                    bgcolor: 'rgba(25, 118, 210, 0.04)',
                                    border: '1px solid',
                                    borderColor: 'rgba(25, 118, 210, 0.1)',
                                    borderRadius: 2,
                                    '&:hover': {
                                      bgcolor: 'rgba(25, 118, 210, 0.08)'
                                    }
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: 18 }} />
                                </IconButton>

                                <IconButton
                                  onClick={() => handleDeleteClick(link)}
                                  size="small"
                                  sx={{
                                    flex: 1,
                                    height: 42,
                                    color: '#dc2626',
                                    bgcolor: 'rgba(220, 38, 38, 0.04)',
                                    border: '1px solid',
                                    borderColor: 'rgba(220, 38, 38, 0.1)',
                                    borderRadius: 2,
                                    '&:hover': { 
                                      bgcolor: 'rgba(220, 38, 38, 0.08)'
                                    }
                                  }}
                                >
                                  <DeleteIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Box>
                            </Box>

                            {/* Desktop View */}
                            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2, alignItems: 'flex-start' }}>
                              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Button
                                    onClick={() => setOpenPopupId(link.id)}
                                    variant="contained"
                                    startIcon={<LinkIcon sx={{ fontSize: 18 }} />}
                                    sx={{ 
                                      flex: 1,
                                      height: 42,
                                      borderRadius: 2,
                                      textTransform: 'none',
                                      fontWeight: 600,
                                      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)',
                                      '&:hover': {
                                        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
                                      }
                                    }}
                                  >
                                    Ver Links
                                  </Button>

                                  <IconButton
                                    onClick={() => handleEditClick(link)}
                                    size="small"
                                    sx={{ 
                                      width: 42,
                                      height: 42,
                                      color: '#1976d2',
                                      bgcolor: 'rgba(25, 118, 210, 0.04)',
                                      border: '1px solid',
                                      borderColor: 'rgba(25, 118, 210, 0.1)',
                                      '&:hover': {
                                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                                        borderColor: 'rgba(25, 118, 210, 0.2)'
                                      }
                                    }}
                                  >
                                    <EditIcon sx={{ fontSize: 18 }} />
                                  </IconButton>

                                  <IconButton
                                    onClick={() => handleDeleteClick(link)}
                                    size="small"
                                    sx={{ 
                                      width: 42,
                                      height: 42,
                                      color: '#dc2626',
                                      bgcolor: 'rgba(220, 38, 38, 0.04)',
                                      border: '1px solid',
                                      borderColor: 'rgba(220, 38, 38, 0.1)',
                                      '&:hover': { 
                                        bgcolor: 'rgba(220, 38, 38, 0.08)',
                                        borderColor: 'rgba(220, 38, 38, 0.2)'
                                      }
                                    }}
                                  >
                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Box>

                                <Box sx={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 2,
                                  mt: 1.5
                                }}>
                                  {/* Contador de Cliques */}
                                  <Box sx={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 1,
                                    pl: 1.5,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(25, 118, 210, 0.04)',
                                    border: '1px solid',
                                    borderColor: 'rgba(25, 118, 210, 0.1)',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                      bgcolor: 'rgba(25, 118, 210, 0.08)',
                                      transform: 'translateY(-2px)'
                                    }
                                  }}>
                                    <VisibilityIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                    <Typography sx={{ 
                                      fontSize: '0.875rem',
                                      fontWeight: 500,
                                      color: 'primary.main'
                                    }}>
                                      {link.clicks || 0} {link.clicks === 1 ? 'clique' : 'cliques'}
                                    </Typography>
                                  </Box>

                                  {/* Tempo para Expirar */}
                                  {link.advanced_type === 'expirable' && link.expires_at && (
                                    <Box sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center',
                                      gap: 1,
                                      p: 1,
                                      pl: 1.5,
                                      borderRadius: 2,
                                      bgcolor: 'rgba(25, 118, 210, 0.04)',
                                      border: '1px solid',
                                      borderColor: 'rgba(25, 118, 210, 0.1)',
                                      transition: 'all 0.2s ease-in-out',
                                      '&:hover': {
                                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                                        transform: 'translateY(-2px)'
                                      }
                                    }}>
                                      <AccessTimeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                      <Typography sx={{ 
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: 'primary.main'
                                      }}>
                                        {getTimeRemaining(link.expires_at)}
                                      </Typography>
                                    </Box>
                                  )}

                                  {/* Link Autodestrutivo */}
                                  {link.advanced_type === 'selfDestruct' && (
                                    <Box sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center',
                                      gap: 1,
                                      p: 1,
                                      pl: 1.5,
                                      borderRadius: 2,
                                      bgcolor: link.is_destroyed ? 'rgba(239, 68, 68, 0.04)' : 'rgba(25, 118, 210, 0.04)',
                                      border: '1px solid',
                                      borderColor: link.is_destroyed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(25, 118, 210, 0.1)',
                                      transition: 'all 0.2s ease-in-out',
                                      '&:hover': {
                                        bgcolor: link.is_destroyed ? 'rgba(239, 68, 68, 0.08)' : 'rgba(25, 118, 210, 0.08)',
                                        transform: 'translateY(-2px)'
                                      }
                                    }}>
                                      <FlashOnIcon sx={{ 
                                        fontSize: 16, 
                                        color: link.is_destroyed ? '#ef4444' : 'primary.main'
                                      }} />
                                      <Typography sx={{ 
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: link.is_destroyed ? '#ef4444' : 'primary.main'
                                      }}>
                                        {link.is_destroyed ? 'Destruído' : 'Autodestrutivo'}
                                      </Typography>
                                    </Box>
                                  )}

                                  {/* Link Protegido */}
                                  {link.advanced_type === 'password' && (
                                    <Box sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center',
                                      gap: 1,
                                      p: 1,
                                      pl: 1.5,
                                      borderRadius: 2,
                                      bgcolor: 'rgba(25, 118, 210, 0.04)',
                                      border: '1px solid',
                                      borderColor: 'rgba(25, 118, 210, 0.1)',
                                      transition: 'all 0.2s ease-in-out',
                                      '&:hover': {
                                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                                        transform: 'translateY(-2px)'
                                      }
                                    }}>
                                      <LockIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                      <Typography sx={{ 
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: 'primary.main'
                                      }}>
                                        Protegido por senha
                                      </Typography>
                                    </Box>
                                  )}

                                  {/* Data de Criação */}
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 1,
                                    pl: 1.5,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(25, 118, 210, 0.04)',
                                    border: '1px solid',
                                    borderColor: 'rgba(25, 118, 210, 0.1)',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                      bgcolor: 'rgba(25, 118, 210, 0.08)',
                                      transform: 'translateY(-2px)'
                                    }
                                  }}>
                                    <TimeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                    <Typography sx={{ 
                                      fontSize: '0.875rem',
                                      fontWeight: 500,
                                      color: 'primary.main'
                                    }}>
                                      {new Date(link.created_at).toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: 'short'
                                      })}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            </Box>

                            {/* Modal para exibir URLs (agora visível em ambos mobile e desktop) */}
                  <Dialog
                                    open={openPopupId === link.id}
                    onClose={() => setOpenPopupId(null)}
                                    TransitionComponent={Fade}
                    fullWidth
                                    maxWidth="xs"
                                    sx={{ 
                                      '& .MuiDialog-paper': { 
                                        m: 2, 
                        borderRadius: 3,
                                        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
                                      }
                                    }}
                                  >
                                    <DialogContent sx={{ p: 2 }}>
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Box>
                                          <Typography 
                                            variant="subtitle2" 
                                            sx={{ 
                                              color: '#64748b',
                                              mb: 1,
                                              fontSize: '0.75rem',
                                              fontWeight: 600,
                                              textTransform: 'uppercase',
                                              letterSpacing: '0.5px'
                                            }}
                                          >
                                            Link Encurtado
                                          </Typography>
                                          <Paper 
                                            elevation={0}
                                            sx={{ 
                                              p: 2,
                                              bgcolor: 'rgba(25, 118, 210, 0.04)',
                                              border: '1px solid',
                                              borderColor: 'rgba(25, 118, 210, 0.1)',
                                              borderRadius: 2,
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 1
                                            }}
                                          >
                                            <Typography
                                              sx={{ 
                                                color: 'primary.main',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                wordBreak: 'break-all',
                                                flex: 1
                                              }}
                                            >
                                              {getShortUrl(link.slug)}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                              <IconButton
                                                onClick={() => handleQRCodeClick(link.id)}
                                                size="small"
                                                sx={{ 
                                                  color: 'primary.main',
                                                  '&:hover': {
                                                    bgcolor: 'rgba(25, 118, 210, 0.08)'
                                                  }
                                                }}
                                              >
                                                <QrCodeIcon sx={{ fontSize: 20 }} />
                                              </IconButton>
                                              <IconButton
                                                component={Link}
                                                href={getShortUrl(link.slug)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                size="small"
                                                sx={{ 
                                                  color: 'primary.main',
                                                  '&:hover': {
                                                    bgcolor: 'rgba(25, 118, 210, 0.08)'
                                                  }
                                                }}
                                              >
                                                <LaunchIcon sx={{ fontSize: 20 }} />
                                              </IconButton>
                                            </Box>
                                          </Paper>
                                        </Box>

                                        <Box>
                                          <Typography 
                                            variant="subtitle2" 
                                            sx={{ 
                                              color: '#64748b',
                                              mb: 1,
                                              fontSize: '0.75rem',
                                              fontWeight: 600,
                                              textTransform: 'uppercase',
                                              letterSpacing: '0.5px'
                                            }}
                                          >
                                            Link Original
                                          </Typography>
                                          <Paper 
                                            elevation={0}
                                            component={Link}
                                            href={link.destination_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{ 
                                              p: 2,
                                              bgcolor: '#f8fafc',
                                              border: '1px solid',
                                              borderColor: 'divider',
                                              borderRadius: 2,
                                              cursor: 'pointer',
                                              textDecoration: 'none',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 1.5,
                                              '&:hover': { 
                                                bgcolor: '#f1f5f9',
                                              },
                                              '&:active': {
                                                transform: 'scale(0.99)'
                                              }
                                            }}
                                          >
                                            <Typography
                                              sx={{ 
                                                color: '#64748b',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                wordBreak: 'break-all',
                                                flex: 1
                                              }}
                                            >
                                              {link.destination_url}
                                            </Typography>
                                            <LaunchIcon sx={{ 
                                              fontSize: 16, 
                                              color: '#64748b',
                                              opacity: 0.7
                                            }} />
                                          </Paper>

                                          {/* Advanced Features Section */}
                                          <Box sx={{ 
                                            mt: 2,
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 1
                                          }}>
                                            {/* Tempo para Expirar */}
                                            {link.advanced_type === 'expirable' && link.expires_at && (
                                              <Chip
                                                icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
                                                label={getTimeRemaining(link.expires_at)}
                                                size="small"
                                                sx={{ 
                                                  bgcolor: 'rgba(25, 118, 210, 0.08)',
                                                  color: 'primary.main',
                                                  borderRadius: 1.5,
                                                  '& .MuiChip-icon': {
                                                    color: 'primary.main'
                                                  }
                                                }}
                                              />
                                            )}

                                            {/* Link Autodestrutivo */}
                                            {link.advanced_type === 'selfDestruct' && (
                                              <Chip
                                                icon={<FlashOnIcon sx={{ fontSize: 16 }} />}
                                                label={link.is_destroyed ? 'Destruído' : 'Autodestrutivo'}
                                                size="small"
                                                sx={{ 
                                                  bgcolor: link.is_destroyed ? 'rgba(239, 68, 68, 0.08)' : 'rgba(25, 118, 210, 0.08)',
                                                  color: link.is_destroyed ? '#ef4444' : 'primary.main',
                                                  borderRadius: 1.5,
                                                  '& .MuiChip-icon': {
                                                    color: link.is_destroyed ? '#ef4444' : 'primary.main'
                                                  }
                                                }}
                                              />
                                            )}

                                            {/* Link Protegido */}
                                            {link.advanced_type === 'password' && (
                                              <Chip
                                                icon={<LockIcon sx={{ fontSize: 16 }} />}
                                                label="Protegido por senha"
                                                size="small"
                                                sx={{ 
                                                  bgcolor: 'rgba(25, 118, 210, 0.08)',
                                                  color: 'primary.main',
                                                  borderRadius: 1.5,
                                                  '& .MuiChip-icon': {
                                                    color: 'primary.main'
                                                  }
                                                }}
                                              />
                                            )}

                                            {/* Contador de Cliques */}
                                            <Chip
                                              icon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                                              label={`${link.clicks || 0} ${link.clicks === 1 ? 'clique' : 'cliques'}`}
                                              size="small"
                                              sx={{ 
                                                bgcolor: 'rgba(25, 118, 210, 0.08)',
                                                color: 'primary.main',
                                                borderRadius: 1.5,
                                                '& .MuiChip-icon': {
                                                  color: 'primary.main'
                                                }
                                              }}
                                            />

                                            {/* Data de Criação */}
                                            <Chip
                                              icon={<TimeIcon sx={{ fontSize: 16 }} />}
                                              label={new Date(link.created_at).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: 'short'
                                              })}
                                              size="small"
                                              sx={{ 
                                                bgcolor: 'rgba(25, 118, 210, 0.08)',
                                                color: 'primary.main',
                                                borderRadius: 1.5,
                                                '& .MuiChip-icon': {
                                                  color: 'primary.main'
                                                }
                                              }}
                                            />
                                          </Box>
                                        </Box>
                                      </Box>
                                    </DialogContent>
                                    <DialogActions sx={{ p: 2, pt: 0 }}>
                                      <Button
                                        onClick={() => setOpenPopupId(null)}
                                        sx={{ 
                                          color: '#64748b',
                                          textTransform: 'none',
                                          fontWeight: 600,
                                          '&:hover': { 
                                            bgcolor: '#f1f5f9'
                                          }
                                        }}
                                      >
                                        Fechar
                                      </Button>
                                    </DialogActions>
                                  </Dialog>

                                    {/* QR Code Dialog */}
                                    <Dialog
                                      open={openQRCodeId === link.id}
                                      onClose={handleQRCodeClose}
                                      maxWidth="xs"
                                      TransitionComponent={Zoom}
                                      sx={{ 
                                        '& .MuiDialog-paper': { 
                                          width: { xs: 'calc(100% - 32px)', sm: '360px' },
                                          m: 2,
                                          borderRadius: 4,
                                          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                                          overflow: 'visible',
                                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
                                        }
                                      }}
                                    >
                                      <Box sx={{ 
                                        position: 'relative',
                                        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                                        p: 3,
                                        borderTopLeftRadius: 'inherit',
                                        borderTopRightRadius: 'inherit',
                                        color: '#fff',
                                        textAlign: 'center'
                                      }}>
                                        <IconButton
                                          onClick={handleQRCodeClose}
                                          sx={{ 
                                            position: 'absolute',
                                            right: -12,
                                            top: -12,
                                            bgcolor: '#fff',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                            border: '2px solid',
                                            borderColor: '#fff',
                                            width: 32,
                                            height: 32,
                                            '&:hover': {
                                              bgcolor: '#fff',
                                              transform: 'rotate(90deg)'
                                            },
                                            transition: 'transform 0.2s ease-in-out'
                                          }}
                                        >
                                          <CloseIcon sx={{ fontSize: 18, color: '#1976d2' }} />
                                        </IconButton>
                                        <QrCodeIcon sx={{ fontSize: 40, mb: 1 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                          QR Code do Link
                                        </Typography>
                                      </Box>
                                      <DialogContent sx={{ 
                                        p: 3,
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                      }}>
                                        <Box sx={{ 
                                          p: 3,
                                          bgcolor: 'white',
                                          borderRadius: 3,
                                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                          mb: 2
                                        }}>
                                          <QRCodeSVG
                                            value={getShortUrl(link.slug)}
                                            size={200}
                                            level="H"
                                            includeMargin={true}
                                          />
                                        </Box>
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            color: '#64748b',
                                            textAlign: 'center',
                                            maxWidth: '80%',
                                            mb: 1
                                          }}
                                        >
                                          Escaneie este QR Code para acessar:
                                        </Typography>
                                        <Typography 
                                          variant="subtitle2" 
                                          sx={{ 
                                            color: 'primary.main',
                                            fontWeight: 600,
                                            wordBreak: 'break-all',
                                            textAlign: 'center'
                                          }}
                                        >
                                          {getShortUrl(link.slug)}
                                        </Typography>
                                      </DialogContent>
                                    </Dialog>
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Mensagem quando não há links ou resultados de pesquisa */}
              {filteredLinks.length === 0 && (
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    px: 3,
                    borderRadius: 3,
                    bgcolor: '#f8fafc',
                    border: '2px dashed',
                    borderColor: 'divider'
                  }}
                >
                  <TimeIcon sx={{ fontSize: 48, color: '#64748b', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, mb: 1 }}>
                    {links.length === 0 ? 'Nenhum link criado ainda' : 'Nenhum resultado encontrado'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                    {links.length === 0 
                      ? 'Comece criando seu primeiro link encurtado'
                      : 'Tente pesquisar com outros termos'}
                  </Typography>
                  {links.length === 0 && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/criar-link')}
                        sx={{ 
                        px: 3,
                        py: 1,
                        borderRadius: '12px',
                          textTransform: 'none',
                        fontSize: '0.95rem',
                          fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                          '&:hover': { 
                          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)'
                          },
                        transition: 'all 0.2s ease-in-out'
                        }}
                      >
                      Criar Primeiro Link
                      </Button>
                )}
      </Box>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Modal de Edição */}
      <Dialog 
        open={!!editingLink} 
        onClose={handleEditClose}
        maxWidth="sm"
        fullWidth
          TransitionComponent={Fade}
          transitionDuration={300}
        PaperProps={{
          sx: {
              borderRadius: '24px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
          }
        }}
      >
          <DialogTitle sx={{ 
            p: 3,
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                bgcolor: 'primary.main',
                p: 1,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
              }}>
                <EditIcon sx={{ fontSize: 20, color: '#fff' }} />
              </Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                color: '#1e293b',
                fontSize: '1.125rem',
                letterSpacing: '-0.02em'
              }}>
              Editar Link
            </Typography>
          </Box>
          <IconButton
            onClick={handleEditClose}
            sx={{ 
              color: '#64748b',
              '&:hover': { 
                  color: '#ef4444',
                  transform: 'rotate(90deg)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <CloseIcon />
          </IconButton>
        </DialogTitle>

          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ 
                  color: '#64748b', 
                  mb: 1, 
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <TitleIcon sx={{ fontSize: 18 }} />
                  Título
                </Typography>
              <TextField
                fullWidth
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Digite o título do link"
                  size="small"
                  InputProps={{
                    sx: {
                      height: '44px',
                    }
                  }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    bgcolor: '#f8fafc',
                    border: '1px solid rgba(0,0,0,0.08)',
                      transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: '#1976d2',
                        bgcolor: '#fff',
                        boxShadow: '0 0 0 1px rgba(25, 118, 210, 0.1)'
                    },
                    '&.Mui-focused': {
                      borderColor: '#1976d2',
                      bgcolor: '#fff',
                        boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                      },
                      '& fieldset': {
                        borderColor: 'transparent'
                      },
                      '&:hover fieldset': {
                        borderColor: 'transparent'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'transparent'
                    }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ 
                  color: '#64748b', 
                  mb: 1, 
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <LinkIcon sx={{ fontSize: 18 }} />
                  Slug
                </Typography>
              <TextField
                fullWidth
                value={editForm.slug}
                onChange={(e) => setEditForm({ ...editForm, slug: cleanSlug(e.target.value) })}
                  placeholder="Digite o slug do link"
                  size="small"
                  helperText="Use apenas letras, números, hífen (-) e underscore (_)"
                  InputProps={{
                    sx: {
                      height: '44px',
                    },
                  startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{ 
                          color: '#64748b', 
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          mr: 0.5 
                        }}>
                      /
                    </Typography>
                      </InputAdornment>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    bgcolor: '#f8fafc',
                    border: '1px solid rgba(0,0,0,0.08)',
                      transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: '#1976d2',
                        bgcolor: '#fff',
                        boxShadow: '0 0 0 1px rgba(25, 118, 210, 0.1)'
                    },
                    '&.Mui-focused': {
                      borderColor: '#1976d2',
                      bgcolor: '#fff',
                        boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                      },
                      '& fieldset': {
                        borderColor: 'transparent'
                      },
                      '&:hover fieldset': {
                        borderColor: 'transparent'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'transparent'
                    }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ 
                  color: '#64748b', 
                  mb: 1, 
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <InsertLinkIcon sx={{ fontSize: 18 }} />
                  URL de Destino
                </Typography>
              <TextField
                fullWidth
                value={editForm.destinationUrl}
                onChange={(e) => setEditForm({ ...editForm, destinationUrl: e.target.value })}
                  placeholder="Cole a URL de destino aqui"
                  size="small"
                  InputProps={{
                    sx: {
                      height: '44px',
                    }
                  }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    bgcolor: '#f8fafc',
                    border: '1px solid rgba(0,0,0,0.08)',
                      transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: '#1976d2',
                        bgcolor: '#fff',
                        boxShadow: '0 0 0 1px rgba(25, 118, 210, 0.1)'
                    },
                    '&.Mui-focused': {
                      borderColor: '#1976d2',
                      bgcolor: '#fff',
                        boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                      },
                      '& fieldset': {
                        borderColor: 'transparent'
                      },
                      '&:hover fieldset': {
                        borderColor: 'transparent'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'transparent'
                    }
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

          <DialogActions sx={{ 
            p: 3, 
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
          }}>
          <Button 
            onClick={handleEditClose}
            sx={{ 
              color: '#64748b',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { 
                  bgcolor: 'rgba(100, 116, 139, 0.08)'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleEditSave}
            variant="contained"
            sx={{ 
                px: 3,
                py: 1,
                borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              '&:hover': {
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)'
                }
              }}
            >
              Salvar Alterações
          </Button>
        </DialogActions>
      </Dialog>

        {/* Notificações */}
      <Snackbar
        open={notification.open}
          autoHideDuration={4000}
        onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          TransitionComponent={Fade}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.type}
          variant="filled"
          sx={{ 
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            '& .MuiAlert-icon': {
                fontSize: '24px'
            },
            '& .MuiAlert-message': {
                fontSize: '0.95rem',
                fontWeight: 500
            }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
    </Box>
  );
}

export default HomePage; 