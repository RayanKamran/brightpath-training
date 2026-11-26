import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router';
import type {Feature, FeatureCategory} from './core/config/featureRegistry';
import {
  CATEGORY_LABEL_KEYS,
  getFeaturesByCategory,
  STATUS_CONFIG,
} from './core/config/featureRegistry';
import {useLocation} from './core/contexts/location/useLocation';

function FeatureCard({feature}: {feature: Feature}) {
  const {t} = useTranslation(['common', 'navigation']);
  // Keys are dynamic from the feature registry — safe to cast
  const tKey = t as (key: string) => string;
  const config = STATUS_CONFIG[feature.status];
  const isDisabled = feature.status === 'not-started';

  const cardContent = (
    <Box sx={{p: 2}}>
      <Typography variant="subtitle1" sx={{fontWeight: 500}}>
        {tKey(feature.nameKey)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{mt: 0.5, mb: 1.5}}>
        {tKey(feature.descriptionKey)}
      </Typography>
      <Chip label={tKey(config.labelKey)} color={config.chipColor} size="small" />
    </Box>
  );

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderLeft: 4,
        borderLeftColor: config.color,
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      {isDisabled ? (
        <Box sx={{cursor: 'default'}}>{cardContent}</Box>
      ) : (
        <CardActionArea component={Link} to={feature.route}>
          {cardContent}
        </CardActionArea>
      )}
    </Card>
  );
}

function CategorySection({
  category,
  featureList,
}: {
  category: FeatureCategory;
  featureList: Feature[];
}) {
  const {t} = useTranslation('navigation');
  const tKey = t as (key: string) => string;
  if (featureList.length === 0) {
    return null;
  }

  return (
    <Box sx={{mb: 4}}>
      <Typography variant="h6" sx={{mb: 2}}>
        {tKey(CATEGORY_LABEL_KEYS[category])}
      </Typography>
      <Grid container spacing={2}>
        {featureList.map((feature) => (
          <Grid key={feature.id} size={{xs: 12, sm: 6, md: 4, lg: 3}}>
            <FeatureCard feature={feature} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default function Home() {
  const {t} = useTranslation(['common', 'home', 'navigation']);
  const {currentLocation, isLoading} = useLocation();
  const featuresByCategory = getFeaturesByCategory();

  if (isLoading) {
    return (
      <Box sx={{p: 3}}>
        <Typography>{t('common:loadingLocation')}</Typography>
      </Box>
    );
  }

  if (!currentLocation) {
    return (
      <Box sx={{p: 3}}>
        <Typography>{t('common:noLocationAssigned')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{p: 3}}>
      {/* Header */}
      <Box sx={{mb: 3}}>
        <Typography variant="h4" sx={{fontWeight: 600}}>
          {currentLocation.name}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{mt: 0.5}}>
          {t('home:welcome')}
        </Typography>
      </Box>

      {/* Legend */}
      <Stack direction="row" spacing={1} sx={{mb: 4}}>
        <Chip label={t('home:status.complete')} color="success" size="small" />
        <Chip label={t('home:status.inProgress')} color="warning" size="small" />
        <Chip label={t('home:status.notStarted')} size="small" />
      </Stack>

      {/* Feature grid grouped by category */}
      {Array.from(featuresByCategory.entries()).map(([category, featureList]) => (
        <CategorySection key={category} category={category} featureList={featureList} />
      ))}
    </Box>
  );
}
