import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { Box, AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Avatar, Menu, MenuItem } from '@mui/material';
import { Menu as MenuIcon, Link as LinkIcon, ExitToApp as LogoutIcon, Dashboard as DashboardIcon, Add as AddIcon, List as ListIcon, Person as PersonIcon } from '@mui/icons-material';
import { useSidebar } from '../contexts/SidebarContext';
import { Usuario, getCurrentUser, clearCurrentUser } from '../services/supabase';

const drawerWidth = 240;

export default function Layout() {
  const { isOpen, toggleSidebar } = useSidebar();
  const [user, setUser] = useState<Usuario | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const loadUser = async () => {
    try {
      const userData = await getCurrentUser();
      if (!userData) {
        navigate('/login');
        return;
      }
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
      navigate('/login');
    }
  };

  useEffect(() => {
    loadUser();
  }, [navigate]);

  useEffect(() => {
    if (location.pathname === '/') {
      loadUser();
    }
  }, [location.pathname]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleLogout = async () => {
    try {
      clearCurrentUser();
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Criar Link', icon: <AddIcon />, path: '/criar-link' },
    { text: 'Links Criados', icon: <ListIcon />, path: '/links' },
  ];

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: '#1976d2',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.12)'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleSidebar}
            sx={{ 
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.1)',
                bgcolor: 'rgba(255, 255, 255, 0.08)'
              },
              '&:active': {
                transform: 'scale(0.95)'
              }
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box 
            sx={{ 
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateX(-50%) scale(1.05)',
                '& .title-icon': {
                  transform: 'rotate(10deg)'
                }
              }
            }}
          >
            <LinkIcon 
              className="title-icon"
              sx={{ 
                fontSize: 28,
                transition: 'transform 0.3s ease-in-out',
              }} 
            />
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                color: '#fff', 
                fontWeight: 600,
              }}
            >
              Encurtador de Links
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            <Typography variant="body1" sx={{ color: '#fff', mr: 2 }}>
              Olá, {user?.username}
            </Typography>
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{ 
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)'
                }
              }}
            >
              <Avatar
                src={user?.avatar_url || undefined}
                alt={user?.username}
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: !user?.avatar_url ? '#0d47a1' : 'transparent',
                  '& img': {
                    objectFit: 'cover',
                    width: '100%',
                    height: '100%'
                  }
                }}
              >
                {!user?.avatar_url && user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 2
                }
              }}
            >
              <MenuItem 
                onClick={handleProfile}
                sx={{
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.08)'
                  }
                }}
              >
                <ListItemIcon>
                  <PersonIcon fontSize="small" sx={{ color: '#1976d2' }} />
                </ListItemIcon>
                <ListItemText primary="Perfil" />
              </MenuItem>
              <MenuItem 
                onClick={handleLogout}
                sx={{
                  color: '#dc2626',
                  '&:hover': {
                    bgcolor: 'rgba(220, 38, 38, 0.08)'
                  }
                }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" sx={{ color: '#dc2626' }} />
                </ListItemIcon>
                <ListItemText primary="Sair" />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(0,0,0,0.08)',
            bgcolor: '#f8fafc',
            transition: 'transform 0.3s ease-in-out',
            transform: isOpen ? 'translateX(0)' : `translateX(-${drawerWidth}px)`,
            overflowX: 'hidden',
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          },
        }}
      >
        <Toolbar />
        <Box sx={{ mt: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                component={RouterLink}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.12)',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.04)',
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  color: location.pathname === item.path ? '#1976d2' : '#64748b',
                  minWidth: 40
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    '& .MuiListItemText-primary': { 
                      color: location.pathname === item.path ? '#1976d2' : '#1e293b',
                      fontWeight: location.pathname === item.path ? 600 : 500,
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - ${drawerWidth}px)`,
          marginLeft: isOpen ? 0 : `-${drawerWidth}px`,
          transition: 'margin-left 0.3s ease-in-out',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}