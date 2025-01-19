import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  Container,
  Snackbar,
} from '@mui/material';
import { supabase, getCurrentUser } from '../services/supabase';

export default function CreateLinkPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    open: false,
    message: '',
    type: 'success'
  });
  const [form, setForm] = useState({
    title: '',
    slug: '',
    destinationUrl: ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formattedUrl = form.destinationUrl.startsWith('http://') || form.destinationUrl.startsWith('https://')
        ? form.destinationUrl
        : `https://${form.destinationUrl}`;

      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('links')
        .insert([{
          title: form.title,
          slug: form.slug,
          destination_url: formattedUrl,
          user_id: user.id
        }]);

      if (error) throw error;

      // Redireciona imediatamente com a mensagem de sucesso
      navigate('/links', { 
        state: { successMessage: 'Link criado com sucesso!' }
      });
    } catch (err: any) {
      console.error('Erro ao criar link:', err);
      setError(err.message || 'Erro ao criar link. Tente novamente.');
      showNotification(err.message || 'Erro ao criar link. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: 'calc(100vh - 88px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography 
            variant="h5" 
            sx={{ 
              color: '#1e293b',
              fontWeight: 600,
              mb: 1
            }}
          >
            Criar Novo Link
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#64748b',
              maxWidth: '400px',
              mx: 'auto'
            }}
          >
            Preencha os campos abaixo para criar um novo link encurtado
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.08)',
            bgcolor: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                  Título
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Digite o título do link"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
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
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                  Slug
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Digite o slug do link"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
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
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                  URL de Destino
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Cole a URL de destino aqui"
                  value={form.destinationUrl}
                  onChange={(e) => setForm({ ...form, destinationUrl: e.target.value })}
                  required
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
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/links')}
                    sx={{ 
                      px: 3,
                      py: 1,
                      color: '#64748b',
                      borderColor: 'rgba(0,0,0,0.08)',
                      '&:hover': {
                        borderColor: '#64748b',
                        bgcolor: 'rgba(100, 116, 139, 0.04)'
                      }
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{ 
                      px: 3,
                      py: 1,
                      bgcolor: '#1976d2',
                      '&:hover': {
                        bgcolor: '#1565c0'
                      }
                    }}
                  >
                    {loading ? 'Criando...' : 'Criar Link'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>

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
    </Box>
  );
} 