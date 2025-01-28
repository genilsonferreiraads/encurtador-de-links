import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Snackbar,
  Alert,
  Fade,
  Zoom,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector
} from 'recharts';
import {
  Info as InfoIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Launch as LaunchIcon,
  ContentCopy as ContentCopyIcon,
  Timer as TimeIcon,
  Title as TitleIcon,
  Link as LinkIcon,
  InsertLink as InsertLinkIcon,
  AccessTime as AccessTimeIcon,
  FlashOn as FlashOnIcon,
  Timer as TimerIcon,
  QrCode as QrCodeIcon,
  TrendingUp as TrendingUpIcon,
  Mouse as MouseIcon,
} from '@mui/icons-material';
import { supabase, getCurrentUser } from '../services/supabase';

interface DashboardStats {
  totalLinks: number;
  recentLinks: number;
  totalClicks: number;
  dailyClicks: Array<{
    date: string;
    count: number;
  }>;
  linkClicks: Array<{
    name: string;
    value: number;
  }>;
  monthlyClicks: Array<{
    month: string;
    count: number;
  }>;
  lastModifiedLink: any;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

interface ActiveShapeProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  value: number;
  name: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [openPopupId, setOpenPopupId] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', slug: '', destination_url: '' });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Carregar todos os links
      const { data: allLinks, error: allLinksError } = await supabase
        .from('links')
        .select('id, title, slug, destination_url, created_at, updated_at, clicks')
        .eq('user_id', user.id);

      if (allLinksError) {
        console.error('Erro ao carregar links:', allLinksError);
        throw allLinksError;
      }

      if (!allLinks) {
        setStats({
          totalLinks: 0,
          recentLinks: 0,
          totalClicks: 0,
          dailyClicks: [],
          monthlyClicks: [],
          linkClicks: [],
          lastModifiedLink: null
        });
        return;
      }

      console.log('Links carregados:', allLinks);

