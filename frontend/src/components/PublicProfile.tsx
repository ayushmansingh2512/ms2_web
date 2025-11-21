import { useEffect, useState } from "react";
import api from "../api";
import { useParams, useNavigate } from "react-router-dom";
import {
    Avatar,
    Box,
    Card,
    CardContent,
    CardMedia,
    Grid,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    Container,
    Button
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

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

interface UserProfile {
    id: number;
    username?: string;
    email: string;
    posts: Post[];
}

const PublicProfile = () => {
    const { userId } = useParams<{ userId: string }>();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!userId) return;
            try {
                const response = await api.get(`/users/${userId}`);
                setUser(response.data);
            } catch (err: any) {
                console.error("Error fetching user profile:", err);
                setError("Failed to load user profile.");
            } finally {
                setLoading(false);
            }
        };
        fetchUserProfile();
    }, [userId]);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
                    Go Back
                </Button>
            </Container>
        );
    }

    if (!user) {
        return <Typography>User not found.</Typography>;
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            backgroundColor: '#f9f9f9',
            pt: 4,
            pb: 8
        }}>
            <Container maxWidth="lg">
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate(-1)}
                    sx={{ mb: 3 }}
                >
                    Back
                </Button>

                {/* Profile Header */}
                <Paper sx={{ p: 4, mb: 4, borderRadius: 2, textAlign: 'center' }}>
                    <Avatar
                        sx={{
                            width: 100,
                            height: 100,
                            margin: '0 auto 16px',
                            bgcolor: '#3a97e3',
                            fontSize: '2.5rem'
                        }}
                    >
                        {user.username ? user.username[0].toUpperCase() : '?'}
                    </Avatar>
                    <Typography variant="h4" gutterBottom fontWeight="bold">
                        {user.username || `User ${user.id}`}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                        {user.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {user.posts.length} Posts
                    </Typography>
                </Paper>

                {/* Posts Grid */}
                <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                    Posts by {user.username || 'this user'}
                </Typography>

                {user.posts.length > 0 ? (
                    <Grid container spacing={3}>
                        {user.posts.map((post) => (
                            <Grid item xs={12} sm={6} md={4} key={post.id}>
                                <Card sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: 2,
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4
                                    }
                                }}>
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={post.image_url ? (post.image_url.startsWith('http') ? post.image_url : `http://localhost:8000${post.image_url}`) : 'https://via.placeholder.com/300?text=No+Image'}
                                        alt={post.title}
                                        sx={{ objectFit: 'cover' }}
                                    />
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography gutterBottom variant="h6" component="div" sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            lineHeight: 1.3
                                        }}>
                                            {post.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical'
                                        }}>
                                            {post.content}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'transparent', boxShadow: 'none' }}>
                        <Typography variant="h6" color="text.secondary">
                            No posts yet.
                        </Typography>
                    </Paper>
                )}
            </Container>
        </Box>
    );
};

export default PublicProfile;
