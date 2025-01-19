import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Alert,
  IconButton,
  InputAdornment,
  Fade,
  Slide
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Lock as LockIcon,
  Link as LinkIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { signIn } from '../services/supabase';

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { user } = await signIn(username, password);
      if (user) {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1976d2, #1565c0)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        }
      }}
    >
      <Slide 
        direction="down" 
        in={true} 
        timeout={400}
        style={{ 
          transitionTimingFunction: 'cubic-bezier(0.2, 0.6, 0.4, 1)'
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            borderRadius: 3,
            bgcolor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            transform: 'translateZ(0)'
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Box 
              sx={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 1,
                mb: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05) translateY(-2px)',
                  '& .MuiSvgIcon-root': {
                    transform: 'rotate(10deg)'
                  }
                }
              }}
            >
              <LinkIcon 
                sx={{ 
                  fontSize: 36, 
                  color: '#1976d2',
                  transition: 'transform 0.3s ease'
                }} 
              />
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  color: '#1976d2',
                  letterSpacing: '-0.5px'
                }}
              >
                Encurtador
              </Typography>
            </Box>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                color: '#64748b',
                fontWeight: 500,
                letterSpacing: '0.5px'
              }}
            >
              <LockIcon sx={{ fontSize: 18 }} />
              Acesso Restrito
            </Typography>
          </Box>

          <Fade in={true} style={{ transitionDelay: '200ms' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <TextField
                fullWidth
                label="Usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                error={!!error}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: error ? '#d32f2f' : '#64748b' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2',
                        borderWidth: '2px'
                      }
                    },
                    '&.Mui-focused': {
                      bgcolor: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2',
                        borderWidth: '2px'
                      },
                      boxShadow: '0 0 0 4px rgba(25, 118, 210, 0.1)'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    '&.Mui-focused': {
                      color: '#1976d2'
                    }
                  }
                }}
              />

              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                label="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                error={!!error}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: error ? '#d32f2f' : '#64748b' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                        sx={{ 
                          color: '#64748b',
                          '&:hover': {
                            color: '#1976d2'
                          }
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2',
                        borderWidth: '2px'
                      }
                    },
                    '&.Mui-focused': {
                      bgcolor: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2',
                        borderWidth: '2px'
                      },
                      boxShadow: '0 0 0 4px rgba(25, 118, 210, 0.1)'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    '&.Mui-focused': {
                      color: '#1976d2'
                    }
                  }
                }}
              />

              {error && (
                <Fade in={true}>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      borderRadius: 2.5,
                      bgcolor: 'rgba(220, 38, 38, 0.05)',
                      color: '#dc2626',
                      border: '1px solid rgba(220, 38, 38, 0.1)',
                      '& .MuiAlert-icon': {
                        color: '#dc2626'
                      }
                    }}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ 
                  mt: 2,
                  py: 1.8,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  background: 'linear-gradient(45deg, #1976d2, #1565c0)',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 16px rgba(25, 118, 210, 0.3)'
                  },
                  '&:active': {
                    transform: 'translateY(1px)'
                  }
                }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Fade>
        </Paper>
      </Slide>
    </Box>
  );
}

export default LoginPage; 