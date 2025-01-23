import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Paper,
  Switch,
  FormControlLabel,
  Collapse,
  RadioGroup,
  Radio,
  FormControl,
  InputAdornment,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  Alert,
  Snackbar,
  MenuItem,
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Timer as TimerIcon,
  Lock as LockIcon,
  FlashOn as FlashOnIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { supabase } from '../services/supabase';
import { getCurrentUser } from '../services/supabase';

function CreateLinkPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [advancedEnabled, setAdvancedEnabled] = useState(false);
  const [advancedType, setAdvancedType] = useState<'expirable' | 'selfDestruct' | 'password' | null>(null);
  const [expirationValue, setExpirationValue] = useState('');
  const [expirationUnit, setExpirationUnit] = useState<'minutes' | 'hours' | 'days'>('hours');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    open: false,
    message: '',
    type: 'success'
  });

  const cleanSlug = (value: string) => {
    // Remove espaços, pontos e caracteres especiais
    // Mantém apenas letras, números, hífen e underscore
    return value.toLowerCase()
      .replace(/[^a-z0-9-_]/g, '')
      .replace(/\.+/g, '')
      .replace(/\s+/g, '-');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Adiciona https:// se não houver protocolo
      const formattedUrl = destinationUrl.startsWith('http://') || destinationUrl.startsWith('https://')
        ? destinationUrl
        : `https://${destinationUrl}`;

      let expiresAt = null;
      if (advancedEnabled && advancedType === 'expirable' && expirationValue) {
        const now = new Date();
        const value = Number(expirationValue);
        
        if (value <= 0) {
          throw new Error('O tempo de expiração deve ser maior que zero');
        }

        let minutes = value;
        if (expirationUnit === 'hours') {
          minutes = value * 60;
        } else if (expirationUnit === 'days') {
          minutes = value * 24 * 60;
        }

        expiresAt = new Date(now.getTime() + minutes * 60 * 1000).toISOString();
      }

      const { data, error } = await supabase
        .from('links')
        .insert([
          {
            title,
            destination_url: formattedUrl,
            slug: customSlug || undefined,
            user_id: user.id,
            advanced_type: advancedEnabled ? advancedType : null,
            expires_at: expiresAt,
            is_self_destruct: advancedEnabled && advancedType === 'selfDestruct',
            password: advancedEnabled && advancedType === 'password' ? password : null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      navigate('/', { 
        state: { 
          successMessage: 'Link criado com sucesso!',
          newLinkId: data.id 
        } 
      });
    } catch (error: any) {
      console.error('Erro ao criar link:', error);
      showNotification(error.message || 'Erro ao criar link', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 } }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={() => navigate('/')}
          sx={{ 
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Criar Novo Link
        </Typography>
      </Box>

      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        autoComplete="off"
        sx={{
          p: { xs: 2, sm: 3 },
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
        }}
      >
        <Stack spacing={3}>
          <TextField
            label="Título do Link"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            autoComplete="off"
            name="title"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <TextField
            label="URL de Destino"
            value={destinationUrl}
            onChange={(e) => {
              let url = e.target.value;
              // Remove http:// ou https:// se existir
              url = url.replace(/^(https?:\/\/)/, '');
              setDestinationUrl(url);
            }}
            fullWidth
            required
            autoComplete="off"
            name="url"
            placeholder="Ex: youtube.com/"
            helperText="Digite a URL sem http:// ou https://"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <TextField
            label="Slug Personalizado (opcional)"
            value={customSlug}
            onChange={(e) => setCustomSlug(cleanSlug(e.target.value))}
            fullWidth
            autoComplete="off"
            name="random_field_name_123"
            helperText="Use apenas letras, números, hífen (-) e underscore (_)"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={advancedEnabled}
                  onChange={(e) => {
                    setAdvancedEnabled(e.target.checked);
                    if (!e.target.checked) {
                      setAdvancedType(null);
                      setPassword('');
                      setExpirationValue('');
                    }
                  }}
                />
              }
              label={
                <Typography sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Funções Avançadas
                  <Tooltip title="Configure opções avançadas como expiração, autodestruição ou proteção por senha">
                    <InfoIcon sx={{ fontSize: 16, color: 'text.secondary', ml: 0.5 }} />
                  </Tooltip>
                </Typography>
              }
              sx={{ mx: { xs: 1, sm: 0 } }}
            />

            <Collapse in={advancedEnabled}>
              <Box sx={{ mt: 2, mx: { xs: -1, sm: 0 } }}>
                <RadioGroup
                  value={advancedType || ''}
                  onChange={(e) => setAdvancedType(e.target.value as any)}
                >
                  <Stack spacing={2} sx={{ px: { xs: 1, sm: 0 } }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        border: '1px solid',
                        borderColor: advancedType === 'expirable' ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        bgcolor: advancedType === 'expirable' ? 'primary.50' : 'background.paper',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'primary.50'
                        }
                      }}
                      onClick={() => setAdvancedType('expirable')}
                    >
                      <FormControlLabel
                        value="expirable"
                        control={<Radio />}
                        label={
                          <Box sx={{ ml: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <AccessTimeIcon sx={{ color: 'primary.main' }} />
                              <Typography sx={{ fontWeight: 600 }}>
                                Link Expirável
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              O link deixará de funcionar após o tempo determinado
                            </Typography>

                            <Collapse in={advancedType === 'expirable'}>
                              <Box sx={{ mt: 2 }}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  gap: 1.5,
                                  alignItems: 'flex-start',
                                  flexDirection: { xs: 'column', sm: 'row' }
                                }}>
                                  <TextField
                                    label="Tempo"
                                    type="text"
                                    value={expirationValue}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^0-9]/g, '');
                                      if (value === '' || (Number(value) >= 0 && Number(value) <= 999)) {
                                        setExpirationValue(value);
                                      }
                                    }}
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          <TimerIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                        </InputAdornment>
                                      )
                                    }}
                                    inputProps={{ 
                                      style: { textAlign: 'center' },
                                      maxLength: 3
                                    }}
                                    sx={{ 
                                      width: { xs: '100%', sm: '120px' },
                                      '& .MuiOutlinedInput-root': { 
                                        borderRadius: 2,
                                        height: '42px',
                                      },
                                      '& .MuiOutlinedInput-input': {
                                        p: '8px 4px',
                                        '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
                                          display: 'none'
                                        }
                                      }
                                    }}
                                  />
                                  
                                  <TextField
                                    select
                                    value={expirationUnit}
                                    onChange={(e) => setExpirationUnit(e.target.value as 'minutes' | 'hours' | 'days')}
                                    sx={{ 
                                      width: { xs: '100%', sm: '120px' },
                                      '& .MuiOutlinedInput-root': { 
                                        borderRadius: 2,
                                        height: '42px'
                                      }
                                    }}
                                    SelectProps={{
                                      MenuProps: {
                                        PaperProps: {
                                          elevation: 2,
                                          sx: {
                                            borderRadius: 2,
                                            mt: 1,
                                            '& .MuiMenuItem-root': {
                                              minHeight: '36px',
                                              typography: 'body2',
                                              fontWeight: 500,
                                              '&:hover': {
                                                bgcolor: 'primary.50'
                                              },
                                              '&.Mui-selected': {
                                                bgcolor: 'primary.50',
                                                '&:hover': {
                                                  bgcolor: 'primary.100'
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }}
                                  >
                                    <MenuItem value="minutes">Minutos</MenuItem>
                                    <MenuItem value="hours">Horas</MenuItem>
                                    <MenuItem value="days">Dias</MenuItem>
                                  </TextField>
                                </Box>

                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    mt: 1.5,
                                    color: 'text.secondary',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                  }}
                                >
                                  <InfoIcon sx={{ fontSize: 16 }} />
                                  {expirationValue && Number(expirationValue) > 0 ? (
                                    `O link expirará em ${expirationValue} ${
                                      expirationUnit === 'minutes' ? 
                                        Number(expirationValue) === 1 ? 'minuto' : 'minutos' : 
                                      expirationUnit === 'hours' ? 
                                        Number(expirationValue) === 1 ? 'hora' : 'horas' : 
                                        Number(expirationValue) === 1 ? 'dia' : 'dias'
                                    }`
                                  ) : 'Defina um tempo de expiração'}
                                </Typography>
                              </Box>
                            </Collapse>
                          </Box>
                        }
                      />
                    </Paper>

                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        border: '1px solid',
                        borderColor: advancedType === 'selfDestruct' ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        bgcolor: advancedType === 'selfDestruct' ? 'primary.50' : 'background.paper',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'primary.50'
                        }
                      }}
                      onClick={() => setAdvancedType('selfDestruct')}
                    >
                      <FormControlLabel
                        value="selfDestruct"
                        control={<Radio />}
                        label={
                          <Box sx={{ ml: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <FlashOnIcon sx={{ color: 'primary.main' }} />
                              <Typography sx={{ fontWeight: 600 }}>
                                Link Autodestrutivo
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              O link só pode ser acessado uma única vez
                            </Typography>
                          </Box>
                        }
                      />
                    </Paper>

                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        border: '1px solid',
                        borderColor: advancedType === 'password' ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        bgcolor: advancedType === 'password' ? 'primary.50' : 'background.paper',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'primary.50'
                        }
                      }}
                      onClick={() => setAdvancedType('password')}
                    >
                      <FormControlLabel
                        value="password"
                        control={<Radio />}
                        label={
                          <Box sx={{ ml: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <LockIcon sx={{ color: 'primary.main' }} />
                              <Typography sx={{ fontWeight: 600 }}>
                                Link Protegido
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              O link só pode ser acessado com uma senha
                            </Typography>

                            <Collapse in={advancedType === 'password'}>
                              <Box sx={{ mt: 2 }}>
                                <TextField
                                  label="Senha"
                                  type={showPassword ? 'text' : 'password'}
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  fullWidth
                                  required={advancedType === 'password'}
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <LockIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                      </InputAdornment>
                                    ),
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <IconButton
                                          onClick={() => setShowPassword(!showPassword)}
                                          edge="end"
                                        >
                                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                      </InputAdornment>
                                    ),
                                  }}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                              </Box>
                            </Collapse>
                          </Box>
                        }
                      />
                    </Paper>
                  </Stack>
                </RadioGroup>
              </Box>
            </Collapse>
          </Box>

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' }
            }}
          >
            {loading ? 'Criando...' : 'Criar Link'}
          </Button>
        </Stack>
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 8 }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.type}
          variant="filled"
          sx={{ 
            minWidth: '280px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '& .MuiAlert-icon': {
              fontSize: 20
            },
            '& .MuiAlert-message': {
              fontSize: '0.875rem',
              fontWeight: 500
            }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default CreateLinkPage; 