import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import {Avatar, Box, CircularProgress, IconButton, Tooltip} from '@mui/material';
import {useAuth} from 'core/contexts/auth/useAuth';
import {getUserPhotoUrl} from 'core/services/userPhotoUrl';
import {userQueries} from 'pages/users/queries/userQueries';
import {useRef, useState} from 'react';

const MAX_DIMENSION = 512; // px — longest edge after resize
const JPEG_QUALITY = 0.85;

/** Resize + re-encode a File to a JPEG Blob using an offscreen Canvas. */
function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let {width, height} = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height / width) * MAX_DIMENSION);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width / height) * MAX_DIMENSION);
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], 'profile-photo.jpg', {type: 'image/jpeg'}));
        },
        'image/jpeg',
        JPEG_QUALITY,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) {
    return '';
  }
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface ProfilePhotoAvatarProps {
  logtoUserId: string;
  hasProfilePhoto: boolean;
  displayName?: string;
  size?: number;
  editable?: boolean;
  onPhotoChange?: (updated: {hasProfilePhoto: boolean}) => void;
}

export function ProfilePhotoAvatar({
  logtoUserId,
  hasProfilePhoto,
  displayName,
  size = 80,
  editable = false,
  onPhotoChange,
}: ProfilePhotoAvatarProps) {
  const {accessToken} = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cache-bust the image URL after upload/delete so the browser re-fetches it
  const [cacheBust, setCacheBust] = useState(() => Date.now());

  const photoUrl = hasProfilePhoto ? `${getUserPhotoUrl(logtoUserId)}?v=${cacheBust}` : null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !accessToken) {
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const updated = await userQueries.uploadPhoto(logtoUserId, compressed, accessToken);
      const ts = Date.now();
      setCacheBust(ts);
      onPhotoChange?.({hasProfilePhoto: updated.hasProfilePhoto});
      window.dispatchEvent(
        new CustomEvent('profile-photo-changed', {
          detail: {logtoUserId, hasProfilePhoto: updated.hasProfilePhoto, ts},
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  async function handleDelete() {
    if (!accessToken) {
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const updated = await userQueries.deletePhoto(logtoUserId, accessToken);
      const ts = Date.now();
      setCacheBust(ts);
      onPhotoChange?.({hasProfilePhoto: updated.hasProfilePhoto});
      window.dispatchEvent(
        new CustomEvent('profile-photo-changed', {
          detail: {logtoUserId, hasProfilePhoto: updated.hasProfilePhoto, ts},
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Box sx={{display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0.5}}>
      <Box sx={{position: 'relative', display: 'inline-flex'}}>
        {/* Avatar */}
        <Avatar
          key={cacheBust}
          src={photoUrl ?? undefined}
          sx={{width: size, height: size, bgcolor: 'primary.light', fontSize: size * 0.4}}
        >
          {!photoUrl &&
            (displayName ? getInitials(displayName) : <PersonIcon sx={{fontSize: size * 0.6}} />)}
        </Avatar>

        {/* Upload overlay */}
        {editable && (
          <Tooltip title={hasProfilePhoto ? 'Change photo' : 'Upload photo'}>
            <IconButton
              size="small"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                p: '3px',
                '&:hover': {bgcolor: 'action.hover'},
              }}
            >
              {uploading ? <CircularProgress size={14} /> : <CameraAltIcon sx={{fontSize: 14}} />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Remove button — only shown when there is a photo and editable */}
      {editable && hasProfilePhoto && !uploading && (
        <Tooltip title="Remove photo">
          <IconButton size="small" onClick={handleDelete} color="error" sx={{p: '2px'}}>
            <DeleteIcon sx={{fontSize: 14}} />
          </IconButton>
        </Tooltip>
      )}

      {/* Error message */}
      {error && (
        <Box
          sx={{fontSize: '0.7rem', color: 'error.main', maxWidth: size + 40, textAlign: 'center'}}
        >
          {error}
        </Box>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{display: 'none'}}
        onChange={handleFileChange}
      />
    </Box>
  );
}
