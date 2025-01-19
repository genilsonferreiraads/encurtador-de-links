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
} from '@mui/material';
import { supabase, getCurrentUser } from '../services/supabase';

function ProfilePage() {
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

      // Se existe uma foto anterior, vamos excluí-la
      if (user.avatar_url) {
        try {
          const urlParts = user.avatar_url.split('/');
          const oldFileName = urlParts[urlParts.length - 1];
          
          console.log('Verificando arquivo existente:', oldFileName);
          
          // Primeiro, verifica se o arquivo existe
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
              // Arquivo encontrado, tenta excluir
              const { error: deleteError } = await supabase.storage
                .from('avatars')
                .remove([oldFileName]);

              if (deleteError) {
                console.error('Erro ao excluir foto antiga:', deleteError);
              } else {
                console.log('Arquivo antigo excluído com sucesso:', oldFileName);
                
                // Verifica se o arquivo foi realmente excluído
                const { data: checkFiles } = await supabase.storage
                  .from('avatars')
                  .list('', {
                    search: oldFileName
                  });
                
                if (checkFiles && checkFiles.length === 0) {
                  console.log('Confirmado: arquivo foi excluído');
                } else {
                  console.log('Aviso: arquivo ainda parece existir após tentativa de exclusão');
                }
              }
            } else {
              console.log('Arquivo antigo não encontrado:', oldFileName);
            }
          }
        } catch (deleteError) {
          console.error('Erro ao tentar excluir arquivo antigo:', deleteError);
        }
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Usar timestamp para garantir nome único
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      console.log('Fazendo upload do novo arquivo:', fileName);

      // Upload da nova imagem
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      console.log('Upload concluído com sucesso');

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newAvatarUrl = data.publicUrl;
      console.log('Nova URL do avatar:', newAvatarUrl);

      // Update user profile
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
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 2, bgcolor: 'white' }}>
        <Typography variant="h5" sx={{ mb: 4, fontWeight: 600, color: '#1e293b' }}>
          Configurações do Perfil
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Avatar
            src={avatarUrl || undefined}
            sx={{
              width: 120,
              height: 120,
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
                objectFit: 'cover'
              }
            }}
          >
            {!avatarUrl && username.charAt(0).toUpperCase()}
          </Avatar>

          <Button
            component="label"
            variant="outlined"
            disabled={uploading}
            sx={{ 
              textTransform: 'none',
              borderColor: '#1976d2',
              color: '#1976d2',
              '&:hover': {
                borderColor: '#1565c0',
                bgcolor: 'rgba(25, 118, 210, 0.04)'
              }
            }}
          >
            {uploading ? 'Enviando...' : 'Alterar Foto de Perfil'}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={uploading}
            />
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b' }}>
            Nome de Usuário
          </Typography>
          <TextField
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Digite seu nome de usuário"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'white',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#1976d2'
                }
              }
            }}
          />
        </Box>

        <Button
          variant="contained"
          onClick={handleUsernameUpdate}
          disabled={loading}
          sx={{
            textTransform: 'none',
            bgcolor: '#1976d2',
            '&:hover': {
              bgcolor: '#1565c0'
            }
          }}
        >
          Salvar Alterações
        </Button>
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
  );
}

export default ProfilePage; 