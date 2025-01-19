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
  ResponsiveContainer
} from 'recharts';
import {
  Info as InfoIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Launch as LaunchIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { supabase } from '../services/supabase';

interface DashboardStats {
  totalLinks: number;
  recentLinks: number;
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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [openPopupId, setOpenPopupId] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', slug: '', destination_url: '' });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Carregar todos os links
      const { data: allLinks, error: allLinksError } = await supabase
        .from('links')
        .select('id, title, slug, destination_url, created_at, updated_at, clicks');

      if (allLinksError) {
        console.error('Erro ao carregar links:', allLinksError);
        throw allLinksError;
      }

      console.log('Links carregados:', allLinks);

      // Carregar links criados nos últimos 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentLinks = allLinks?.filter(link => 
        new Date(link.created_at) >= sevenDaysAgo
      ) || [];

      // Processar dados para gráficos diários
      const dailyClicks = processDailyClicks(allLinks || []);

      // Processar dados para gráficos mensais
      const monthlyClicks = processMonthlyClicks(allLinks || []);

      // Processar dados para cliques por link
      const processedLinkClicks = processLinkClicks(allLinks || []);

      // Obter o último link modificado ou criado
      const lastModifiedLink = allLinks && allLinks.length > 0 
        ? allLinks.reduce((latest, link) => {
            const linkDate = new Date(link.updated_at || link.created_at);
            return linkDate > new Date(latest.updated_at || latest.created_at) ? link : latest;
          }, allLinks[0])
        : null;

      setStats({
        totalLinks: allLinks?.length || 0,
        recentLinks: recentLinks.length,
        dailyClicks,
        linkClicks: processedLinkClicks,
        monthlyClicks,
        lastModifiedLink
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
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
        maxWidth: '1000px',
        mx: 'auto',
        px: 3
      }}
    >
      <Typography 
        variant="h5" 
        sx={{ 
          mb: 3,
          color: '#1e293b',
          fontWeight: 600,
          textAlign: 'center'
        }}
      >
        Dashboard
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#3b82f6',
              height: '104px',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
              }
            }}
          >
            <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
              Total de Links
            </Typography>
            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>
              {stats.totalLinks}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#22c55e',
              height: '104px',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)'
              }
            }}
          >
            <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
              Links Criados (7 dias)
            </Typography>
            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>
              {stats.recentLinks}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              height: '104px',
              bgcolor: '#8b5cf6',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)'
              }
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', mb: 1 }}>
              Último Link Modificado
            </Typography>
            {stats?.lastModifiedLink ? (
              <>
                <Typography variant="body2" sx={{ 
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '80%'
                }}>
                  {stats.lastModifiedLink.title || stats.lastModifiedLink.slug || 'Sem título'}
                </Typography>
                <IconButton
                  onClick={() => setOpenPopupId(stats.lastModifiedLink.id)}
                  size="small"
                  sx={{
                    position: 'absolute',
                    right: 8,
                    bottom: 8,
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <InfoIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </>
            ) : (
              <Typography variant="body2">
                Nenhum link encontrado
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Gráficos */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.08)',
              bgcolor: '#fff',
              height: 260
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1.5, color: '#1e293b', fontWeight: 600 }}>
              Cliques por Dia
            </Typography>
            <ResponsiveContainer width="100%" height="88%">
              <BarChart data={stats.dailyClicks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickMargin={8} />
                <YAxis stroke="#64748b" fontSize={12} tickMargin={8} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid rgba(0,0,0,0.12)',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  name="Cliques" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                >
                  {stats.dailyClicks.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.08)',
              bgcolor: '#fff',
              height: 260
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1.5, color: '#1e293b', fontWeight: 600 }}>
              Evolução Mensal de Cliques
            </Typography>
            <ResponsiveContainer width="100%" height="88%">
              <LineChart data={stats.monthlyClicks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickMargin={8} />
                <YAxis stroke="#64748b" fontSize={12} tickMargin={8} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid rgba(0,0,0,0.12)',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="Cliques" 
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#22c55e' }}
                  activeDot={{ r: 6, fill: '#22c55e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.08)',
              bgcolor: '#fff',
              height: 260
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1.5, color: '#1e293b', fontWeight: 600 }}>
              Cliques por Link
            </Typography>
            <ResponsiveContainer width="100%" height="88%">
              <PieChart>
                <Pie
                  data={stats.linkClicks}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  fill="#8884d8"
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={(entry) => {
                    const name = entry.name.length > 12 
                      ? entry.name.substring(0, 12) + '...'
                      : entry.name;
                    return `${name} (${entry.value})`;
                  }}
                >
                  {stats.linkClicks.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [value, name]}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid rgba(0,0,0,0.12)',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconSize={8}
                  iconType="circle"
                  formatter={(value) => {
                    return value.length > 20 ? value.substring(0, 20) + '...' : value;
                  }}
                  wrapperStyle={{
                    paddingLeft: '20px',
                    fontSize: '0.75rem',
                    lineHeight: '1.4'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog para exibir mais informações */}
      {openPopupId && stats && (
        <Dialog
          open={true}
          onClose={() => setOpenPopupId(null)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
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
              <InfoIcon sx={{ color: '#1976d2', fontSize: 24 }} />
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
                  bgcolor: 'rgba(220, 38, 38, 0.08)'
                }
              }}
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                    sx={{ bgcolor: '#fff' }}
                  />
                ) : (
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2,
                    bgcolor: '#f8fafc',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 2
                  }}
                >
                  <Typography sx={{ color: '#1e293b', fontWeight: 500 }}>
                    {stats.lastModifiedLink.title || 'Link sem título'}
                  </Typography>
                </Paper>
                )}
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                    sx={{ bgcolor: '#fff' }}
                  />
                ) : (
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2,
                    bgcolor: '#f8fafc',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 2
                  }}
                >
                  <Typography sx={{ color: '#1e293b', fontWeight: 500 }}>
                    {stats.lastModifiedLink.slug}
                  </Typography>
                </Paper>
                )}
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                    sx={{ bgcolor: '#fff' }}
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
                      justifyContent: 'space-between'
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
                        color: '#1976d2',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': { 
                          bgcolor: 'rgba(25, 118, 210, 0.08)',
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
              </Grid>
              {!editMode && (
                <>
                  <Grid item xs={12}>
                    <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                    justifyContent: 'space-between'
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
                        color: copySuccess === getShortUrl(stats.lastModifiedLink.slug) ? '#22c55e' : '#1976d2',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': { 
                          bgcolor: 'rgba(25, 118, 210, 0.08)',
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
                        color: '#1976d2',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': { 
                          bgcolor: 'rgba(25, 118, 210, 0.08)',
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
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                        Criado em:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
                        {new Date(stats.lastModifiedLink.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                        Última atualização:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
                        {new Date(stats.lastModifiedLink.updated_at || stats.lastModifiedLink.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            {editMode ? (
              <>
                <Button
                  onClick={handleCancelEdit}
                  variant="outlined"
                  color="inherit"
                  sx={{ 
                    color: '#64748b',
                    borderColor: 'rgba(100, 116, 139, 0.5)',
                    '&:hover': {
                      borderColor: '#64748b',
                      bgcolor: 'rgba(100, 116, 139, 0.08)'
                    }
                  }}
                >
                  Cancelar
                </Button>
                <Box sx={{ flex: 1 }} />
                <Button
                  onClick={handleSaveEdit}
                  variant="contained"
                  startIcon={<EditIcon />}
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
              sx={{ 
                color: '#64748b',
                borderColor: 'rgba(100, 116, 139, 0.5)',
                '&:hover': {
                  borderColor: '#64748b',
                  bgcolor: 'rgba(100, 116, 139, 0.08)'
                }
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
              sx={{ mr: 1 }}
            >
              Excluir
            </Button>
            <Button
              onClick={() => handleEditLink(stats.lastModifiedLink.id)}
              variant="contained"
              startIcon={<EditIcon />}
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