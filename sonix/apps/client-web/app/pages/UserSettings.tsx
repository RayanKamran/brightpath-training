import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {ProfilePhotoAvatar} from 'components/ProfilePhotoAvatar';
import {useAuth} from 'core/contexts/auth/useAuth';
import {userQueries} from 'pages/users/queries/userQueries';
import type {UserProfile} from 'pages/users/types/user';
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router';

export default function UserSettings() {
  const {isLoading: authLoading, userClaims, error: authError, accessToken} = useAuth();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [nickname, setNickname] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [timezone, setTimezone] = useState('');

  // Fetch user profile from RavenDB
  useEffect(() => {
    const fetchProfile = async () => {
      if (!accessToken || authLoading) {
        return;
      }

      try {
        setIsLoadingProfile(true);
        setProfileError(null);
        const profile = await userQueries.getProfile(accessToken);
        setUserProfile(profile);

        // Initialize form fields
        setNickname(profile.nickname ?? '');
        setDisplayName(profile.displayName ?? '');
        setBio(profile.bio ?? '');
        setPreferredLanguage(profile.preferredLanguage ?? '');
        setTimezone(profile.timezone ?? '');
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        setProfileError(err instanceof Error ? err.message : 'Failed to load user profile');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [accessToken, authLoading]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset form to current profile values
    setNickname(userProfile?.nickname ?? '');
    setDisplayName(userProfile?.displayName ?? '');
    setBio(userProfile?.bio ?? '');
    setPreferredLanguage(userProfile?.preferredLanguage ?? '');
    setTimezone(userProfile?.timezone ?? '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!accessToken) {
      return;
    }

    try {
      setIsSaving(true);
      const updatedProfile = await userQueries.updateProfile(
        {
          displayName: displayName || null,
          bio: bio || null,
          preferredLanguage: preferredLanguage || null,
          timezone: timezone || null,
        },
        accessToken,
      );

      setUserProfile(updatedProfile);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoadingProfile) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{mb: 3, display: 'flex', alignItems: 'center', gap: 2}}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{flexGrow: 1}}>
          User Profile
        </Typography>
        {!isEditing && userProfile && (
          <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit}>
            Edit Profile
          </Button>
        )}
        {isEditing && (
          <>
            <Button variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </>
        )}
      </Box>

      {authError && (
        <Alert severity="error" sx={{mb: 3}}>
          <Typography variant="body1" gutterBottom>
            {authError}
          </Typography>
        </Alert>
      )}

      {profileError && (
        <Alert severity="error" sx={{mb: 3}}>
          <Typography variant="body1">{profileError}</Typography>
        </Alert>
      )}

      <Card sx={{mb: 3}}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Authentication Information (Logto)
          </Typography>
          <Divider sx={{mb: 3}} />

          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Logto User ID
              </Typography>
              <Typography variant="body1" sx={{fontFamily: 'monospace', fontSize: '0.875rem'}}>
                {userClaims?.sub ?? 'N/A'}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {userProfile && userClaims?.sub && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <Divider sx={{mb: 3}} />

            <Box sx={{mb: 3}}>
              <ProfilePhotoAvatar
                logtoUserId={userClaims.sub}
                hasProfilePhoto={userProfile.hasProfilePhoto ?? false}
                displayName={userProfile.displayName ?? userProfile.email}
                size={80}
                editable
                onPhotoChange={({hasProfilePhoto}) =>
                  setUserProfile((prev) => (prev ? {...prev, hasProfilePhoto} : prev))
                }
              />
            </Box>

            <Stack spacing={3}>
              {!isEditing ? (
                <>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Email
                    </Typography>
                    <Typography variant="body1">{userProfile.email}</Typography>
                  </Box>

                  {userProfile.username && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Username
                      </Typography>
                      <Typography variant="body1">{userProfile.username}</Typography>
                    </Box>
                  )}

                  {userProfile.displayName && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Display Name
                      </Typography>
                      <Typography variant="body1">{userProfile.displayName}</Typography>
                    </Box>
                  )}

                  {userProfile.nickname && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Nickname
                      </Typography>
                      <Typography variant="body1">{userProfile.nickname}</Typography>
                    </Box>
                  )}

                  {userProfile.bio && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Bio
                      </Typography>
                      <Typography variant="body1">{userProfile.bio}</Typography>
                    </Box>
                  )}

                  {userProfile.preferredLanguage && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Preferred Language
                      </Typography>
                      <Typography variant="body1">{userProfile.preferredLanguage}</Typography>
                    </Box>
                  )}

                  {userProfile.timezone && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Timezone
                      </Typography>
                      <Typography variant="body1">{userProfile.timezone}</Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Profile Completeness
                    </Typography>
                    <Typography variant="body1">{userProfile.profileCompleteness}%</Typography>
                  </Box>

                  {userProfile.lastLoginAt && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Last Login
                      </Typography>
                      <Typography variant="body1">
                        {new Date(userProfile.lastLoginAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Member Since
                    </Typography>
                    <Typography variant="body1">
                      {new Date(userProfile.createdDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Typography>
                  </Box>
                </>
              ) : (
                <>
                  <TextField
                    label="Email"
                    value={userProfile.email}
                    disabled
                    fullWidth
                    helperText="Email cannot be changed here. Managed by Logto."
                  />

                  {userProfile.username && (
                    <TextField
                      label="Username"
                      value={userProfile.username}
                      disabled
                      fullWidth
                      helperText="Username cannot be changed here. Managed by Logto."
                    />
                  )}

                  <TextField
                    label="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    fullWidth
                    slotProps={{htmlInput: {maxLength: 200}}}
                  />

                  <TextField
                    label="Nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    fullWidth
                    slotProps={{htmlInput: {maxLength: 100}}}
                    helperText="How would you like to be addressed?"
                  />

                  <TextField
                    label="Bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                    slotProps={{htmlInput: {maxLength: 1000}}}
                    helperText="Tell us about yourself"
                  />

                  <TextField
                    label="Preferred Language"
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    fullWidth
                    slotProps={{htmlInput: {maxLength: 10}}}
                    placeholder="en, es, fr, etc."
                  />

                  <TextField
                    label="Timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    fullWidth
                    slotProps={{htmlInput: {maxLength: 50}}}
                    placeholder="America/New_York, Europe/London, etc."
                  />
                </>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
