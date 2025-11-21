import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { getImageUrl } from "../utils";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Drawer,
  Toolbar,
  useTheme,
  useMediaQuery,
  Container,
  Chip
} from "@mui/material";
import {
  Edit,
  Delete,
  Add,
  Dashboard as DashboardIcon,
  Article,
  Bookmark,
  Settings,
  Logout,
  Menu as MenuIcon,
  Person
} from "@mui/icons-material";

// Interfaces
interface Category {
  id: number;
  name: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  owner_id: number;
  created_at: string;
  image_url?: string;
  category?: Category;
}

interface Bookmark {
  id: number;
  user_id: number;
  post_id: number;
  created_at: string;
  post: Post;
}

interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  posts: Post[];
  bookmarks: Bookmark[];
  username?: string;
}

type ActiveView = "dashboard" | "posts" | "bookmarks" | "settings";

const drawerWidth = 260;

const UserProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState<string>("");
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const response = await api.get("/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
        setNewUsername(response.data.username || "");
      } catch (err: any) {
        setError("Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [navigate]);

  const handleUsernameUpdate = async () => {
    const token = localStorage.getItem("access_token");
    try {
      await api.put(
        "/users/me/username",
        { username: newUsername },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser((prevUser) => (prevUser ? { ...prevUser, username: newUsername } : null));
      alert("Username updated successfully!");
    } catch (error) {
      alert("Failed to update username.");
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      const token = localStorage.getItem("access_token");
      try {
        await api.delete(`/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser((prevUser) =>
          prevUser ? { ...prevUser, posts: prevUser.posts.filter((post) => post.id !== postId) } : null
        );
      } catch (error) {
        alert("Failed to delete post.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    window.dispatchEvent(new Event("logoutEvent"));
    navigate("/login");
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>Go Home</Button>
      </Container>
    );
  }

  if (!user) {
    return <Typography>No user data found.</Typography>;
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
      <Toolbar sx={{ px: 3, mb: 1 }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: '#333' }}>
          My Profile
        </Typography>
      </Toolbar>
      <Box sx={{ px: 3, mb: 3, display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ width: 48, height: 48, mr: 2, bgcolor: theme.palette.primary.main }}>
          {user.username ? user.username[0].toUpperCase() : <Person />}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
            {user.username || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {user.email}
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ mx: 2 }} />
      <List sx={{ px: 2, py: 2 }}>
        {[
          { id: 'dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
          { id: 'posts', icon: <Article />, label: 'My Posts' },
          { id: 'bookmarks', icon: <Bookmark />, label: 'Bookmarks' },
          { id: 'settings', icon: <Settings />, label: 'Settings' },
        ].map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={activeView === item.id}
              onClick={() => { setActiveView(item.id as ActiveView); if (isMobile) setMobileOpen(false); }}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                  '& .MuiListItemIcon-root': { color: 'primary.dark' }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<Logout />}
          onClick={handleLogout}
          sx={{ borderRadius: 2 }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
              Welcome back, {user.username || 'User'}! 👋
            </Typography>
            <Grid container spacing={3}>
              <Grid xs={12} sm={6} md={4}>
                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#e3f2fd', color: '#1565c0', height: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Posts Created</Typography>
                    <Article fontSize="large" sx={{ opacity: 0.5 }} />
                  </Box>
                  <Typography variant="h2" fontWeight="bold">{user.posts.length}</Typography>
                </Paper>
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#f3e5f5', color: '#7b1fa2', height: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Bookmarks</Typography>
                    <Bookmark fontSize="large" sx={{ opacity: 0.5 }} />
                  </Box>
                  <Typography variant="h2" fontWeight="bold">{user.bookmarks.length}</Typography>
                </Paper>
              </Grid>
              <Grid xs={12} md={4}>
                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#fff', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Add />}
                    onClick={() => navigate('/create-post')}
                    sx={{ borderRadius: 8, px: 4, py: 1.5 }}
                  >
                    Create New Post
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );
      case "posts":
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">My Posts</Typography>
              <Button startIcon={<Add />} variant="contained" onClick={() => navigate('/create-post')}>
                Create
              </Button>
            </Box>
            {user.posts.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'transparent', boxShadow: 'none' }}>
                <Typography color="text.secondary">You haven't created any posts yet.</Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {user.posts.map((post) => (
                  <Grid xs={12} sm={6} lg={4} key={post.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={getImageUrl(post.image_url)}
                        alt={post.title}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography gutterBottom variant="h6" component="div" noWrap>
                          {post.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {post.content}
                        </Typography>
                        {post.category && (
                          <Chip label={post.category.name} size="small" sx={{ mt: 1 }} />
                        )}
                      </CardContent>
                      <Divider />
                      <CardActions sx={{ justifyContent: 'flex-end', p: 1.5 }}>
                        <IconButton size="small" onClick={() => navigate(`/edit-post/${post.id}`)} color="primary">
                          <Edit />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeletePost(post.id)} color="error">
                          <Delete />
                        </IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );
      case "bookmarks":
        return (
          <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>My Bookmarks</Typography>
            {user.bookmarks.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'transparent', boxShadow: 'none' }}>
                <Typography color="text.secondary">No bookmarks yet.</Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {user.bookmarks.map((bookmark) => (
                  <Grid xs={12} sm={6} lg={4} key={bookmark.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3 }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={getImageUrl(bookmark.post.image_url)}
                        alt={bookmark.post.title}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography gutterBottom variant="h6" component="div" noWrap>
                          {bookmark.post.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {bookmark.post.content}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );
      case "settings":
        return (
          <Box maxWidth="md">
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Account Settings</Typography>
            <Paper sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom>Profile Information</Typography>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid xs={12}>
                  <TextField
                    label="Email Address"
                    value={user.email}
                    disabled
                    fullWidth
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid xs={12}>
                  <TextField
                    label="Username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    fullWidth
                    helperText="This is how you'll appear to others"
                  />
                </Grid>
                <Grid xs={12}>
                  <Button variant="contained" size="large" onClick={handleUsernameUpdate} sx={{ mt: 1 }}>
                    Save Changes
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: "flex", bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Mobile Header */}
      {isMobile && (
        <Paper
          elevation={0}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0,0,0,0.1)'
          }}
        >
          <IconButton onClick={handleDrawerToggle} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="bold">Profile</Typography>
        </Paper>
      )}

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none', boxShadow: '4px 0 24px rgba(0,0,0,0.02)' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, md: 0 }
        }}
      >
        <Container maxWidth="lg" disableGutters>
          {renderContent()}
        </Container>
      </Box>
    </Box>
  );
};

export default UserProfile;