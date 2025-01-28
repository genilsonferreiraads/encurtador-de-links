import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  IconButton,
  List,
  ListItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Avatar,
  Input,
  InputAdornment,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  ContentCopy,
  Instagram,
  Facebook,
  Twitter,
  LinkedIn,
  YouTube,
  Language,
  Link as LinkIcon,
  PhotoCamera,
  WhatsApp,
  Telegram,
  GitHub,
  Reddit,
  Pinterest,
  Email,
  Phone,
  Store,
  LocationOn,
  CalendarMonth,
  PlayArrow,
  Newspaper,
  Storefront,
  Payments,
  Message,
  Public,
  Code,
  Apartment,
  MenuBook,
  School,
  CameraAlt,
  Videocam,
  Add,
  Edit,
  Delete,
  VerifiedRounded,
  Save,
  Title,
  Person as PersonIcon,
  AddCircle as AddLink,
  Close,
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { SiTiktok, SiX, SiThreads, SiSpotify, SiDiscord, SiTwitch, SiSnapchat, SiMedium, SiBuymeacoffee, SiSubstack, SiPatreon, SiKofi } from 'react-icons/si';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../services/supabase';
import { getCurrentUser } from '../services/supabase';
import { alpha, useTheme } from '@mui/material/styles';

interface BioLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  sort_order: number;
}

const AVAILABLE_ICONS = {
  instagram: <Instagram />,
  facebook: <Facebook />,
  twitter: <Twitter />,
  x: <SiX style={{ fontSize: '1.1em' }} />,
  linkedin: <LinkedIn />,
  youtube: <YouTube />,
  tiktok: <SiTiktok style={{ fontSize: '1.1em' }} />,
  threads: <SiThreads style={{ fontSize: '1.1em' }} />,
  snapchat: <SiSnapchat style={{ fontSize: '1.1em' }} />,
  whatsapp: <WhatsApp />,
  telegram: <Telegram />,
  github: <GitHub />,
  reddit: <Reddit />,
  pinterest: <Pinterest />,
  spotify: <SiSpotify style={{ fontSize: '1.1em' }} />,
  discord: <SiDiscord style={{ fontSize: '1.1em' }} />,
  twitch: <SiTwitch style={{ fontSize: '1.1em' }} />,
  medium: <SiMedium style={{ fontSize: '1.1em' }} />,
  buymeacoffee: <SiBuymeacoffee style={{ fontSize: '1.1em' }} />,
  substack: <SiSubstack style={{ fontSize: '1.1em' }} />,
  patreon: <SiPatreon style={{ fontSize: '1.1em' }} />,
  kofi: <SiKofi style={{ fontSize: '1.1em' }} />,
  email: <Email />,
  phone: <Phone />,
  store: <Store />,
  location: <LocationOn />,
  calendar: <CalendarMonth />,
  play: <PlayArrow />,
  news: <Newspaper />,
  shop: <Storefront />,
  payment: <Payments />,
  chat: <Message />,
  website: <Language />,
  globe: <Public />,
  code: <Code />,
  company: <Apartment />,
  blog: <MenuBook />,
  education: <School />,
  photo: <CameraAlt />,
  video: <Videocam />,
  link: <LinkIcon />
};

const BioLinksPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [links, setLinks] = useState<BioLink[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<BioLink | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('link');
  const [publicUrl, setPublicUrl] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [bioName, setBioName] = useState('');
  const [bioAvatar, setBioAvatar] = useState<File | null>(null);
  const [bioAvatarUrl, setBioAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [bioSlug, setBioSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const [bioLinkId, setBioLinkId] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    loadUserAndLinks();
  }, []);

  const loadUserAndLinks = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData) {
          console.error('Usuário não encontrado na autenticação');
          setLoading(false);
          return;
        }

        const { data: dbUser, error: userError } = await supabase
          .from('usuarios')
        .select('id, email, bio_name, bio_avatar_url')
        .eq('email', userData.email)
          .single();

        if (userError) {
          console.error('Erro ao carregar usuário do banco:', userError);
          setLoading(false);
          return;
        }

        if (!dbUser) {
          const { data: newUser, error: insertError } = await supabase
            .from('usuarios')
            .insert([{
              auth_user_id: userData.id,
            email: userData.email
            }])
            .select()
            .single();

          if (insertError) {
            console.error('Erro ao criar usuário:', insertError);
            setLoading(false);
            return;
          }

          setUser(newUser);
          await loadLinks(newUser.id);
        await loadBioLink(newUser.id);
        } else {
          setUser(dbUser);
        setBioName(dbUser.bio_name || '');
        setBioAvatarUrl(dbUser.bio_avatar_url);
          await loadLinks(dbUser.id);
        await loadBioLink(dbUser.id);
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      } finally {
        setLoading(false);
      }
    };

  const loadLinks = async (userId: string) => {
    const { data: bioLinks, error } = await supabase
      .from('bio_links')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order');

    if (error) {
      showSnackbar('Erro ao carregar links', 'error');
      console.error('Erro ao carregar:', error);
    } else {
      setLinks(bioLinks || []);
    }
  };

  const loadBioLink = async (userId: string) => {
    const { data: bioLink, error } = await supabase
      .from('links')
      .select('id, slug')
      .eq('user_id', userId)
      .eq('is_bio_link', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 é o código para nenhum resultado
      console.error('Erro ao carregar bio link:', error);
      return;
    }

    if (bioLink) {
      setBioLinkId(bioLink.id);
      setBioSlug(bioLink.slug);
      setPublicUrl(`${window.location.origin}/${bioLink.slug}`);
    } else {
      setPublicUrl('Configure seu link personalizado abaixo');
    }
  };

  const handleBioAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    
    const file = event.target.files[0];
    setBioAvatar(file);

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onloadend = () => {
      setBioAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateSlug = (value: string) => {
    if (!value) return 'O link personalizado é obrigatório';
    if (value.length < 3) return 'O link deve ter pelo menos 3 caracteres';
    if (value.length > 30) return 'O link deve ter no máximo 30 caracteres';
    if (!/^[a-z0-9-]+$/.test(value)) return 'O link deve conter apenas letras minúsculas, números e hífen';
    return '';
  };

  const handleSlugChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setBioSlug(value);
    const error = validateSlug(value);
    setSlugError(error);
    setPublicUrl(value ? `${window.location.origin}/${value}` : 'Configure seu link personalizado abaixo');

    // Se houver erro no slug ou não houver usuário, não salva
    if (error || !user || !value) return;

    try {
      // Verificar se o slug já existe
      const { data: existingLink, error: checkError } = await supabase
        .from('links')
        .select('id')
        .eq('slug', value.trim())
        .eq('is_bio_link', true)
        .neq('user_id', user.id)
        .single();

      if (existingLink) {
        setSlugError('Este link personalizado já está em uso');
        return;
      }

      // Se já existe um bioLinkId, atualiza. Se não, cria novo
      if (bioLinkId) {
        // Atualizar o link existente
        const { error: updateError } = await supabase
          .from('links')
          .update({
            slug: value.trim(),
            title: bioName || 'Meu Bio',
            destination_url: `/bio/${user.id}`
          })
          .eq('id', bioLinkId);

        if (updateError) throw updateError;
      } else {
        // Criar novo link bio
        const bioLinkData = {
          user_id: user.id,
          slug: value.trim(),
          is_bio_link: true,
          title: bioName || 'Meu Bio',
          destination_url: `/bio/${user.id}`
        };

        const { data: newLink, error: insertError } = await supabase
          .from('links')
          .insert([bioLinkData])
          .select()
          .single();

        if (insertError) throw insertError;
        if (newLink) setBioLinkId(newLink.id);
      }

      // Atualizar a URL pública
      setPublicUrl(`${window.location.origin}/${value.trim()}`);
      showSnackbar('Link personalizado salvo com sucesso', 'success');
    } catch (error: any) {
      console.error('Erro ao salvar link personalizado:', error);
      showSnackbar('Erro ao salvar link personalizado', 'error');
    }
  };

  const handleSaveBioProfile = async () => {
    if (!user) return;
    setUploading(true);

    try {
      let bioAvatarUrlToSave = bioAvatarUrl;

      // Se houver uma nova imagem para upload
      if (bioAvatar) {
        const fileExt = bioAvatar.name.split('.').pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('bio-avatars')
          .upload(filePath, bioAvatar);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('bio-avatars')
          .getPublicUrl(filePath);

        bioAvatarUrlToSave = publicUrl;
      }

      // Verificar se o slug já existe
      if (bioSlug) {
        const { data: existingLink, error: checkError } = await supabase
          .from('links')
          .select('id')
          .eq('slug', bioSlug.trim().toLowerCase())
          .eq('is_bio_link', true)
          .neq('user_id', user.id)
          .single();

        if (existingLink) {
          setSlugError('Este link personalizado já está em uso');
          throw new Error('Slug já existe');
        }
      }

      // Atualizar perfil do usuário
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          bio_name: bioName,
          bio_avatar_url: bioAvatarUrlToSave
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Deletar todos os links de bio antigos do usuário
      const { error: deleteError } = await supabase
        .from('links')
        .delete()
        .eq('user_id', user.id)
        .eq('is_bio_link', true);

      if (deleteError) throw deleteError;

      // Criar um novo link do bio
      const bioLinkData = {
        user_id: user.id,
        slug: bioSlug.trim().toLowerCase(),
        is_bio_link: true,
        title: bioName || 'Meu Bio',
        destination_url: `/bio/${user.id}`
      };

      const { error: linkInsertError } = await supabase
        .from('links')
        .insert([bioLinkData]);

      if (linkInsertError) throw linkInsertError;

      // Atualizar a URL pública com o novo slug
      setPublicUrl(`${window.location.origin}/${bioSlug.trim().toLowerCase()}`);
      showSnackbar('Perfil do bio atualizado com sucesso', 'success');
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      showSnackbar(error.message || 'Erro ao salvar perfil', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      showSnackbar('Erro ao salvar: usuário não encontrado', 'error');
      return;
    }

    if (!title || !url) {
      showSnackbar('Preencha todos os campos', 'error');
      return;
    }

    try {
      const newLink = {
        id: editingLink?.id || crypto.randomUUID(),
        user_id: user.id,
        title,
        url,
        icon: selectedIcon,
        sort_order: editingLink?.sort_order ?? links.length
      };

      let error;
      if (editingLink) {
        const { error: updateError } = await supabase
          .from('bio_links')
          .update(newLink)
          .eq('id', editingLink.id)
          .eq('user_id', user.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('bio_links')
          .insert([newLink]);
        error = insertError;
      }

      if (error) {
        console.error('Erro ao salvar:', error);
        showSnackbar(error.message || 'Erro ao salvar link', 'error');
      } else {
        showSnackbar(editingLink ? 'Link atualizado com sucesso' : 'Link criado com sucesso', 'success');
        await loadLinks(user.id);
        handleCloseDialog();
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      showSnackbar(error.message || 'Erro ao salvar link', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    const { error } = await supabase.from('bio_links').delete().eq('id', id);

    if (error) {
      showSnackbar('Erro ao deletar link', 'error');
    } else {
      showSnackbar('Link deletado com sucesso', 'success');
      await loadLinks(user.id);
    }
  };

  const handleEdit = (link: BioLink) => {
    setEditingLink(link);
    setTitle(link.title);
    setUrl(link.url);
    setSelectedIcon(link.icon);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingLink(null);
    setTitle('');
    setUrl('');
    setSelectedIcon('link');
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    if (!user) return;

    const items = Array.from(links);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedLinks = items.map((item, index) => ({
      ...item,
      sort_order: index
    }));

    setLinks(updatedLinks);

    const { error } = await supabase.from('bio_links').upsert(
      updatedLinks.map(({ id, sort_order }) => ({ id, sort_order }))
    );

    if (error) {
      showSnackbar('Erro ao reordenar links', 'error');
      await loadLinks(user.id);
    }
  };

  const copyPublicUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    showSnackbar('Link copiado para a área de transferência', 'success');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
        p: { xs: 1, sm: 3 },
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <Container 
        maxWidth="md"
        sx={{
          p: { xs: 0, sm: 2 }
        }}
      >
        {/* Profile Section */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 4 },
            borderRadius: 4,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: 'divider',
            mb: 4,
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Title */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                fontSize: { xs: '1.75rem', sm: '2.25rem' },
                letterSpacing: '-0.02em'
              }}
            >
              Seu Bio Link
          </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.95rem', sm: '1rem' }
              }}
            >
              Personalize sua página de links para compartilhar com todos
            </Typography>
        </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'flex-start' },
              gap: 3,
              mb: 4
            }}
          >
            {/* Avatar Section */}
            <Box
              sx={{
                position: 'relative',
                mb: { xs: 2, sm: 0 }
              }}
            >
              <Avatar
                src={bioAvatarUrl || undefined}
                sx={{
                  width: { xs: 120, sm: 140 },
                  height: { xs: 120, sm: 140 },
                  bgcolor: bioAvatarUrl ? 'transparent' : 'primary.main',
                  fontSize: { xs: '3rem', sm: '3.5rem' },
                  border: '4px solid white',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)'
                  }
                }}
              >
                {bioName ? bioName.charAt(0).toUpperCase() : '?'}
              </Avatar>
              <IconButton
                component="label"
                sx={{
                  position: 'absolute',
                  right: -8,
                  bottom: -8,
                  bgcolor: 'primary.main',
                  color: 'white',
                  boxShadow: 2,
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease-in-out',
                  width: 40,
                  height: 40
                }}
              >
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleBioAvatarChange}
                />
                <PhotoCamera sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            {/* Form Section */}
            <Box sx={{ flex: 1, width: '100%' }}>
              <TextField
                fullWidth
                label="Nome para exibição"
                value={bioName}
                onChange={(e) => setBioName(e.target.value)}
            variant="outlined"
            sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  ),
                }}
                helperText="Este nome será exibido na sua página de bio"
              />

              <TextField
                fullWidth
                label="Link personalizado"
                value={bioSlug}
                onChange={handleSlugChange}
                error={!!slugError}
                helperText={slugError || "Escolha um link único e memorável"}
                variant="outlined"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box 
                        component="span" 
                        sx={{ 
                          color: 'text.secondary',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mr: -1
                        }}
                      >
                        <LinkIcon sx={{ color: 'primary.main' }} />
                        {window.location.origin}/
                      </Box>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>

          {/* Public URL Preview */}
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              mb: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VerifiedRounded sx={{ color: 'white' }} />
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                Seu link público:
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  flex: 1,
                  textAlign: { xs: 'center', sm: 'left' }
                }}
              >
              {publicUrl}
            </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Abrir em nova guia" placement="top">
                  <IconButton
                    onClick={() => window.open(publicUrl, '_blank')}
                    size="small"
                    disabled={!bioSlug}
                    sx={{
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                      },
                      '&.Mui-disabled': {
                        color: 'rgba(255, 255, 255, 0.5)'
                      }
                    }}
                  >
                    <LaunchIcon fontSize="small" />
              </IconButton>
            </Tooltip>
                <Tooltip title="Copiar link" placement="top">
                  <IconButton
                    onClick={copyPublicUrl}
                    size="small"
                    disabled={!bioSlug}
                    sx={{
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                      },
                      '&.Mui-disabled': {
                        color: 'rgba(255, 255, 255, 0.5)'
                      }
                    }}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
          </Paper>

        {/* Links Section */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 4 },
            borderRadius: { xs: 2, sm: 4 },
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: 'divider',
            mb: 4,
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3,
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              Seus Links
            </Typography>
            <Button
              variant="contained"
              onClick={() => setOpenDialog(true)}
              startIcon={<Add />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Adicionar Link
            </Button>
        </Box>

          {/* Links List */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="links">
            {(provided) => (
                <Box
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: { xs: 1, sm: 2 },
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                {links.map((link, index) => (
                  <Draggable key={link.id} draggableId={link.id} index={index}>
                    {(provided) => (
                        <Paper
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          elevation={0}
                        sx={{
                            p: { xs: 1.5, sm: 2 },
                            borderRadius: { xs: 1, sm: 2 },
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            display: 'flex',
                            alignItems: 'center',
                            gap: { xs: 1, sm: 2 },
                            width: '100%',
                            boxSizing: 'border-box',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                            }
                          }}
                        >
                          <DragIcon sx={{ 
                            color: 'text.secondary', 
                            cursor: 'grab',
                            fontSize: { xs: 18, sm: 20 }
                          }} />
                          <Box sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: { xs: 1, sm: 2 }, 
                            flex: 1,
                            minWidth: 0
                          }}>
                            <Avatar
                              sx={{
                                bgcolor: 'primary.main',
                                width: { xs: 32, sm: 40 },
                                height: { xs: 32, sm: 40 }
                              }}
                            >
                              {React.cloneElement(AVAILABLE_ICONS[link.icon as keyof typeof AVAILABLE_ICONS] as React.ReactElement, {
                                sx: { fontSize: { xs: 16, sm: 20 } }
                              })}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                  color: 'text.primary',
                                  fontSize: { xs: '0.875rem', sm: '0.95rem' },
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {link.title}
                              </Typography>
                              <Typography
                                sx={{
                                  color: 'text.secondary',
                                  fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                              {link.url}
                            </Typography>
                          </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                onClick={() => handleEdit(link)}
                                size="small"
                                sx={{
                                  color: 'primary.main',
                                  '&:hover': { 
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <EditIcon fontSize="small" />
                            </IconButton>
                              <IconButton
                                onClick={() => handleDelete(link.id)}
                                size="small"
                                sx={{
                                  color: 'error.main',
                                  '&:hover': { 
                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                            </Box>
                          </Box>
                        </Paper>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                </Box>
            )}
          </Droppable>
        </DragDropContext>

          {links.length === 0 && (
            <Box
              sx={{
                textAlign: 'center',
                py: 6,
                px: 2,
                color: 'text.secondary'
              }}
            >
              <AddLink sx={{ fontSize: 48, mb: 2, color: 'primary.main', opacity: 0.5 }} />
              <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
                Nenhum link adicionado
              </Typography>
              <Typography variant="body2">
                Clique em "Adicionar Link" para começar a personalizar sua página
              </Typography>
            </Box>
          )}
      </Paper>

        {/* Save Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Button
            variant="contained"
            onClick={handleSaveBioProfile}
            disabled={uploading || !!slugError}
            sx={{
              py: 1.5,
              px: 6,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease-in-out',
              position: 'relative'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {uploading ? (
                <CircularProgress size={20} sx={{ color: 'inherit' }} />
              ) : (
                <Save />
              )}
              {uploading ? 'Salvando...' : 'Salvar Perfil'}
            </Box>
          </Button>
        </Box>
      </Container>

      {/* Add/Edit Link Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: 'background.paper',
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255, 0.9) 0%, rgba(255,255,255, 0.95) 100%)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
          }
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            pt: 3,
            px: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 40,
              height: 40
            }}
          >
            {editingLink ? <Edit /> : <Add />}
          </Avatar>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                fontSize: '1.25rem',
                lineHeight: 1.2
              }}
            >
              {editingLink ? 'Editar Link' : 'Novo Link'}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mt: 0.5
              }}
            >
              {editingLink ? 'Atualize as informações do seu link' : 'Adicione um novo link à sua página'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent 
          sx={{ 
            p: 3,
            mt: 1,
            '&::-webkit-scrollbar': {
              width: '8px'
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '4px'
            }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Título */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  color: 'text.primary',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Title sx={{ color: 'primary.main', fontSize: 20 }} />
                Nome do Link
              </Typography>
            <TextField
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
                variant="outlined"
                placeholder="Ex: Meu Instagram"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  }
                }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                Digite um nome descritivo para seu link
              </Typography>
            </Box>

            {/* URL */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  color: 'text.primary',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <LinkIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                URL do Link
              </Typography>
            <TextField
              fullWidth
              value={url}
              onChange={(e) => setUrl(e.target.value)}
                variant="outlined"
              placeholder="Ex: https://instagram.com/seu.perfil"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  }
                }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                Cole a URL completa incluindo https://
              </Typography>
            </Box>

            {/* Seleção de Ícone */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1.5,
                  color: 'text.primary',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {AVAILABLE_ICONS[selectedIcon as keyof typeof AVAILABLE_ICONS]}
                </Box>
                Ícone do Link
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.paper'
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
                    gap: 1,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    pr: 1,
                    '&::-webkit-scrollbar': {
                      width: '6px'
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'transparent'
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'rgba(0, 0, 0, 0.1)',
                      borderRadius: '3px'
                    }
                  }}
                >
              {Object.entries(AVAILABLE_ICONS).map(([key, icon]) => (
                    <Tooltip key={key} title={key.charAt(0).toUpperCase() + key.slice(1)} arrow>
                    <IconButton
                      onClick={() => setSelectedIcon(key)}
                      sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: selectedIcon === key ? 'primary.main' : 'transparent',
                          color: selectedIcon === key ? 'white' : 'text.primary',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            bgcolor: selectedIcon === key ? 'primary.dark' : alpha(theme.palette.primary.main, 0.1),
                            transform: 'scale(1.1)'
                          }
                      }}
                    >
                      {icon}
                    </IconButton>
                  </Tooltip>
                  ))}
                </Box>
              </Paper>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                Escolha um ícone que melhor represente seu link
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions 
          sx={{ 
            px: 3, 
            pb: 3,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            gap: 2
          }}
        >
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            startIcon={<Close />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'text.primary',
                bgcolor: 'transparent'
              }
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!title || !url}
            startIcon={<Save />}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                bgcolor: 'primary.dark'
              }
            }}
          >
            {editingLink ? 'Atualizar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity as any}
          sx={{
            width: '100%',
            borderRadius: 2,
            bgcolor: snackbar.severity === 'success' ? 'success.main' : 'error.main',
            color: 'white',
            '& .MuiAlert-icon': {
              color: 'white'
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BioLinksPage; 