      // Carregar links criados nos últimos 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentLinks = allLinks.filter(link => 
        new Date(link.created_at) >= sevenDaysAgo
      );

      // Processar dados para gráficos diários
      const dailyClicks = processDailyClicks(allLinks);

      // Processar dados para gráficos mensais
      const monthlyClicks = processMonthlyClicks(allLinks);

      // Processar dados para cliques por link
      const processedLinkClicks = processLinkClicks(allLinks);

      // Obter o último link modificado ou criado
      const lastModifiedLink = allLinks.length > 0 
        ? allLinks.reduce((latest, link) => {
            const linkDate = new Date(link.updated_at || link.created_at);
            return linkDate > new Date(latest.updated_at || latest.created_at) ? link : latest;
          }, allLinks[0])
        : null;

      setStats({
        totalLinks: allLinks.length,
        recentLinks: recentLinks.length,
        totalClicks: allLinks.reduce((sum, link) => sum + (link.clicks || 0), 0),
        dailyClicks,
        monthlyClicks,
        linkClicks: processedLinkClicks,
        lastModifiedLink
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const processDailyClicks = (links: any[]) => {
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const dailyCounts = new Array(31).fill(0);
    
    links.forEach(link => {
      const date = new Date(link.created_at);
      const dayIndex = date.getDate() - 1;
      dailyCounts[dayIndex] += link.clicks || 0;
    });

    return days.map((day, index) => ({
      date: day.toString(),
      count: dailyCounts[index]
    }));
  };

  const processMonthlyClicks = (links: any[]) => {
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    const monthlyCounts = new Array(12).fill(0);

    links.forEach(link => {
      const date = new Date(link.created_at);
      const monthIndex = date.getMonth();
      monthlyCounts[monthIndex] += link.clicks || 0;
    });

    return months.map((month, index) => ({
      month,
      count: monthlyCounts[index]
    })).filter(item => item.count > 0);
  };

  const processLinkClicks = (links: any[]) => {
    return links.map(link => ({
      name: link.title || link.slug,
      value: link.clicks || 0
    }));
  };

  const handleCopyLink = async (shortUrl: string) => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopySuccess(shortUrl);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar link:', err);
    }
  };

  const getShortUrl = (slug: string) => {
    return `${window.location.origin}/${slug}`;
  };

  const handleEditLink = (id: number) => {
    if (!stats?.lastModifiedLink) return;
    
    setEditForm({
      title: stats.lastModifiedLink.title || '',
      slug: stats.lastModifiedLink.slug || '',
      destination_url: stats.lastModifiedLink.destination_url || ''
    });
    setEditMode(true);
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase
        .from('links')
        .update({
          title: editForm.title,
          slug: editForm.slug,
          destination_url: editForm.destination_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', stats?.lastModifiedLink.id);

      if (error) throw error;

      setEditMode(false);
      loadStats();
      showNotification('Link atualizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar link:', error);
      showNotification('Erro ao atualizar link. Tente novamente.', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditForm({ title: '', slug: '', destination_url: '' });
  };

  const handleDeleteLink = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este link?')) {
      try {
        const { error } = await supabase
          .from('links')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setOpenPopupId(null);
        loadStats();
        showNotification('Link excluído com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao excluir link:', error);
        showNotification('Erro ao excluir link. Tente novamente.', 'error');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography variant="h6" color="error">
          Erro ao carregar dados do dashboard.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: '1200px',
        mx: 'auto',
        px: { xs: 1, sm: 3 },
        py: { xs: 2, sm: 4 },
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)'
      }}
    >
      <Fade in timeout={800}>
        <Box>
      <Typography 
        variant="h5" 
        sx={{ 
              mb: { xs: 2, sm: 4 },
          color: '#1e293b',
              fontWeight: 700,
              textAlign: 'center',
              letterSpacing: '-0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}
          >
            <InfoIcon sx={{ color: '#3b82f6', fontSize: 28 }} />
            Painel de Controle
      </Typography>

          <Grid container spacing={{ xs: 1.5, sm: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
              <Zoom in timeout={400}>
          <Paper
            elevation={0}
            sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 4,
              bgcolor: '#3b82f6',
                    height: '100%',
                    minHeight: { xs: '120px', sm: '140px' },
                    transition: 'all 0.3s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
              '&:hover': {
                      transform: { xs: 'none', sm: 'translateY(-4px)' },
                      boxShadow: '0 12px 24px rgba(59, 130, 246, 0.15)'
              }
            }}
          >
                  <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 2, fontWeight: 500 }}>
              Total de Links
            </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                    <Typography variant="h3" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1, fontSize: { xs: '2rem', sm: '2.5rem' } }}>
              {stats.totalLinks}
            </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
                      links
                    </Typography>
                  </Box>
          </Paper>
              </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
              <Zoom in timeout={600}>
          <Paper
            elevation={0}
            sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 4,
              bgcolor: '#22c55e',
                    height: '100%',
                    minHeight: { xs: '120px', sm: '140px' },
                    transition: 'all 0.3s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
              '&:hover': {
                      transform: { xs: 'none', sm: 'translateY(-4px)' },
                      boxShadow: '0 12px 24px rgba(34, 197, 94, 0.15)'
              }
            }}
          >
                  <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 2, fontWeight: 500 }}>
                    Links Recentes
            </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                    <Typography variant="h3" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1, fontSize: { xs: '2rem', sm: '2.5rem' } }}>
              {stats.recentLinks}
            </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
                      últimos 7 dias
                    </Typography>
                  </Box>
          </Paper>
              </Zoom>
        </Grid>

        <Grid item xs={12} md={4}>
              <Zoom in timeout={800}>
          <Paper
            elevation={0}
            sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 4,
              bgcolor: '#8b5cf6',
                    height: '100%',
                    minHeight: { xs: '120px', sm: '140px' },
                    transition: 'all 0.3s ease-in-out',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              '&:hover': {
                      transform: { xs: 'none', sm: 'translateY(-4px)' },
                      boxShadow: '0 12px 24px rgba(139, 92, 246, 0.15)'
              }
            }}
          >
                  <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 2, fontWeight: 500 }}>
                    Último Link
            </Typography>
            {stats?.lastModifiedLink ? (
              <>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography 
                          sx={{ 
                            color: '#fff',
                            fontWeight: 500,
                            fontSize: { xs: '0.9rem', sm: '1.1rem' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '80%'
                          }}
                        >
                  {stats.lastModifiedLink.title || stats.lastModifiedLink.slug || 'Sem título'}
                </Typography>
                <IconButton
                  onClick={() => setOpenPopupId(stats.lastModifiedLink.id)}
                  size="small"
                  sx={{
                    color: 'white',
                    '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.1)',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <InfoIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                </IconButton>
                      </Box>
              </>
            ) : (
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Nenhum link encontrado
              </Typography>
            )}
          </Paper>
              </Zoom>
        </Grid>

        {/* Gráficos */}
        <Grid item xs={12} md={6}>
              <Fade in timeout={1000}>
          <Paper
            elevation={0}
            sx={{
                    p: 3,
                    borderRadius: 4,
              border: '1px solid rgba(0,0,0,0.08)',
              bgcolor: '#fff',
                    height: '100%',
                    minHeight: 400,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                      borderColor: 'rgba(59, 130, 246, 0.2)'
                    }
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 3, 
                      color: '#1e293b', 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <TimeIcon sx={{ color: '#3b82f6', fontSize: 24 }} />
              Cliques por Dia
            </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.dailyClicks} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#64748b" 
                          fontSize={12} 
                          tickMargin={8}
                          axisLine={{ stroke: '#e2e8f0' }}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={12} 
                          tickMargin={8}
                          axisLine={{ stroke: '#e2e8f0' }}
                        />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  name="Cliques" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                >
                  {stats.dailyClicks.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                              fillOpacity={0.9}
                            />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
                  </Box>
          </Paper>
              </Fade>
        </Grid>

        <Grid item xs={12} md={6}>
              <Fade in timeout={1200}>
          <Paper
            elevation={0}
            sx={{
                    p: 3,
                    borderRadius: 4,
              border: '1px solid rgba(0,0,0,0.08)',
              bgcolor: '#fff',
                    height: '100%',
                    minHeight: 400,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                      borderColor: 'rgba(34, 197, 94, 0.2)'
                    }
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 3, 
                      color: '#1e293b', 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <TimeIcon sx={{ color: '#22c55e', fontSize: 24 }} />
                    Evolução Mensal
            </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.monthlyClicks} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#64748b" 
                          fontSize={12} 
                          tickMargin={8}
                          axisLine={{ stroke: '#e2e8f0' }}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={12} 
                          tickMargin={8}
                          axisLine={{ stroke: '#e2e8f0' }}
                        />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="Cliques" 
                  stroke="#22c55e"
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
                  </Box>
          </Paper>
              </Fade>
        </Grid>

            <Grid item xs={12}>
              <Fade in timeout={1400}>
          <Paper
            elevation={0}
            sx={{
                    p: 3,
                    borderRadius: 4,
              border: '1px solid rgba(0,0,0,0.08)',
              bgcolor: '#fff',
                    height: '100%',
                    minHeight: 400,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                      borderColor: 'rgba(139, 92, 246, 0.2)'
                    }
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 3, 
                      color: '#1e293b', 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <TrendingUpIcon sx={{ color: '#8b5cf6', fontSize: 24 }} />
                    Top Links Mais Clicados
            </Typography>
                  <Box sx={{ height: 400, overflow: 'hidden' }}>
                    {stats.linkClicks
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 5)
                      .map((link, index) => (
                        <Box
                          key={index}
                          sx={{
                            mb: 3,
                            p: 2,
                            bgcolor: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: 2,
                            border: '1px solid rgba(0,0,0,0.08)',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                              bgcolor: 'white',
                              borderColor: '#8b5cf6'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box 
                              sx={{ 
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                bgcolor: 'rgba(139, 92, 246, 0.1)',
                                color: '#8b5cf6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                mr: 2
                              }}
                            >
                              #{index + 1}
                            </Box>
                            <Typography 
                              sx={{ 
                                color: '#1e293b',
                                fontWeight: 600,
                                fontSize: '1rem',
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {link.name}
                            </Typography>
                            <Typography 
                              sx={{ 
                                color: '#8b5cf6',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                ml: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              <MouseIcon sx={{ fontSize: 16 }} />
                              {link.value} cliques
                            </Typography>
                          </Box>
                          <Box sx={{ position: 'relative', height: 6, bgcolor: 'rgba(139, 92, 246, 0.1)', borderRadius: 3 }}>
                            <Box 
                              sx={{ 
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%',
                                bgcolor: '#8b5cf6',
                                borderRadius: 3,
                                width: `${(link.value / Math.max(...stats.linkClicks.map(l => l.value))) * 100}%`,
                                transition: 'width 1s ease-in-out'
                              }}
                            />
                          </Box>
                        </Box>
                    ))}
                  </Box>
          </Paper>
              </Fade>
        </Grid>
      </Grid>
        </Box>
      </Fade>

      {/* Dialog para exibir mais informações */}
      {openPopupId && stats && (
        <Dialog
          open={true}
          onClose={() => setOpenPopupId(null)}
          maxWidth="sm"
          fullWidth
          TransitionComponent={Fade}
          transitionDuration={400}
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle 
            sx={{ 
              p: 3,
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(0,0,0,0.08)',
              bgcolor: '#f8fafc'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <InfoIcon sx={{ color: '#3b82f6', fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                Detalhes do Link
              </Typography>
            </Box>
            <IconButton
              onClick={() => setOpenPopupId(null)}
              size="small"
              sx={{ 
                color: '#64748b',
                '&:hover': { 
                  color: '#dc2626',
                  bgcolor: 'rgba(220, 38, 38, 0.08)',
                  transform: 'rotate(90deg)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Zoom in timeout={400}>
                  <Box>
                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TitleIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Título
                  </Typography>
                </Box>
                {editMode ? (
                  <TextField
                    fullWidth
                    size="small"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        sx={{ 
                          bgcolor: '#fff',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: '#3b82f6',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#3b82f6',
                            }
                          }
                        }}
                  />
                ) : (
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2,
                    bgcolor: '#f8fafc',
                    border: '1px solid rgba(0,0,0,0.08)',
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: '#f1f5f9',
                            borderColor: 'rgba(59, 130, 246, 0.2)'
                          }
                  }}
                >
                  <Typography sx={{ color: '#1e293b', fontWeight: 500 }}>
                    {stats.lastModifiedLink.title || 'Link sem título'}
                  </Typography>
                </Paper>
                )}
                  </Box>
                </Zoom>
              </Grid>

              <Grid item xs={12}>
                <Zoom in timeout={600}>
                  <Box>
                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinkIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Slug
                  </Typography>
                </Box>
                {editMode ? (
                  <TextField
                    fullWidth
                    size="small"
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                        sx={{ 
                          bgcolor: '#fff',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: '#3b82f6',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#3b82f6',
                            }
                          }
                        }}
                  />
                ) : (
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2,
                    bgcolor: '#f8fafc',
                    border: '1px solid rgba(0,0,0,0.08)',
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: '#f1f5f9',
                            borderColor: 'rgba(59, 130, 246, 0.2)'
                          }
                  }}
                >
                  <Typography sx={{ color: '#1e293b', fontWeight: 500 }}>
                    {stats.lastModifiedLink.slug}
                  </Typography>
                </Paper>
                )}
                  </Box>
                </Zoom>
              </Grid>

              <Grid item xs={12}>
                <Zoom in timeout={800}>
                  <Box>
                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InsertLinkIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600 }}>
                    URL de Destino
                  </Typography>
                </Box>
                {editMode ? (
                  <TextField
                    fullWidth
                    size="small"
                    value={editForm.destination_url}
                    onChange={(e) => setEditForm({ ...editForm, destination_url: e.target.value })}
                        sx={{ 
                          bgcolor: '#fff',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: '#3b82f6',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#3b82f6',
                            }
                          }
                        }}
                  />
                ) : (
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2,
                      bgcolor: '#f8fafc',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: '#f1f5f9',
                            borderColor: 'rgba(59, 130, 246, 0.2)'
                          }
                    }}
                  >
                    <Typography sx={{ color: '#1e293b', fontWeight: 500, wordBreak: 'break-all', flex: 1 }}>
                      {stats.lastModifiedLink.destination_url}
                    </Typography>
                    <IconButton 
                      size="small"
                      href={stats.lastModifiedLink.destination_url}
                      target="_blank"
                      sx={{ 
                        ml: 2,
                            color: '#3b82f6',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': { 
                              bgcolor: 'rgba(59, 130, 246, 0.08)',
                          transform: 'scale(1.15) rotate(8deg)',
                        },
                        '&:active': {
                          transform: 'scale(0.95) rotate(0deg)',
                        }
                      }}
                    >
                      <LaunchIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Paper>
                )}
                  </Box>
                </Zoom>
              </Grid>

              {!editMode && (
                <>
                  <Grid item xs={12}>
                    <Zoom in timeout={1000}>
                      <Box>
                    <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <QrCodeIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600 }}>
                        Link Encurtado
                  </Typography>
                </Box>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2,
                    bgcolor: '#f8fafc',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: '#f1f5f9',
                              borderColor: 'rgba(59, 130, 246, 0.2)'
                            }
                  }}
                >
                  <Typography sx={{ color: '#1e293b', fontWeight: 500, wordBreak: 'break-all', flex: 1 }}>
                    {getShortUrl(stats.lastModifiedLink.slug)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                    <IconButton 
                      size="small"
                      onClick={() => handleCopyLink(getShortUrl(stats.lastModifiedLink.slug))}
                      sx={{ 
                                color: copySuccess === getShortUrl(stats.lastModifiedLink.slug) ? '#22c55e' : '#3b82f6',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': { 
                                  bgcolor: 'rgba(59, 130, 246, 0.08)',
                          transform: 'scale(1.15) rotate(8deg)',
                        },
                        '&:active': {
                          transform: 'scale(0.95) rotate(0deg)',
                        }
                      }}
                    >
                      <ContentCopyIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      href={getShortUrl(stats.lastModifiedLink.slug)}
                      target="_blank"
                      sx={{ 
                                color: '#3b82f6',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': { 
                                  bgcolor: 'rgba(59, 130, 246, 0.08)',
                          transform: 'scale(1.15) rotate(8deg)',
                        },
                        '&:active': {
                          transform: 'scale(0.95) rotate(0deg)',
                        }
                      }}
                    >
                      <LaunchIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Paper>
                      </Box>
                    </Zoom>
              </Grid>

              <Grid item xs={12}>
                    <Zoom in timeout={1200}>
                      <Box>
                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTimeIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Informações Adicionais
                  </Typography>
                </Box>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2,
                    bgcolor: '#f8fafc',
                    border: '1px solid rgba(0,0,0,0.08)',
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: '#f1f5f9',
                              borderColor: 'rgba(59, 130, 246, 0.2)'
                            }
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FlashOnIcon sx={{ fontSize: 16 }} />
                        Criado em:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
                        {new Date(stats.lastModifiedLink.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TimerIcon sx={{ fontSize: 16 }} />
                        Última atualização:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
                        {new Date(stats.lastModifiedLink.updated_at || stats.lastModifiedLink.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
                      </Box>
                    </Zoom>
              </Grid>
                </>
              )}
            </Grid>
          </DialogContent>

          <DialogActions 
            sx={{ 
              p: 3, 
              pt: 2, 
              borderTop: '1px solid rgba(0,0,0,0.08)',
              bgcolor: '#f8fafc'
            }}
          >
            {editMode ? (
              <>
                <Button
                  onClick={handleCancelEdit}
                  variant="outlined"
                  color="inherit"
                  startIcon={<CloseIcon />}
                  sx={{ 
                    color: '#64748b',
                    borderColor: 'rgba(100, 116, 139, 0.5)',
                    '&:hover': {
                      borderColor: '#64748b',
                      bgcolor: 'rgba(100, 116, 139, 0.08)',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Cancelar
                </Button>
                <Box sx={{ flex: 1 }} />
                <Button
                  onClick={handleSaveEdit}
                  variant="contained"
                  startIcon={<EditIcon />}
                  sx={{
                    bgcolor: '#3b82f6',
                    '&:hover': {
                      bgcolor: '#2563eb',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Salvar
                </Button>
              </>
            ) : (
              <>
            <Button
              onClick={() => setOpenPopupId(null)}
              variant="outlined"
              color="inherit"
                  startIcon={<CloseIcon />}
              sx={{ 
                color: '#64748b',
                borderColor: 'rgba(100, 116, 139, 0.5)',
                '&:hover': {
                  borderColor: '#64748b',
                      bgcolor: 'rgba(100, 116, 139, 0.08)',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease'
              }}
            >
              Fechar
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              onClick={() => handleDeleteLink(stats.lastModifiedLink.id)}
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
                  sx={{ 
                    mr: 1,
                    '&:hover': {
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
            >
              Excluir
            </Button>
            <Button
              onClick={() => handleEditLink(stats.lastModifiedLink.id)}
              variant="contained"
              startIcon={<EditIcon />}
                  sx={{
                    bgcolor: '#3b82f6',
                    '&:hover': {
                      bgcolor: '#2563eb',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
            >
              Editar
            </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      )}

      {notification && (
        <Snackbar
          open={true}
          autoHideDuration={3000}
          onClose={() => setNotification(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: 8, mr: 3 }}
        >
          <Alert
            severity={notification.type}
            sx={{
              minWidth: '260px',
              color: '#fff',
              bgcolor: notification.type === 'success' ? '#1976d2' : '#dc2626',
              '& .MuiAlert-icon': {
                color: '#fff',
                fontSize: 20,
                pt: '2px'
              },
              '& .MuiAlert-message': {
                fontSize: '0.875rem',
                py: 0.5
              },
              '& .MuiAlert-action': {
                pt: 0,
                pr: 1,
                color: '#fff'
              }
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
} 