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
  CircularProgress
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
  Download as DownloadIcon,
  AutoAwesome as AutoAwesomeIcon,
  Add as AddIcon,
  InsertLink as InsertLinkIcon,
  Title as TitleIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { supabase } from '../services/supabase';
import { getCurrentUser } from '../services/supabase';
import { generateTitleAndSlug } from '../services/gemini';

function CreateLinkPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [downloadEnabled, setDownloadEnabled] = useState(false);
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
  const [isGenerating, setIsGenerating] = useState(false);

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
            is_download: downloadEnabled,
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

  const generateSuggestions = async () => {
    if (!destinationUrl || isGenerating) return;

    setIsGenerating(true);
    try {
      const formattedUrl = destinationUrl.startsWith('http://') || destinationUrl.startsWith('https://')
        ? destinationUrl
        : `https://${destinationUrl}`;

      // Gerar sugestões baseadas apenas na URL, sem tentar acessar o conteúdo
      const suggestion = await generateTitleAndSlug(formattedUrl);

      setTitle(suggestion.title);
      setCustomSlug(suggestion.slug);
      showNotification('Sugestões geradas com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao gerar sugestões:', error);
      showNotification(error.message || 'Erro ao gerar sugestões', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

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
              alignItems: 'center',
              gap: 2,
              mb: { xs: 2, sm: 3 }
            }}>
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
                <AddIcon sx={{ 
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
                Criar Novo Link
              </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#64748b',
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}>
                  Encurte e personalize seus links
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Conteúdo do Formulário */}
          <Box sx={{ p: { xs: 2, sm: 4 } }}>
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
                sx={{ 
          p: { xs: 2, sm: 3 },
                borderRadius: 3,
                bgcolor: '#f8fafc',
          border: '1px solid',
                borderColor: 'divider'
        }}
      >
        <Stack spacing={3}>
                {/* URL de Destino */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1,
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontWeight: 500
                    }}
                  >
                    <InsertLinkIcon sx={{ fontSize: 18 }} />
                    URL de Destino
                  </Typography>
                  <TextField
                    fullWidth
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="Digite a URL de destino"
                    required
                    size="small"
            autoComplete="off"
                    inputProps={{
                      autoComplete: 'off',
                      name: 'destination-url',
                      form: {
                        autoComplete: 'off',
                      },
                    }}
            InputProps={{
                      sx: {
                        bgcolor: '#fff',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(0,0,0,0.08)'
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main'
                        }
                      }
                    }}
                  />
                </Box>

                {/* Título (Opcional) */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1,
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontWeight: 500
                    }}
                  >
                    <TitleIcon sx={{ fontSize: 18 }} />
                    Título (Opcional)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Digite um título para o link"
                      size="small"
                      autoComplete="off"
                      inputProps={{
                        autoComplete: 'off',
                        name: 'link-title',
                        form: {
                          autoComplete: 'off',
                        },
                      }}
                      InputProps={{
                        sx: {
                          bgcolor: '#fff',
                          borderRadius: 2,
                          '& fieldset': {
                            borderColor: 'rgba(0,0,0,0.08)'
                          },
                          '&:hover fieldset': {
                            borderColor: 'primary.main'
                          }
                        }
                      }}
                    />
                    <Tooltip title="Otimizar com IA">
                      <Button
                        onClick={generateSuggestions}
                        disabled={!destinationUrl || isGenerating}
                        sx={{
                          minWidth: 'auto',
                          width: '42px',
                          height: '40px',
                          borderRadius: 2,
                          bgcolor: isGenerating ? 'action.disabledBackground' : 'primary.50',
                          color: 'primary.main',
                          border: '1px solid',
                          borderColor: 'primary.200',
                          '&:hover': {
                            bgcolor: 'primary.100'
                          }
                        }}
                      >
                        {isGenerating ? (
                          <CircularProgress size={20} />
                        ) : (
                      <AutoAwesomeIcon />
                        )}
                      </Button>
                  </Tooltip>
                  </Box>
                </Box>

                {/* Slug Personalizado */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1,
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontWeight: 500
                    }}
                  >
                    <LinkIcon sx={{ fontSize: 18 }} />
                    Slug Personalizado (Opcional)
                  </Typography>
          <TextField
                    fullWidth
            value={customSlug}
            onChange={(e) => setCustomSlug(cleanSlug(e.target.value))}
                    placeholder="Digite um slug"
                    size="small"
            autoComplete="off"
                    inputProps={{
                      autoComplete: 'off',
                      name: 'custom-slug',
                      form: {
                        autoComplete: 'off',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                            {window.location.origin}/
                          </Typography>
                        </InputAdornment>
                      ),
                      sx: {
                        bgcolor: '#fff',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(0,0,0,0.08)'
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main'
                        }
                      }
                    }}
            helperText="Use apenas letras, números, hífen (-) e underscore (_)"
          />
                </Box>

                {/* Opções Avançadas */}
          <Box>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={downloadEnabled}
                    onChange={(e) => {
                      setDownloadEnabled(e.target.checked);
                      if (e.target.checked) {
                        setAdvancedEnabled(false);
                        setAdvancedType(null);
                        setPassword('');
                        setExpirationValue('');
                      }
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Função Download
                    <Tooltip title="Cria uma página intermediária com um botão de download">
                      <InfoIcon sx={{ fontSize: 16, color: 'text.secondary', ml: 0.5 }} />
                    </Tooltip>
                  </Typography>
                }
                sx={{ mx: { xs: 1, sm: 0 } }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={advancedEnabled}
                    onChange={(e) => {
                      setAdvancedEnabled(e.target.checked);
                      if (e.target.checked) {
                        setDownloadEnabled(false);
                      }
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
            </Stack>

            <Collapse in={downloadEnabled}>
              <Box sx={{ mt: 2, mx: { xs: -1, sm: 0 } }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    border: '1px solid',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    bgcolor: 'primary.50',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <DownloadIcon sx={{ color: 'primary.main' }} />
                    <Typography sx={{ fontWeight: 600 }}>
                      Página de Download
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Será criada uma página intermediária com um botão de download. Ao clicar no botão, o usuário será redirecionado para o link de download.
                  </Typography>
                </Paper>
              </Box>
            </Collapse>

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

                {/* Botão de Criar */}
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
            sx={{
              py: 1.5,
                    px: 3,
              borderRadius: 2,
              textTransform: 'none',
                    fontSize: '1rem',
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
            {loading ? 'Criando...' : 'Criar Link'}
          </Button>
        </Stack>
        </Paper>

            {/* Notificações */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
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
          </Box>
        </Paper>
    </Container>
    </Box>
  );
} 

export default CreateLinkPage; 