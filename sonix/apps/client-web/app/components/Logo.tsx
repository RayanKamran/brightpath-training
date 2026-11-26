import Box from '@mui/material/Box';

type LogoProps = {
  width?: number | string;
  animated?: boolean;
};

export function Logo({width = 80, animated = false}: LogoProps) {
  const pathStyle: React.CSSProperties = animated
    ? {
        fill: '#df4145',
        stroke: '#df4145',
        strokeWidth: 1.5,
        strokeDasharray: 1000,
        strokeDashoffset: 1000,
        animation: 'drawPath 2s ease-in-out infinite',
      }
    : {fill: '#df4145'};

  return (
    <Box
      component="svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-5 -5 160 160"
      sx={{
        width,
        height: 'auto',
        display: 'block',
        ...(animated && {
          '@keyframes drawPath': {
            '0%': {strokeDashoffset: 1000, fillOpacity: 0},
            '50%': {strokeDashoffset: 0, fillOpacity: 0},
            '70%': {fillOpacity: 1},
            '100%': {strokeDashoffset: 0, fillOpacity: 1},
          },
        }),
      }}
    >
      <path
        style={{...pathStyle, animationDelay: animated ? '0s' : undefined}}
        d="M136.35,87.69l-30.69-17.72-33.55-19.37c-2.67-1.54-4.32-4.39-4.32-7.48v-24.92c0-3.32.77-6.61,2.39-9.51.95-1.69,2.19-3.52,3.75-5.07,2.85-2.82,7.01-3.96,10.96-3.25,2.83.51,5.58,1.49,8.15,2.97l39.67,22.9c7.25,4.19,11.72,11.92,11.72,20.29v39.74c0,2.7-2.92,4.38-5.25,3.03l-2.82-1.63Z"
      />
      <path
        style={{...pathStyle, animationDelay: animated ? '0.4s' : undefined}}
        d="M56.8,13.13l.17,35.43.18,38.48c.02,3.25-1.7,6.26-4.51,7.9l-21.11,12.32c-3.21,1.87-6.85,2.9-10.57,2.84-1.25-.02-2.58-.13-3.91-.37-4.99-.93-8.81-4.84-10.24-9.7-.66-2.24-1.01-4.58-1.02-6.97l-.22-45.54c-.04-8.54,4.48-16.44,11.85-20.75l31.37-18.31,2.03-1.18c2.63-1.54,5.95.35,5.96,3.4v2.46Z"
      />
      <path
        style={{...pathStyle, animationDelay: animated ? '0.8s' : undefined}}
        d="M32.33,119.53l30.56-17.94,33.09-19.42c2.86-1.68,6.4-1.7,9.28-.07l21.57,12.25c3.14,1.78,5.72,4.42,7.42,7.61l.54,1.01c2.72,5.07,2.09,11.36-1.75,15.65-1.71,1.9-3.72,3.56-5.99,4.9l-39.18,22.99c-7.42,4.35-16.6,4.42-24.08.17l-31.5-17.89-1.76-1c-2.78-1.58-2.81-5.57-.05-7.19l1.84-1.08Z"
      />
    </Box>
  );
}
