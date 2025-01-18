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
} from '@mui/icons-material';
import { supabase } from '../services/supabase';

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: '', slug: '', destinationUrl: '' });
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

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate('/login');
          return;
        }
        setUser(session.user);
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
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Erro ao carregar links:', error);
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimeIcon sx={{ color: '#666', fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
              Links Criados
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate('/criar-link')}
            startIcon={<AddIcon />}
            sx={{ 
              px: 2,
              py: 0.75,
              bgcolor: '#1976d2',
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: 'none',
              fontSize: '0.875rem',
              '&:hover': {
                bgcolor: '#1565c0',
                boxShadow: '0 4px 8px rgba(25, 118, 210, 0.16)',
              }
            }}
          >
            Criar Novo Link
          </Button>
        </Box>

        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Typography variant="caption" sx={{ color: '#666' }}>
            {links.length} links criados
          </Typography>
        </Box>
        
        <Grid container spacing={1.5}>
          {links.map((link) => {
            const shortUrl = getShortUrl(link.slug);
            
            return (
              <React.Fragment key={link.id}>
                <Grid item xs={12}>
                  <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                <Card 
                  elevation={0}
                  sx={{ 
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                        transition: 'all 0.3s ease-in-out',
                        position: 'relative',
                        overflow: 'visible',
                    '&:hover': {
                      borderColor: '#1976d2',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }
                  }}
                >
                  <CardContent sx={{ p: '12px !important' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: '#1976d2',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {link.title || 'Link sem título'}
                            </Typography>
                            
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip 
                          label={link.slug}
                          size="small"
                          sx={{ 
                            backgroundColor: 'rgba(25, 118, 210, 0.08)',
                            color: '#1976d2',
                            fontWeight: 500,
                                  height: '24px',
                                  borderRadius: '6px',
                                  minWidth: 'fit-content'
                          }}
                        />
                      <Box 
                        sx={{ 
                                  display: 'inline-flex',
                          alignItems: 'center',
                                  gap: 1,
                          backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                  borderRadius: '8px',
                                  padding: '4px 12px',
                                  transition: 'all 0.2s ease-in-out',
                                  maxWidth: 'fit-content',
                                  '&:hover': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                  }
                                }}
                              >
                                <Typography
                                  sx={{
                                    color: '#1976d2',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    display: 'inline-block',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {shortUrl}
                                </Typography>
                                <Tooltip title="Acessar Link">
                                  <IconButton
                          href={shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                                    size="small"
                          sx={{
                            color: '#1976d2',
                                      padding: '4px',
                                      '&:hover': { 
                                        color: '#2e7d32',
                                        transform: 'scale(1.1)'
                                      }
                                    }}
                                  >
                                    <LaunchIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                            <Tooltip title="Mais Informações">
                              <IconButton
                                onClick={() => setOpenPopupId(link.id)}
                                size="small"
                                sx={{ 
                                  color: '#666',
                                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                  position: 'relative',
                                  top: 0,
                            '&:hover': {
                                    color: '#1976d2',
                                    transform: 'scale(1.1)',
                                    backgroundColor: 'rgba(25, 118, 210, 0.08)'
                                  },
                                  '&:active': {
                                    transform: 'scale(0.9)',
                                    top: '1px',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                                  }
                                }}
                              >
                                <InfoIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                        <Tooltip title="Copiar Link">
                          <IconButton 
                            onClick={() => handleCopyLink(shortUrl)}
                            size="small"
                            sx={{ 
                              color: copySuccess === shortUrl ? '#4caf50' : '#666',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': { 
                                    color: '#1976d2',
                                    transform: 'scale(1.15) rotate(8deg)',
                                    backgroundColor: 'rgba(25, 118, 210, 0.08)'
                                  },
                                  '&:active': {
                                    transform: 'scale(0.95) rotate(0deg)',
                                  }
                                }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar">
                              <IconButton
                                onClick={() => handleEditClick(link)}
                                size="small"
                                sx={{ 
                                  color: '#666',
                                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                  position: 'relative',
                                  top: 0,
                                  '&:hover': { 
                                    color: '#1976d2',
                                    transform: 'scale(1.1)',
                                    backgroundColor: 'rgba(25, 118, 210, 0.08)'
                                  },
                                  '&:active': {
                                    transform: 'scale(0.9)',
                                    top: '1px',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                                  }
                                }}
                              >
                                <EditIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir">
                              <IconButton
                                onClick={() => handleDeleteClick(link)}
                                size="small"
                                sx={{ 
                                  color: '#666',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': { 
                                    color: '#d32f2f',
                                    transform: 'scale(1.15) rotate(8deg)',
                                    backgroundColor: 'rgba(211, 47, 47, 0.08)'
                                  },
                                  '&:active': {
                                    transform: 'scale(0.95) rotate(0deg)',
                                  }
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
                {openPopupId === link.id && (
                  <Dialog
                    open={true}
                    onClose={() => setOpenPopupId(null)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                      sx: {
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
                      }
                    }}
                  >
                    <DialogTitle 
                      sx={{ 
                        p: 3,
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid rgba(0,0,0,0.08)',
                        bgcolor: '#f8fafc'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <InfoIcon sx={{ color: '#1976d2', fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          Detalhes do Link
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={() => setOpenPopupId(null)}
                        size="small"
                        sx={{ 
                          color: '#64748b',
                          '&:hover': { 
                            color: '#dc2626',
                            bgcolor: 'rgba(220, 38, 38, 0.08)'
                          }
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3 }}>
                      <Grid container spacing={2.5}>
                        <Grid item xs={12}>
                          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600 }}>
                              Título
                            </Typography>
                          </Box>
                          <Paper 
                            elevation={0}
                            sx={{ 
                              p: 2,
                              bgcolor: '#f8fafc',
                              border: '1px solid rgba(0,0,0,0.08)',
                              borderRadius: 2
                            }}
                          >
                            <Typography sx={{ color: '#1e293b', fontWeight: 500 }}>
                              {link.title || 'Link sem título'}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600 }}>
                              Slug
                            </Typography>
                          </Box>
                          <Paper 
                            elevation={0}
                          sx={{
                              p: 2,
                              bgcolor: '#f8fafc',
                              border: '1px solid rgba(0,0,0,0.08)',
                              borderRadius: 2
                            }}
                          >
                            <Typography sx={{ color: '#1e293b', fontWeight: 500 }}>
                              {link.slug}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600 }}>
                              Link Encurtado
                        </Typography>
                          </Box>
                          <Paper 
                            elevation={0}
                            sx={{ 
                              p: 2,
                              bgcolor: '#f8fafc',
                              border: '1px solid rgba(0,0,0,0.08)',
                              borderRadius: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <Typography sx={{ color: '#1e293b', fontWeight: 500, wordBreak: 'break-all', flex: 1 }}>
                              {shortUrl}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                              <IconButton 
                                size="small"
                                onClick={() => handleCopyLink(shortUrl)}
                                sx={{ 
                                  color: copySuccess === shortUrl ? '#22c55e' : '#1976d2',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': { 
                                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                                    transform: 'scale(1.15) rotate(8deg)',
                                  },
                                  '&:active': {
                                    transform: 'scale(0.95) rotate(0deg)',
                                  }
                                }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                                href={shortUrl}
                                target="_blank"
                                sx={{ 
                                  color: '#1976d2',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': { 
                                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                                    transform: 'scale(1.15) rotate(8deg)',
                                  },
                                  '&:active': {
                                    transform: 'scale(0.95) rotate(0deg)',
                                  }
                                }}
                              >
                                <LaunchIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                          </Paper>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600 }}>
                              URL de Destino
                            </Typography>
                          </Box>
                          <Paper 
                            elevation={0}
                            sx={{ 
                              p: 2,
                              bgcolor: '#f8fafc',
                              border: '1px solid rgba(0,0,0,0.08)',
                              borderRadius: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <Typography sx={{ color: '#1e293b', fontWeight: 500, wordBreak: 'break-all', flex: 1 }}>
                              {link.destination_url}
                            </Typography>
                            <IconButton 
                              size="small"
                              href={link.destination_url}
                              target="_blank"
                              sx={{ 
                                ml: 2,
                                color: '#1976d2',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': { 
                                  bgcolor: 'rgba(25, 118, 210, 0.08)',
                                  transform: 'scale(1.15) rotate(8deg)',
                                },
                                '&:active': {
                                  transform: 'scale(0.95) rotate(0deg)',
                                }
                              }}
                            >
                              <LaunchIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                          </Paper>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600 }}>
                              Informações Adicionais
                            </Typography>
                          </Box>
                          <Paper 
                            elevation={0}
                          sx={{ 
                              p: 2,
                              bgcolor: '#f8fafc',
                              border: '1px solid rgba(0,0,0,0.08)',
                              borderRadius: 2
                            }}
                          >
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <TimeIcon sx={{ color: '#64748b', fontSize: 18 }} />
                                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                                    Criado em:
                                  </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
                                  {new Date(link.created_at).toLocaleString()}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <TimeIcon sx={{ color: '#64748b', fontSize: 18 }} />
                                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                                    Última atualização:
                                  </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
                                  {new Date(link.updated_at || link.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                          </Paper>
                        </Grid>
              </Grid>
                    </DialogContent>
                    <DialogActions 
                      sx={{ 
                        p: 3, 
                        borderTop: '1px solid rgba(0,0,0,0.08)',
                        bgcolor: '#f8fafc'
                      }}
                    >
                      <Button
                        onClick={() => handleEditClick(link)}
                        startIcon={<EditIcon />}
                        sx={{ 
                          color: '#1976d2',
                          textTransform: 'none',
                          fontWeight: 600,
                          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          top: 0,
                          '&:hover': { 
                            bgcolor: 'rgba(25, 118, 210, 0.08)',
                            transform: 'translateY(-2px)',
                          },
                          '&:active': {
                            transform: 'translateY(0)',
                            top: '2px',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                          }
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => {
                          handleDeleteClick(link);
                          setOpenPopupId(null);
                        }}
                        startIcon={<DeleteIcon />}
                        sx={{ 
                          color: '#dc2626',
                          textTransform: 'none',
                          fontWeight: 600,
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': { 
                            bgcolor: 'rgba(220, 38, 38, 0.08)',
                            transform: 'translateY(-1px)',
                          },
                          '&:active': {
                            transform: 'translateY(1px)',
                          }
                        }}
                      >
                        Excluir
                      </Button>
                    </DialogActions>
                  </Dialog>
                )}
              </React.Fragment>
            );
          })}
        </Grid>
      </Box>

      <Dialog 
        open={!!editingLink} 
        onClose={handleEditClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            p: 3,
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            bgcolor: '#f8fafc'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EditIcon sx={{ color: '#1976d2', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
              Editar Link
            </Typography>
          </Box>
          <IconButton
            onClick={handleEditClose}
            size="small"
            sx={{ 
              color: '#64748b',
              '&:hover': { 
                color: '#dc2626',
                bgcolor: 'rgba(220, 38, 38, 0.08)'
              }
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Título
                </Typography>
              </Box>
              <TextField
                fullWidth
                size="small"
                placeholder="Digite o título do link"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                variant="outlined"
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    bgcolor: '#f8fafc',
                    border: '1px solid rgba(0,0,0,0.08)',
                    '&:hover': {
                      borderColor: '#1976d2',
                      bgcolor: '#fff'
                    },
                    '&.Mui-focused': {
                      borderColor: '#1976d2',
                      bgcolor: '#fff',
                      boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.08)'
                    }
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#1e293b',
                    fontSize: '0.9rem',
                    padding: '12px 16px',
                    '&::placeholder': {
                      color: '#64748b',
                      opacity: 0.8
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Slug
                </Typography>
              </Box>
              <TextField
                fullWidth
                size="small"
                placeholder="Digite o slug do link"
                value={editForm.slug}
                onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                required
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <Typography sx={{ color: '#64748b', fontSize: '0.9rem', mr: 0.5 }}>
                      /
                    </Typography>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    bgcolor: '#f8fafc',
                    border: '1px solid rgba(0,0,0,0.08)',
                    '&:hover': {
                      borderColor: '#1976d2',
                      bgcolor: '#fff'
                    },
                    '&.Mui-focused': {
                      borderColor: '#1976d2',
                      bgcolor: '#fff',
                      boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.08)'
                    }
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#1e293b',
                    fontSize: '0.9rem',
                    padding: '12px 16px',
                    '&::placeholder': {
                      color: '#64748b',
                      opacity: 0.8
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  URL de Destino
                </Typography>
              </Box>
              <TextField
                fullWidth
                size="small"
                placeholder="Cole a URL de destino aqui"
                value={editForm.destinationUrl}
                onChange={(e) => setEditForm({ ...editForm, destinationUrl: e.target.value })}
                required
                variant="outlined"
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    bgcolor: '#f8fafc',
                    border: '1px solid rgba(0,0,0,0.08)',
                    '&:hover': {
                      borderColor: '#1976d2',
                      bgcolor: '#fff'
                    },
                    '&.Mui-focused': {
                      borderColor: '#1976d2',
                      bgcolor: '#fff',
                      boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.08)'
                    }
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#1e293b',
                    fontSize: '0.9rem',
                    padding: '12px 16px',
                    '&::placeholder': {
                      color: '#64748b',
                      opacity: 0.8
                    }
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions 
          sx={{ 
            p: 3, 
            borderTop: '1px solid rgba(0,0,0,0.08)',
            bgcolor: '#f8fafc',
            gap: 1
          }}
        >
          <Button 
            onClick={handleEditClose}
            sx={{ 
              color: '#64748b',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              top: 0,
              '&:hover': { 
                bgcolor: 'rgba(100, 116, 139, 0.08)',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'translateY(0)',
                top: '2px',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleEditSave}
            variant="contained"
            sx={{ 
              bgcolor: '#1976d2',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: 'none',
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              top: 0,
              '&:hover': {
                boxShadow: '0 4px 8px rgba(25, 118, 210, 0.16)',
                bgcolor: '#1565c0',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'translateY(0)',
                top: '2px',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
              }
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          mt: 8,
          mr: 3
        }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.type}
          variant="filled"
          sx={{ 
            minWidth: '260px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            bgcolor: notification.type === 'success' ? '#1976d2' : '#dc2626',
            '& .MuiAlert-icon': {
              fontSize: 20,
              color: '#fff'
            },
            '& .MuiAlert-message': {
              fontSize: '0.875rem',
              fontWeight: 500,
              py: 0.25,
              color: '#fff'
            },
            '& .MuiAlert-action': {
              pt: 0,
              pr: 1,
              '& .MuiIconButton-root': {
                color: '#fff',
                opacity: 0.8,
                '&:hover': {
                  opacity: 1,
                  bgcolor: 'rgba(255, 255, 255, 0.08)'
                }
              }
            }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default HomePage; 