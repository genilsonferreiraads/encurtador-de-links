import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Fade,
  Chip,
  useTheme,
  alpha,
  Avatar,
  useMediaQuery
} from '@mui/material';
import { 
  Add as AddIcon, 
  Refresh as RefreshIcon, 
  Edit as EditIcon,
  Person as PersonIcon,
  Key as KeyIcon,
  Badge as BadgeIcon,
  Close as CloseIcon,
  AlternateEmail as AlternateEmailIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { supabase } from '../services/supabase';
import { Usuario } from '../services/supabase';
import React from 'react';

function UsersManagementPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [deletingUser, setDeletingUser] = useState<Usuario | null>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ open: false, message: '', type: 'success' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data: users, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('role', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Ordenar usuários: admin primeiro, depois usuários por data de criação (mais recente primeiro)
      const sortedUsers = users?.sort((a, b) => {
        if (a.role === 'admin') return -1;
        if (b.role === 'admin') return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setUsers(sortedUsers || []);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      showNotification('Erro ao carregar usuários', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!username || !password || !fullName || !email) {
        throw new Error('Todos os campos são obrigatórios');
      }

      const { data, error } = await supabase.rpc('create_new_user', {
        p_username: username,
        p_password: password,
        p_full_name: fullName,
        p_email: email,
        p_role: 'user'
      });

      if (error) throw error;

      showNotification('Usuário criado com sucesso!', 'success');
      setUsername('');
      setPassword('');
      setFullName('');
      setEmail('');
      setShowCreateForm(false);
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: Usuario) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditPassword(''); // Limpa a senha no formulário de edição
  };

  const handleCloseEdit = () => {
    setEditingUser(null);
    setEditUsername('');
    setEditPassword('');
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);

      if (!editingUser?.username) {
        throw new Error('Nome de usuário é obrigatório');
      }

      // Atualiza o usuário usando a nova função que atualiza username e senha
      const { error: updateError } = await supabase.rpc('update_user_info', {
        p_user_id: editingUser?.id,
        p_new_username: editingUser.username,
        p_new_password: editPassword || null
      });

      if (updateError) throw updateError;

      showNotification('Usuário atualizado com sucesso!', 'success');
      handleCloseEdit();
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', deletingUser.id);

      if (error) throw error;

      showNotification('Usuário excluído com sucesso!', 'success');
      setDeletingUser(null);
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
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

  return (
    <Box sx={{ 
      minHeight: '100%',
      background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
      py: 4
    }}>
      <Container maxWidth="md" sx={{ py: { xs: 0, sm: 6 }, px: { xs: 0, sm: 3 } }}>
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: { xs: 0, sm: '24px' },
            overflow: 'hidden',
            border: { xs: 'none', sm: '1px solid' },
            borderColor: { xs: 'transparent', sm: 'rgba(0,0,0,0.08)' },
            bgcolor: '#ffffff',
            boxShadow: { xs: 'none', sm: '0 4px 40px rgba(0,0,0,0.03)' },
            minHeight: { xs: '100vh', sm: 'auto' }
          }}
        >
          {/* Cabeçalho */}
          <Box sx={{ 
            p: { xs: 2, sm: 3 }, 
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(145deg, #f8fafc 0%, #ffffff 100%)'
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 2, sm: 0 },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'center' }
            }}>
              {/* Título e Descrição */}
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
                  <PersonIcon sx={{ 
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
                    Gerenciamento de Usuários
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#64748b',
                    fontWeight: 500,
                    display: { xs: 'none', sm: 'block' }
                  }}>
                    Gerencie todos os usuários do sistema
                  </Typography>
                </Box>
              </Box>

              {/* Botões de Ação */}
              <Box sx={{ 
                display: 'flex', 
                gap: 1.5,
                flexDirection: { xs: 'row', sm: 'row' },
                justifyContent: { xs: 'stretch', sm: 'flex-end' }
              }}>
                <Tooltip title="Atualizar lista" arrow placement="left">
                  <IconButton 
                    onClick={loadUsers} 
                    disabled={loading}
                    sx={{
                      width: { xs: 48, sm: 42 },
                      height: { xs: 48, sm: 42 },
                      bgcolor: 'rgba(25, 118, 210, 0.08)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '12px',
                      '&:hover': {
                        bgcolor: 'rgba(25, 118, 210, 0.16)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease-in-out',
                      flex: { xs: 1, sm: 'none' }
                    }}
                  >
                    <RefreshIcon sx={{ 
                      fontSize: { xs: 22, sm: 20 },
                      width: { xs: 22, sm: 20 },
                      height: { xs: 22, sm: 20 }
                    }} />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowCreateForm(true)}
                  sx={{
                    height: { xs: 48, sm: 42 },
                    px: { xs: 3, sm: 3 },
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontSize: { xs: '0.9375rem', sm: '0.95rem' },
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                    flex: { xs: 1, sm: 'none' },
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  Novo Usuário
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Lista de Usuários */}
          <Box sx={{ 
            p: { xs: 0, sm: 3 },
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: '8px'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: '4px'
            }
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    color: '#64748b',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    p: 0,
                    py: { xs: 1.5, sm: 2 },
                    width: { xs: 'auto', sm: 'max-content' },
                    minWidth: { xs: '180px', sm: 'auto' },
                    textAlign: 'center',
                    borderRight: '1px solid #e2e8f0'
                  }}>
                    Usuário
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    color: '#64748b',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    p: 0,
                    py: { xs: 1.5, sm: 2 },
                    width: { xs: 'auto', sm: 'max-content' },
                    minWidth: { xs: '120px', sm: 'auto' },
                    textAlign: 'center'
                  }}>
                    Função
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <React.Fragment key={user.id}>
                    <TableRow 
                      sx={{
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          bgcolor: 'rgba(25, 118, 210, 0.04)',
                        },
                        '& td': {
                          fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                          py: { xs: 1.5, sm: 2 },
                          borderBottom: '1px solid #f1f5f9',
                          px: { xs: 2, sm: 2 },
                          '&:first-of-type': {
                            borderRight: '1px solid #e2e8f0',
                            width: { xs: 'auto', sm: 'max-content' }
                          },
                          '&:last-of-type': {
                            width: { xs: 'auto', sm: 'max-content' }
                          }
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          gap: 1.5,
                          width: 'max-content',
                          margin: '0 auto'
                        }}>
                          <Avatar 
                            src={user.avatar_url || undefined}
                            sx={{ 
                              width: { xs: 36, sm: 32 }, 
                              height: { xs: 36, sm: 32 },
                              bgcolor: `hsl(${String(user.id).charCodeAt(0) * 10}, 70%, 50%)`,
                              fontSize: '0.875rem',
                              fontWeight: 600
                            }}
                          >
                            {user.full_name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ 
                              fontWeight: 500,
                              fontSize: { xs: '0.875rem', sm: 'inherit' },
                              textAlign: 'left',
                              whiteSpace: 'nowrap'
                            }}>
                              {user.full_name}
                            </Typography>
                            <Typography 
                              sx={{ 
                                color: '#64748b',
                                fontSize: '0.75rem',
                                textAlign: 'left',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              @{user.username}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'center',
                          width: 'max-content',
                          margin: '0 auto'
                        }}>
                          <Chip
                            label={user.role === 'admin' ? 'Administrador' : 'Usuário'}
                            size="small"
                            sx={{
                              height: { xs: 28, sm: 24 },
                              borderRadius: '8px',
                              px: 1,
                              fontWeight: 600,
                              fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                              whiteSpace: 'nowrap',
                              ...(user.role === 'admin' ? {
                                bgcolor: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                              } : {
                                bgcolor: 'rgba(25, 118, 210, 0.1)',
                                color: '#1976d2',
                                border: '1px solid rgba(25, 118, 210, 0.2)'
                              })
                            }}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={2} sx={{ 
                        borderBottom: '1px solid #f1f5f9',
                        py: { xs: 1, sm: 1.5 },
                        px: 2,
                        bgcolor: 'rgba(241, 245, 249, 0.3)'
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between'
                        }}>
                          <Typography sx={{ 
                            color: '#64748b',
                            fontSize: '0.75rem'
                          }}>
                            Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              onClick={() => handleEditUser(user)}
                              sx={{ 
                                width: 32,
                                height: 32,
                                bgcolor: 'rgba(25, 118, 210, 0.08)',
                                color: '#1976d2',
                                '&:hover': { 
                                  bgcolor: 'rgba(25, 118, 210, 0.16)',
                                  transform: 'translateY(-1px)'
                                }
                              }}
                            >
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            {user.role !== 'admin' && (
                              <IconButton 
                                onClick={() => setDeletingUser(user)}
                                sx={{ 
                                  width: 32,
                                  height: 32,
                                  bgcolor: 'rgba(239, 68, 68, 0.08)',
                                  color: '#ef4444',
                                  '&:hover': { 
                                    bgcolor: 'rgba(239, 68, 68, 0.16)',
                                    transform: 'translateY(-1px)'
                                  }
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>

        {/* Modal de Confirmação de Exclusão */}
        <Dialog
          open={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 3 },
              width: { xs: '100%', sm: '400px' },
              maxWidth: '100%',
              m: { xs: 0, sm: 3 }
            }
          }}
        >
          <DialogTitle sx={{ 
            p: { xs: 2, sm: 3 },
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'linear-gradient(145deg, #fee2e2 0%, #fff 100%)',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ 
              bgcolor: '#ef4444',
              p: 1,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <WarningIcon sx={{ color: '#fff' }} />
            </Box>
            <Typography sx={{ 
              fontWeight: 600,
              color: '#ef4444',
              fontSize: { xs: '1.25rem', sm: '1.25rem' }
            }}>
              Confirmar Exclusão
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 } }}>
            <Typography sx={{ color: '#475569' }}>
              Tem certeza que deseja excluir o usuário <strong>{deletingUser?.full_name}</strong>? Esta ação não pode ser desfeita.
            </Typography>
          </DialogContent>

          <DialogActions sx={{ 
            p: { xs: 2, sm: 3 },
            gap: { xs: 2, sm: 1 },
            flexDirection: { xs: 'column', sm: 'row' },
            background: 'linear-gradient(145deg, #fff 0%, #fafafa 100%)'
          }}>
            <Button
              variant="outlined"
              onClick={() => setDeletingUser(null)}
              fullWidth={isMobile}
              sx={{ 
                borderRadius: '10px',
                px: 3,
                py: { xs: 1.5, sm: 1 },
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#e2e8f0',
                color: '#64748b',
                order: { xs: 2, sm: 1 },
                '&:hover': {
                  borderColor: '#cbd5e1',
                  bgcolor: '#f8fafc'
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteUser}
              variant="contained"
              disabled={loading}
              fullWidth={isMobile}
              sx={{
                borderRadius: '10px',
                px: 3,
                py: { xs: 1.5, sm: 1 },
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                order: { xs: 1, sm: 2 },
                '&:hover': {
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)'
                }
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Excluir Usuário'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Edição */}
        <Dialog 
          open={!!editingUser} 
          onClose={handleCloseEdit}
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 3 },
              width: { xs: '100%', sm: '600px' },
              maxWidth: '100%',
              m: { xs: 0, sm: 3 }
            }
          }}
        >
          <DialogTitle sx={{ 
            p: { xs: 2, sm: 3 },
            background: 'linear-gradient(145deg, #f8fafc 0%, #ffffff 100%)',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <PersonIcon sx={{ color: '#1976d2', fontSize: { xs: 24, sm: 28 } }} />
              <Typography sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                color: '#1e293b'
              }}>
                Editar Usuário
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
              <TextField
                label="Nome Completo"
                value={editingUser?.full_name || ''}
                onChange={(e) => setEditingUser(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#64748b' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8fafc'
                  }
                }}
              />
              <TextField
                label="Username"
                value={editingUser?.username || ''}
                onChange={(e) => setEditingUser(prev => prev ? { ...prev, username: e.target.value } : null)}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AlternateEmailIcon sx={{ color: '#64748b' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8fafc'
                  }
                }}
              />
              <TextField
                label="Nova Senha (opcional)"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon sx={{ color: '#64748b' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8fafc'
                  }
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ 
            px: { xs: 2, sm: 3 }, 
            py: { xs: 2, sm: 2.5 }, 
            gap: { xs: 2, sm: 1 },
            flexDirection: { xs: 'column', sm: 'row' },
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
          }}>
            <Button
              variant="outlined"
              onClick={handleCloseEdit}
              fullWidth={isMobile}
              sx={{ 
                borderRadius: '10px',
                px: 3,
                py: { xs: 1.5, sm: 1 },
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#e2e8f0',
                color: '#64748b',
                order: { xs: 2, sm: 1 },
                '&:hover': {
                  borderColor: '#cbd5e1',
                  bgcolor: '#f8fafc'
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              variant="contained"
              disabled={loading}
              fullWidth={isMobile}
              sx={{
                borderRadius: '10px',
                px: 3,
                py: { xs: 1.5, sm: 1 },
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                order: { xs: 1, sm: 2 },
                '&:hover': {
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)'
                }
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Criação */}
        <Dialog 
          open={showCreateForm} 
          onClose={() => setShowCreateForm(false)}
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 3 },
              width: { xs: '100%', sm: '600px' },
              maxWidth: '100%',
              m: { xs: 0, sm: 3 }
            }
          }}
        >
          <DialogTitle sx={{ 
            p: { xs: 2, sm: 3 },
            background: 'linear-gradient(145deg, #f8fafc 0%, #ffffff 100%)',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AddIcon sx={{ color: '#1976d2', fontSize: { xs: 24, sm: 28 } }} />
              <Typography sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                color: '#1e293b'
              }}>
                Novo Usuário
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box component="form" onSubmit={handleCreateUser} autoComplete="off" sx={{ display: 'grid', gap: 2, pt: 3 }}>
              <TextField
                label="Nome Completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#64748b' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8fafc'
                  }
                }}
              />
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AlternateEmailIcon sx={{ color: '#64748b' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8fafc'
                  }
                }}
              />
              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
                required
                name="new-user-username"
                autoComplete="off"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AlternateEmailIcon sx={{ color: '#64748b' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8fafc'
                  }
                }}
              />
              <TextField
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                name="new-user-password"
                autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon sx={{ color: '#64748b' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8fafc'
                  }
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ 
            px: { xs: 2, sm: 3 }, 
            py: { xs: 2, sm: 2.5 }, 
            gap: { xs: 2, sm: 1 },
            flexDirection: { xs: 'column', sm: 'row' },
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
          }}>
            <Button
              variant="outlined"
              onClick={() => setShowCreateForm(false)}
              fullWidth={isMobile}
              sx={{ 
                borderRadius: '10px',
                px: 3,
                py: { xs: 1.5, sm: 1 },
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#e2e8f0',
                color: '#64748b',
                order: { xs: 2, sm: 1 },
                '&:hover': {
                  borderColor: '#cbd5e1',
                  bgcolor: '#f8fafc'
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              variant="contained"
              disabled={loading}
              fullWidth={isMobile}
              sx={{
                borderRadius: '10px',
                px: 3,
                py: { xs: 1.5, sm: 1 },
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                order: { xs: 1, sm: 2 },
                '&:hover': {
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)'
                }
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Criar Usuário'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.type}
            variant="filled"
            sx={{ 
              width: '100%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderRadius: 2
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default UsersManagementPage; 