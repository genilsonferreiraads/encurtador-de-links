import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  ContentCopy as ContentCopyIcon,
  Launch as LaunchIcon,
  Link as LinkIcon,
  AccessTime as TimeIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { supabase } from '../services/supabase';

function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newLink, setNewLink] = useState({ slug: '', destinationUrl: '' });
  const [links, setLinks] = useState<any[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [editForm, setEditForm] = useState({ slug: '', destinationUrl: '' });

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

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedUrl = newLink.destinationUrl.startsWith('http://') || newLink.destinationUrl.startsWith('https://')
        ? newLink.destinationUrl
        : `https://${newLink.destinationUrl}`;

      const { data, error } = await supabase
        .from('links')
        .insert([{
          slug: newLink.slug,
          destination_url: formattedUrl,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      setLinks([data, ...links]);
      setNewLink({ slug: '', destinationUrl: '' });
    } catch (error) {
      console.error('Erro ao criar link:', error);
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
      slug: link.slug,
      destinationUrl: link.destination_url
    });
  };

  const handleEditClose = () => {
    setEditingLink(null);
    setEditForm({ slug: '', destinationUrl: '' });
  };

  const handleEditSave = async () => {
    try {
      const formattedUrl = editForm.destinationUrl.startsWith('http://') || editForm.destinationUrl.startsWith('https://')
        ? editForm.destinationUrl
        : `https://${editForm.destinationUrl}`;

      const { error } = await supabase
        .from('links')
        .update({
          slug: editForm.slug,
          destination_url: formattedUrl
        })
        .eq('id', editingLink.id);

      if (error) throw error;

      await loadLinks();
      handleEditClose();
    } catch (error) {
      console.error('Erro ao atualizar link:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <LinkIcon sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ 
              fontWeight: 600,
              background: 'linear-gradient(45deg, #1976d2, #64b5f6)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Encurtador
          </Typography>
        </Box>

        <Card 
          elevation={0}
          sx={{ 
            mb: 4,
            border: '1px solid #e0e0e0',
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Box component="form" onSubmit={handleCreateLink}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Slug"
                    value={newLink.slug}
                    onChange={(e) => setNewLink({ ...newLink, slug: e.target.value })}
                    required
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <Typography color="textSecondary" sx={{ fontSize: '0.9rem', mr: 0.5 }}>
                          /
                        </Typography>
                      ),
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: 1.5,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={7}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Cole a URL aqui"
                    value={newLink.destinationUrl}
                    onChange={(e) => setNewLink({ ...newLink, destinationUrl: e.target.value })}
                    required
                    variant="outlined"
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: 1.5,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button 
                    type="submit" 
                    variant="contained"
                    fullWidth
                    size="small"
                    sx={{ 
                      py: 1,
                      borderRadius: 1.5,
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': {
                        boxShadow: 'none',
                        backgroundColor: '#1565c0',
                      }
                    }}
                  >
                    Encurtar
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimeIcon sx={{ color: '#666', fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#666' }}>
              Links Recentes
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#666' }}>
            {links.length} links criados
          </Typography>
        </Box>
        
        <Grid container spacing={1.5}>
          {links.map((link) => {
            const shortUrl = getShortUrl(link.slug);
            return (
              <Grid item xs={12} key={link.id}>
                <Card 
                  elevation={0}
                  sx={{ 
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: '#1976d2',
                      backgroundColor: 'rgba(25, 118, 210, 0.02)',
                      transform: 'translateY(-1px)',
                    }
                  }}
                >
                  <CardContent sx={{ p: '12px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '120px' }}>
                        <Chip 
                          label={link.slug}
                          size="small"
                          sx={{ 
                            backgroundColor: 'rgba(25, 118, 210, 0.08)',
                            color: '#1976d2',
                            fontWeight: 500,
                            height: 24,
                            borderRadius: 1,
                          }}
                        />
                      </Box>

                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          flex: 1,
                          backgroundColor: 'rgba(25, 118, 210, 0.04)',
                          borderRadius: 1,
                          px: 1.5,
                          py: 0.75,
                          mr: 1,
                        }}
                      >
                        <Link
                          href={shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: '#1976d2',
                            textDecoration: 'none',
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          {shortUrl}
                        </Link>
                        <Tooltip title="Copiar Link">
                          <IconButton 
                            onClick={() => handleCopyLink(shortUrl)}
                            size="small"
                            sx={{ 
                              ml: 1,
                              p: 0.5,
                              color: copySuccess === shortUrl ? '#4caf50' : '#666',
                            }}
                          >
                            <ContentCopyIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          flex: 1.5,
                          backgroundColor: '#f8f9fa',
                          borderRadius: 1,
                          px: 1.5,
                          py: 0.75,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#666',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem',
                          }}
                        >
                          {link.destination_url}
                        </Typography>
                        <Tooltip title="Abrir URL">
                          <IconButton
                            href={link.destination_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            sx={{ 
                              ml: 1,
                              p: 0.5,
                              color: '#666',
                              '&:hover': { color: '#1976d2' }
                            }}
                          >
                            <LaunchIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                        <Tooltip title="Editar Link">
                          <IconButton
                            onClick={() => handleEditClick(link)}
                            size="small"
                            sx={{ 
                              p: 0.5,
                              color: '#666',
                              '&:hover': { color: '#1976d2' }
                            }}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#999',
                            fontSize: '0.7rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {new Date(link.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      <Dialog 
        open={!!editingLink} 
        onClose={handleEditClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 2 }}>Editar Link</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Slug"
                value={editForm.slug}
                onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                required
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <Typography color="textSecondary" sx={{ fontSize: '0.9rem', mr: 0.5 }}>
                      /
                    </Typography>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 1.5,
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="URL de Destino"
                value={editForm.destinationUrl}
                onChange={(e) => setEditForm({ ...editForm, destinationUrl: e.target.value })}
                required
                variant="outlined"
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 1.5,
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleEditClose}
            sx={{ 
              color: '#666',
              textTransform: 'none',
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleEditSave}
            variant="contained"
            sx={{ 
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
                backgroundColor: '#1565c0',
              }
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default HomePage; 