import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { Box, AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Avatar, Menu, MenuItem, Collapse, useTheme, useMediaQuery } from '@mui/material';
import { Link as LinkIcon, ExitToApp as LogoutIcon, Dashboard as DashboardIcon, Add as AddIcon, List as ListIcon, Person as PersonIcon, People as PeopleIcon, Settings as SettingsIcon, ExpandLess, ExpandMore, Edit as EditIcon } from '@mui/icons-material';
import MenuIcon from './MenuIcon';
import { useSidebar } from '../contexts/SidebarContext';
import { Usuario, getCurrentUser, clearCurrentUser } from '../services/supabase';

const drawerWidth = 240;

export default function Layout() {
  const { isOpen, toggleSidebar } = useSidebar();
  const [user, setUser] = useState<Usuario | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  const handleSettingsClick = () => {
    setSettingsOpen(!settingsOpen);
  };

  const mainMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Criar Link', icon: <AddIcon />, path: '/criar-link' },
    { text: 'Links Criados', icon: <ListIcon />, path: '/links' },
  ];

  const settingsMenuItems = user?.role === 'admin' ? [
    { text: 'Gerenciar Usuários', icon: <PeopleIcon />, path: '/usuarios' }
  ] : [];

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
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
              width: { xs: 40, sm: 44 },
              height: { xs: 40, sm: 44 },
              borderRadius: '12px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.05)',
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              },
              '&:active': {
                transform: 'scale(0.95)',
                bgcolor: 'rgba(255, 255, 255, 0.15)'
              }
            }}
          >
            <MenuIcon sx={{ 
              fontSize: { xs: 24, sm: 26 },
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
            }} />
          </IconButton>

          <Box 
            sx={{ 
              position: { xs: 'static', sm: 'absolute' },
              left: '50%',
              transform: { xs: 'none', sm: 'translateX(-50%)' },
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: { xs: 'none', sm: 'translateX(-50%) scale(1.05)' },
                '& .title-icon': {
                  transform: 'rotate(10deg)'
                }
              }
            }}
          >
            <LinkIcon 
              className="title-icon"
              sx={{ 
                fontSize: { xs: 24, sm: 28 },
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
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              Encurtador de Links
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', ml: { xs: 2, sm: 'auto' } }}>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#fff', 
                mr: 2,
                display: { xs: 'none', sm: 'block' }
              }}
            >
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
                  width: { xs: 36, sm: 40 }, 
                  height: { xs: 36, sm: 40 }, 
                  bgcolor: !user?.avatar_url ? '#0d47a1' : 'transparent',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  position: 'relative',
                  overflow: 'hidden',
                  '& .MuiAvatar-img': {
                    objectFit: 'cover',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0
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
                elevation: 0,
                sx: {
                  mt: 1.5,
                  minWidth: { xs: 200, sm: 220 },
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                  borderRadius: '12px',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ 
                p: 2, 
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}>
                <Avatar
                  src={user?.avatar_url || undefined}
                  sx={{ 
                    width: 48,
                    height: 48,
                    bgcolor: !user?.avatar_url ? '#1976d2' : 'transparent',
                    border: '2px solid #fff',
                    boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.12)'
                  }}
                >
                  {!user?.avatar_url && user?.username?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography sx={{ 
                    fontWeight: 600,
                    color: '#1e293b',
                    fontSize: '0.9375rem',
                    lineHeight: 1.2
                  }}>
                    {user?.full_name || user?.username}
                  </Typography>
                  <Typography sx={{ 
                    color: '#64748b',
                    fontSize: '0.75rem',
                    mt: 0.5
                  }}>
                    @{user?.username}
                  </Typography>
                </Box>
              </Box>

              <MenuItem 
                onClick={handleProfile}
                sx={{
                  py: 1.5,
                  px: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.04)',
                    '& .MuiListItemIcon-root': {
                      color: '#1976d2',
                      transform: 'scale(1.1)',
                    }
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <ListItemIcon sx={{ 
                  color: '#64748b',
                  minWidth: 'auto',
                  transition: 'all 0.2s ease-in-out'
                }}>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <Typography sx={{ 
                  color: '#1e293b',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}>
                  Editar Perfil
                </Typography>
              </MenuItem>

              <MenuItem 
                onClick={handleLogout}
                sx={{
                  py: 1.5,
                  px: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(220, 38, 38, 0.04)',
                    '& .MuiListItemIcon-root': {
                      color: '#dc2626',
                      transform: 'scale(1.1)',
                    }
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <ListItemIcon sx={{ 
                  color: '#64748b',
                  minWidth: 'auto',
                  transition: 'all 0.2s ease-in-out'
                }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <Typography sx={{ 
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}>
                  Sair
                </Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={isOpen}
        onClose={toggleSidebar}
        sx={{
          width: isOpen ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: { xs: 'none', sm: '1px solid rgba(0,0,0,0.08)' },
            bgcolor: { xs: '#ffffff', sm: '#f8fafc' },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            visibility: isOpen ? 'visible' : 'hidden',
            overflowX: 'hidden',
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            [theme.breakpoints.down('sm')]: {
              width: '85%',
              maxWidth: 280,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }
          },
        }}
      >
        <Toolbar />
        <Box sx={{ 
          mt: { xs: 1, sm: 2 },
          px: { xs: 1.5, sm: 2 }
        }}>
          <List>
            {mainMenuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                component={RouterLink}
                to={item.path}
                onClick={() => isMobile && toggleSidebar()}
                selected={location.pathname === item.path}
                sx={{
                  mb: 0.5,
                  borderRadius: '10px',
                  height: { xs: 56, sm: 48 },
                  '&.Mui-selected': {
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    '& .MuiListItemIcon-root': {
                      color: '#1976d2',
                      transform: 'scale(1.1)',
                    },
                    '& .MuiListItemText-primary': {
                      color: '#1976d2',
                      fontWeight: 600,
                    },
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.12)',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.04)',
                    '& .MuiListItemIcon-root': {
                      transform: 'scale(1.1)',
                    }
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <ListItemIcon sx={{ 
                  color: '#64748b',
                  minWidth: { xs: 40, sm: 44 },
                  transition: 'all 0.2s ease-in-out',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    ml: 1,
                    '& .MuiListItemText-primary': { 
                      color: '#1e293b',
                      fontWeight: 500,
                      fontSize: { xs: '0.9375rem', sm: '0.875rem' },
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                />
              </ListItem>
            ))}

            {settingsMenuItems.length > 0 && (
              <>
                <ListItem
                  button
                  onClick={handleSettingsClick}
                  sx={{
                    mt: 1,
                    mb: 0.5,
                    borderRadius: '10px',
                    height: { xs: 56, sm: 48 },
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.04)',
                      '& .MuiListItemIcon-root': {
                        transform: 'scale(1.1)',
                      }
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: '#64748b',
                    minWidth: { xs: 40, sm: 44 },
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Configurações" 
                    sx={{ 
                      ml: 1,
                      '& .MuiListItemText-primary': { 
                        color: '#1e293b',
                        fontWeight: 500,
                        fontSize: { xs: '0.9375rem', sm: '0.875rem' },
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}
                  />
                  {settingsOpen ? (
                    <ExpandLess sx={{ color: '#64748b', transition: 'transform 0.3s ease-in-out', transform: 'rotate(180deg)' }} />
                  ) : (
                    <ExpandMore sx={{ color: '#64748b', transition: 'transform 0.3s ease-in-out' }} />
                  )}
                </ListItem>
                <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {settingsMenuItems.map((item) => (
                      <ListItem
                        button
                        key={item.text}
                        component={RouterLink}
                        to={item.path}
                        onClick={() => isMobile && toggleSidebar()}
                        selected={location.pathname === item.path}
                        sx={{
                          pl: { xs: 5, sm: 6 },
                          mb: 0.5,
                          borderRadius: '10px',
                          height: { xs: 56, sm: 48 },
                          '&.Mui-selected': {
                            bgcolor: 'rgba(25, 118, 210, 0.08)',
                            '& .MuiListItemIcon-root': {
                              color: '#1976d2',
                              transform: 'scale(1.1)',
                            },
                            '& .MuiListItemText-primary': {
                              color: '#1976d2',
                              fontWeight: 600,
                            },
                            '&:hover': {
                              bgcolor: 'rgba(25, 118, 210, 0.12)',
                            },
                          },
                          '&:hover': {
                            bgcolor: 'rgba(25, 118, 210, 0.04)',
                            '& .MuiListItemIcon-root': {
                              transform: 'scale(1.1)',
                            }
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        <ListItemIcon sx={{ 
                          color: '#64748b',
                          minWidth: { xs: 40, sm: 44 },
                          transition: 'all 0.2s ease-in-out',
                          display: 'flex',
                          justifyContent: 'center'
                        }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.text} 
                          sx={{ 
                            ml: 1,
                            '& .MuiListItemText-primary': { 
                              color: '#1e293b',
                              fontWeight: 500,
                              fontSize: { xs: '0.9375rem', sm: '0.875rem' },
                              transition: 'all 0.2s ease-in-out'
                            }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            )}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: '100%',
          marginLeft: { 
            xs: 0, 
            sm: isOpen ? `${drawerWidth}px` : 0 
          },
          transition: 'all 0.3s ease-in-out',
          maxWidth: { 
            xs: '100%',
            sm: isOpen ? `calc(100% - ${drawerWidth}px)` : '100%'
          },
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          [theme.breakpoints.down('sm')]: {
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          },
          [theme.breakpoints.up('sm')]: {
            '&::-webkit-scrollbar': {
              width: '12px',
              background: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#1976d2',
              borderRadius: '6px',
              border: '3px solid #ffffff',
              minHeight: '50px',
              '&:hover': {
                background: '#1565c0'
              }
            },
            '&::-webkit-scrollbar-track': {
              background: '#ffffff',
              borderRadius: '6px'
            },
            scrollbarWidth: 'thin',
            scrollbarColor: '#1976d2 #ffffff'
          }
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}