import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Container,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Fade,
} from '@mui/material';
import {
  Person as PersonIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  AlternateEmail as AlternateEmailIcon,
} from '@mui/icons-material';
import { supabase, getCurrentUser } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

function ProfilePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ open: false, message: '', type: 'success' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setUsername(currentUser.username || '');
        setAvatarUrl(currentUser.avatar_url);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      showNotification('Erro ao carregar perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você precisa selecionar uma imagem para upload.');
      }

      const file = event.target.files[0];
      
      // Redimensionar a imagem antes do upload
      const resizedImage = await new Promise<File>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Definir tamanho ideal para avatar (400x400 para garantir boa qualidade)
          const maxSize = 400;
          let width = img.width;
          let height = img.height;
          
          // Manter aspecto e redimensionar para o tamanho máximo
          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Não foi possível criar o contexto do canvas'));
            return;
          }
          
          // Melhorar a qualidade do redimensionamento
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Não foi possível converter a imagem'));
              return;
            }
            const fileExt = file.name.split('.').pop();
            const newFile = new File([blob], file.name, {
              type: `image/${fileExt}`,
              lastModified: Date.now(),
            });
            resolve(newFile);
          }, file.type, 1.0); // Qualidade máxima
        };
        img.onerror = () => reject(new Error('Erro ao carregar a imagem'));
        img.src = URL.createObjectURL(file);
      });

      // Se existe uma foto anterior, vamos excluí-la
      if (user.avatar_url) {
        try {
          const urlParts = user.avatar_url.split('/');
          const oldFileName = urlParts[urlParts.length - 1];
          
          console.log('Verificando arquivo existente:', oldFileName);
          
          const { data: existingFiles, error: listError } = await supabase.storage
            .from('avatars')
            .list('', {
              search: oldFileName
            });

          if (listError) {
            console.error('Erro ao listar arquivos:', listError);
          } else {
            console.log('Arquivos encontrados:', existingFiles);
            
            if (existingFiles && existingFiles.length > 0) {
              const { error: deleteError } = await supabase.storage
                .from('avatars')
                .remove([oldFileName]);

              if (deleteError) {
                console.error('Erro ao excluir foto antiga:', deleteError);
              } else {
                console.log('Arquivo antigo excluído com sucesso:', oldFileName);
              }
            }
          }
        } catch (deleteError) {
          console.error('Erro ao tentar excluir arquivo antigo:', deleteError);
        }
      }

      const fileExt = resizedImage.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      console.log('Fazendo upload do novo arquivo:', fileName);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, resizedImage);

      if (uploadError) {
        throw uploadError;
      }

      console.log('Upload concluído com sucesso');

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newAvatarUrl = data.publicUrl;
      console.log('Nova URL do avatar:', newAvatarUrl);

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(newAvatarUrl);
      showNotification('Foto de perfil atualizada com sucesso', 'success');
    } catch (error: any) {
      console.error('Erro ao fazer upload da foto:', error);
      showNotification(error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleUsernameUpdate = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('usuarios')
        .update({ username: username })
        .eq('id', user.id);

      if (error) throw error;

      showNotification('Nome de usuário atualizado com sucesso', 'success');
    } catch (error: any) {
      console.error('Erro ao atualizar nome de usuário:', error);
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
      py: { xs: 0, sm: 4 }
    }}>
      <Container maxWidth="sm" sx={{ px: { xs: 0, sm: 3 } }}>
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
          {/* Header */}
          <Box sx={{ 
            p: { xs: 2, sm: 3 }, 
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(145deg, #f8fafc 0%, #ffffff 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <IconButton 
              onClick={() => navigate(-1)}
              sx={{
                bgcolor: 'rgba(25, 118, 210, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.16)',
                  transform: 'translateX(-2px)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                color: '#1e293b',
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                letterSpacing: '-0.02em'
              }}>
                Configurações do Perfil
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#64748b',
                fontWeight: 500,
                display: { xs: 'none', sm: 'block' }
              }}>
                Gerencie suas informações pessoais
              </Typography>
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Avatar Section */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              mb: 4,
              position: 'relative'
            }}>
              <Avatar
                src={avatarUrl || undefined}
                sx={{
                  width: { xs: 120, sm: 140 },
                  height: { xs: 120, sm: 140 },
                  mb: 2,
                  bgcolor: !avatarUrl ? '#1976d2' : 'transparent',
                  fontSize: '3rem',
                  border: '4px solid #fff',
                  boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.12)',
                  position: 'relative',
                  overflow: 'hidden',
                  '& .MuiAvatar-img': {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scale(1.02)'
                  }
                }}
              >
                {!avatarUrl && username.charAt(0).toUpperCase()}
              </Avatar>

              <Button
                component="label"
                variant="outlined"
                disabled={uploading}
                startIcon={<PhotoCameraIcon />}
                sx={{ 
                  textTransform: 'none',
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  borderRadius: '12px',
                  px: 3,
                  py: { xs: 1.2, sm: 1 },
                  fontSize: { xs: '0.9375rem', sm: '0.875rem' },
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#1565c0',
                    bgcolor: 'rgba(25, 118, 210, 0.04)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {uploading ? 'Enviando...' : 'Alterar Foto'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
              </Button>
            </Box>

            {/* Username Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ 
                mb: 1, 
                color: '#64748b',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <PersonIcon sx={{ fontSize: 20 }} />
                Nome de Usuário
              </Typography>
              <TextField
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu nome de usuário"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AlternateEmailIcon sx={{ color: '#64748b' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: '#f8fafc',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2'
                    },
                    '& .MuiOutlinedInput-input': {
                      py: { xs: 1.8, sm: 1.5 }
                    }
                  }
                }}
              />
            </Box>

            {/* Save Button */}
            <Button
              variant="contained"
              onClick={handleUsernameUpdate}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              fullWidth
              sx={{
                borderRadius: '12px',
                py: { xs: 1.8, sm: 1.5 },
                textTransform: 'none',
                fontSize: { xs: '0.9375rem', sm: '0.875rem' },
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </Box>
        </Paper>

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{
            '& .MuiAlert-root': {
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }
          }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.type}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default ProfilePage; 