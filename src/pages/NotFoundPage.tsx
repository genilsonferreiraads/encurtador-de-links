import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

const NotFoundPage: React.FC = () => {
  return (
    <Container maxWidth="sm" sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: { xs: 4, sm: 8 }
    }}>
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          textAlign: 'center',
          p: { xs: 3, sm: 4 },
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 4,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ 
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          bgcolor: 'primary.light',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 3,
        }}>
          <ErrorIcon sx={{ 
            fontSize: '40px',
            color: 'white',
            animation: 'pulse 2s infinite'
          }} />
        </Box>

        <Typography variant="h5" component="h1" sx={{ 
          fontWeight: 600,
          mb: 1,
          color: 'text.primary'
        }}>
          Página Não Encontrada
        </Typography>

        <Typography variant="h2" sx={{ 
          fontWeight: 700,
          color: 'primary.main',
          mb: 2,
          fontSize: { xs: '3rem', sm: '4rem' }
        }}>
          404
        </Typography>

        <Typography sx={{ 
          color: 'text.secondary',
          mb: 4,
          maxWidth: '400px',
          mx: 'auto'
        }}>
          O link que você está tentando acessar não existe ou foi removido.
        </Typography>
      </Paper>

      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.8;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </Container>
  );
}

export default NotFoundPage; 