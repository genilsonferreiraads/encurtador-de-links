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
  IconButton,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { supabase, getCurrentUser } from '../services/supabase';
import LinkIcon from '@mui/icons-material/Link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TitleIcon from '@mui/icons-material/Title';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import AddLinkIcon from '@mui/icons-material/AddLink';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

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
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
        py: { xs: 0, sm: 4 }
      }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 0, sm: 3 } }}>
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
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Tooltip title="Voltar para links" placement="right">
              <IconButton
                onClick={() => navigate('/links')}
                sx={{
                  color: '#64748b',
                  '&:hover': {
                    bgcolor: 'rgba(100, 116, 139, 0.08)',
                    transform: 'translateX(-2px)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  borderRadius: '12px',
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                  transform: 'rotate(-5deg)'
                }}
              >
                <AddLinkIcon sx={{ 
                  fontSize: { xs: 24, sm: 28 },
                  color: '#fff'
                }} />
              </Box>
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                color: '#1e293b',
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                letterSpacing: '-0.02em'
              }}>
                Criar Novo Link
              </Typography>
            </Box>
          </Box>

          {/* Formulário */}
          <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
            {error && (
              <Alert 
                severity="error" 
                icon={<ErrorOutlineIcon />}
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  border: '1px solid rgba(220, 38, 38, 0.1)',
                  bgcolor: 'rgba(220, 38, 38, 0.05)',
                  '& .MuiAlert-icon': {
                    color: '#dc2626'
                  }
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ 
                    color: '#64748b', 
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <TitleIcon sx={{ fontSize: 18 }} />
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
                  <Typography variant="subtitle2" sx={{ 
                    color: '#64748b', 
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <LinkIcon sx={{ fontSize: 18 }} />
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
                        <InputAdornment position="start">
                          <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
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
                  <Typography variant="subtitle2" sx={{ 
                    color: '#64748b', 
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <InsertLinkIcon sx={{ fontSize: 18 }} />
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
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    mt: { xs: 2, sm: 0 },
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'flex-end'
                  }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/links')}
                      fullWidth={false}
                      startIcon={<CancelIcon />}
                      sx={{ 
                        flex: { xs: '1', sm: '0 0 auto' },
                        height: { xs: 48, sm: 42 },
                        color: '#64748b',
                        borderColor: 'rgba(0,0,0,0.08)',
                        '&:hover': {
                          borderColor: '#64748b',
                          bgcolor: 'rgba(100, 116, 139, 0.04)',
                          transform: 'translateY(-1px)'
                        },
                        '& .MuiButton-startIcon': {
                          marginRight: { xs: 1, sm: 0.5 },
                          '& svg': {
                            fontSize: { xs: 20, sm: 18 }
                          }
                        }
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      fullWidth={false}
                      startIcon={loading ? <SaveIcon className="spin" /> : <CheckIcon />}
                      sx={{ 
                        flex: { xs: '1', sm: '0 0 auto' },
                        height: { xs: 48, sm: 42 },
                        px: { xs: 6, sm: 4 },
                        bgcolor: '#1976d2',
                        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                          boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
                          transform: 'translateY(-1px)'
                        },
                        '& .MuiButton-startIcon': {
                          marginRight: { xs: 1, sm: 0.5 },
                          '& svg': {
                            fontSize: { xs: 20, sm: 18 }
                          },
                          '& .spin': {
                            animation: 'spin 1s linear infinite'
                          }
                        },
                        '@keyframes spin': {
                          '0%': {
                            transform: 'rotate(0deg)'
                          },
                          '100%': {
                            transform: 'rotate(360deg)'
                          }
                        }
                      }}
                    >
                      {loading ? 'Criando...' : 'Criar Link'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
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
          icon={notification.type === 'success' ? <CheckIcon /> : <ErrorOutlineIcon />}
          variant="filled"
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleCloseNotification}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
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