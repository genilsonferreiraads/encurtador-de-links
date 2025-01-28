import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { TimerOff as TimerOffIcon } from '@mui/icons-material';

const ExpiredLinkPage: React.FC = () => {
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
          animation: 'float 3s ease-in-out infinite'
        }}>
          <TimerOffIcon sx={{ 
            fontSize: '40px',
            color: 'white',
            animation: 'rotate 3s ease-in-out infinite'
          }} />
        </Box>

        <Typography variant="h5" component="h1" sx={{ 
          fontWeight: 600,
          mb: 1,
          color: 'text.primary'
        }}>
          Link Expirado
        </Typography>

        <Typography variant="h2" sx={{ 
          fontWeight: 700,
          color: 'primary.main',
          mb: 2,
          fontSize: { xs: '3rem', sm: '4rem' }
        }}>
          Oops!
        </Typography>

        <Typography sx={{ 
          color: 'text.secondary',
          mb: 4,
          maxWidth: '400px',
          mx: 'auto',
          fontSize: '1.1rem'
        }}>
          Este link não está mais disponível pois atingiu sua data de expiração.
        </Typography>
      </Paper>

      <style>
        {`
          @keyframes float {
            0% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
            100% {
              transform: translateY(0px);
            }
          }
          @keyframes rotate {
            0% {
              transform: rotate(0deg);
            }
            25% {
              transform: rotate(-10deg);
            }
            75% {
              transform: rotate(10deg);
            }
            100% {
              transform: rotate(0deg);
            }
          }
        `}
      </style>
    </Container>
  );
}

export default ExpiredLinkPage; 