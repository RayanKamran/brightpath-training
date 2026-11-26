import Box from '@mui/material/Box';

const dotSx = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  bgcolor: 'black',
  animation: 'dot 1.2s ease-in-out infinite',
  '@keyframes dot': {
    '0%, 80%, 100%': {transform: 'scale(0.6)', opacity: 0.4},
    '40%': {transform: 'scale(1)', opacity: 1},
  },
};

export function AnimatedDots() {
  return (
    <Box sx={{display: 'flex', gap: 0.75}}>
      <Box sx={dotSx} />
      <Box sx={{...dotSx, animationDelay: '0.4s'}} />
      <Box sx={{...dotSx, animationDelay: '0.8s'}} />
    </Box>
  );
}
