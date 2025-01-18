import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
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
import { supabase } from '../services/supabase';

interface DashboardStats {
  totalLinks: number;
  recentLinks: number;
  dailyStats: Array<{
    date: string;
    count: number;
  }>;
  deviceStats: Array<{
    name: string;
    value: number;
  }>;
  monthlyStats: Array<{
    month: string;
    count: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalLinks: 0,
    recentLinks: 0,
    dailyStats: [],
    deviceStats: [],
    monthlyStats: []
  });

  useEffect(() => {
    loadStats();

    // Atualizar dados a cada 30 segundos
    const interval = setInterval(() => {
      loadStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      // Carregar todos os links
      const { data: allLinks, error: allLinksError } = await supabase
        .from('links')
        .select('id, created_at, destination_url');

      if (allLinksError) throw allLinksError;

      // Carregar todos os cliques com mais detalhes
      const { data: allClicks, error: clicksError } = await supabase
        .from('clicks')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Tentativa de carregar cliques:', {
        error: clicksError,
        data: allClicks,
        query: 'SELECT * FROM clicks ORDER BY created_at DESC'
      });

      if (clicksError) {
        console.error('Erro ao carregar cliques:', {
          code: clicksError.code,
          message: clicksError.message,
          details: clicksError.details,
          hint: clicksError.hint
        });
        throw clicksError;
      }

      console.log('Links carregados:', allLinks);
      console.log('Cliques carregados:', allClicks);

      // Carregar links criados nos últimos 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentLinks = allLinks?.filter(link => 
        new Date(link.created_at) >= sevenDaysAgo
      ) || [];

      // Processar dados para gráficos diários
      const dailyStats = processDaily(recentLinks);

      // Processar dados para gráficos mensais
      const monthlyStats = processMonthly(allLinks || []);

      // Processar dados de dispositivos
      const deviceStats = processDevices(allClicks || []);

      const stats = {
        totalLinks: allLinks?.length || 0,
        recentLinks: recentLinks.length,
        dailyStats,
        deviceStats,
        monthlyStats
      };

      console.log('Estatísticas processadas:', stats);
      setStats(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const processDaily = (links: any[]) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dailyCounts = new Array(7).fill(0);
    
    links.forEach(link => {
      const date = new Date(link.created_at);
      const dayIndex = date.getDay();
      dailyCounts[dayIndex]++;
    });

    return days.map((day, index) => ({
      date: day,
      count: dailyCounts[index]
    }));
  };

  const processMonthly = (links: any[]) => {
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    const monthlyCounts = new Array(12).fill(0);

    links.forEach(link => {
      const date = new Date(link.created_at);
      const monthIndex = date.getMonth();
      monthlyCounts[monthIndex]++;
    });

    // Retornar apenas os meses que têm dados
    return months.map((month, index) => ({
      month,
      count: monthlyCounts[index]
    })).filter(item => item.count > 0);
  };

  const processDevices = (clicks: any[]) => {
    const devices = new Map();

    // Processar todos os cliques
    clicks.forEach(click => {
      const deviceType = click.device_type || 'Desconhecido';
      devices.set(deviceType, (devices.get(deviceType) || 0) + 1);
    });

    // Se não houver dados, retornar array com zeros
    if (devices.size === 0) {
      return [
        { name: 'Mobile', value: 0 },
        { name: 'Desktop', value: 0 },
        { name: 'Tablet', value: 0 },
        { name: 'Outros', value: 0 }
      ];
    }

    // Converter e formatar os dados
    const result = Array.from(devices.entries()).map(([name, value]) => ({
      name: name === 'mobile' ? 'Mobile' :
           name === 'desktop' ? 'Desktop' :
           name === 'tablet' ? 'Tablet' : 'Outros',
      value
    }));

    console.log('Dados de dispositivos processados:', result);
    return result;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography 
        variant="h5" 
        sx={{ 
          mb: 3,
          color: '#1e293b',
          fontWeight: 600
        }}
      >
        Dashboard
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.08)',
              bgcolor: '#fff',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }
            }}
          >
            <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
              Total de Links
            </Typography>
            <Typography variant="h4" sx={{ color: '#1e293b', fontWeight: 600 }}>
              {stats.totalLinks}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.08)',
              bgcolor: '#fff',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }
            }}
          >
            <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
              Links Criados (7 dias)
            </Typography>
            <Typography variant="h4" sx={{ color: '#1e293b', fontWeight: 600 }}>
              {stats.recentLinks}
            </Typography>
          </Paper>
        </Grid>

        {/* Gráfico de Barras Vertical */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.08)',
              bgcolor: '#fff',
              height: 280
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2, color: '#1e293b', fontWeight: 600 }}>
              Links Criados por Dia
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={stats.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Links" fill="#1976d2" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gráfico de Linha */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.08)',
              bgcolor: '#fff',
              height: 280
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2, color: '#1e293b', fontWeight: 600 }}>
              Evolução Mensal
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={stats.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="Links" 
                  stroke="#1976d2" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gráfico de Rosca */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.08)',
              bgcolor: '#fff',
              height: 280
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2, color: '#1e293b', fontWeight: 600 }}>
              Cliques por Dispositivo
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={stats.deviceStats}
                layout="vertical"
                margin={{ top: 0, right: 0, bottom: 0, left: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} />
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  width={80}
                />
                <Tooltip />
                <Bar 
                  dataKey="value" 
                  name="Quantidade" 
                  fill="#1976d2"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gráfico de Barras Horizontal */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.08)',
              bgcolor: '#fff',
              height: 280
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2, color: '#1e293b', fontWeight: 600 }}>
              Distribuição de Cliques por Dispositivo
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={stats.deviceStats}
                layout="vertical"
                margin={{ top: 0, right: 0, bottom: 0, left: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} />
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  width={80}
                />
                <Tooltip />
                <Bar 
                  dataKey="value" 
                  name="Cliques" 
                  fill="#1976d2"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 