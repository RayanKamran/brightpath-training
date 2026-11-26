import {useLogto} from '@logto/react';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import AddModeratorIcon from '@mui/icons-material/AddModerator';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BadgeIcon from '@mui/icons-material/Badge';
import BuildIcon from '@mui/icons-material/Build';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import BusAlertIcon from '@mui/icons-material/BusAlert';
import BusinessIcon from '@mui/icons-material/Business';
import CalculateIcon from '@mui/icons-material/Calculate';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import CarRepairIcon from '@mui/icons-material/CarRepair';
import ChecklistIcon from '@mui/icons-material/Checklist';
import CodeIcon from '@mui/icons-material/Code';
import ConnectWithoutContactIcon from '@mui/icons-material/ConnectWithoutContact';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import EngineeringIcon from '@mui/icons-material/Engineering';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HandshakeIcon from '@mui/icons-material/Handshake';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory';
import LightModeIcon from '@mui/icons-material/LightMode';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import PaymentsIcon from '@mui/icons-material/Payments';
import PeopleIcon from '@mui/icons-material/People';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import RvHookupIcon from '@mui/icons-material/RvHookup';
import SettingsIcon from '@mui/icons-material/Settings';
import ShelvesIcon from '@mui/icons-material/Shelves';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SummarizeIcon from '@mui/icons-material/Summarize';
import SyncIcon from '@mui/icons-material/Sync';
import TaskIcon from '@mui/icons-material/Task';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {getFeatureById, STATUS_CONFIG} from 'core/config/featureRegistry';
import {useAuth} from 'core/contexts/auth/useAuth';
import {getUserPhotoUrl} from 'core/services/userPhotoUrl';
import {userQueries} from 'pages/users/queries/userQueries';
import {type ReactNode, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link, Outlet, useNavigate, useLocation as useRouterLocation} from 'react-router';
import {useColorMode} from '../contexts/ColorModeContext';
import RentHangingSignIcon from '../icons/RentHangingSignIcon';
import {ComingSoonDialog} from './ComingSoonDialog';
import {DmsLogoImage} from './DmsLogoImage';
import {LanguageSwitcher} from './LanguageSwitcher';
import {LocationSwitcher} from './LocationSwitcher';
import {NetworkAlert} from './NetworkAlert';

const SIDEBAR_EXPANDED_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 68;
const APPBAR_HEIGHT = 56;
const TRANSITION_DURATION = '200ms';
const STORAGE_KEY = 'ids:sidebarCollapsed';

/** Returns the status color for a feature by its registry id. */
function featureIconColor(featureId: string): string {
  const feature = getFeatureById(featureId);
  return feature ? STATUS_CONFIG[feature.status].color : 'inherit';
}

/** Returns user initials from a display name. */
function getInitials(name?: string | null): string {
  if (!name) {
    return '';
  }
  const names = name.trim().split(/\s+/);
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  const firstInitial = names[0].charAt(0).toUpperCase();
  const lastInitial = names[names.length - 1].charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
}

type NavItem = {
  label: string;
  icon: ReactNode;
  featureId: string;
  route: string | null;
};

type NavCategory = {
  key: string;
  label: string;
  icon: ReactNode;
  items: NavItem[];
};

export function Layout() {
  // --- State ---
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);
  const [hasProfilePhoto, setHasProfilePhoto] = useState(false);
  const [photoCacheBust, setPhotoCacheBust] = useState(() => Date.now());
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);

  // --- Hooks ---
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const {signOut} = useLogto();
  const {userClaims, accessToken} = useAuth();
  const {mode, toggleColorMode} = useColorMode();
  const {t} = useTranslation(['common', 'navigation']);

  // --- Effects ---
  useEffect(() => {
    sessionStorage.setItem('ids_pre_auth_path', routerLocation.pathname + routerLocation.search);
  }, [routerLocation.pathname, routerLocation.search]);

  useEffect(() => {
    if (!accessToken || !userClaims?.sub) {
      return;
    }
    userQueries
      .fetchById({logtoUserId: userClaims.sub, token: accessToken})
      .then((profile) => {
        setHasProfilePhoto(profile.hasProfilePhoto);
      })
      .catch(() => {
        /* ignore - fall back to initials */
      });
  }, [accessToken, userClaims?.sub]);

  useEffect(() => {
    const handler = (e: Event) => {
      const {logtoUserId, hasProfilePhoto: updated, ts} = (e as CustomEvent).detail;
      if (logtoUserId === userClaims?.sub) {
        setHasProfilePhoto(updated);
        setPhotoCacheBust(ts);
      }
    };
    window.addEventListener('profile-photo-changed', handler);
    return () => window.removeEventListener('profile-photo-changed', handler);
  }, [userClaims?.sub]);

  // --- Derived values ---
  const profilePhotoUrl =
    hasProfilePhoto && userClaims?.sub
      ? `${getUserPhotoUrl(userClaims.sub)}?v=${photoCacheBust}`
      : null;
  const userInitials = getInitials(userClaims?.name);
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  // --- Handlers ---
  const handleToggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
    if (next) {
      setExpandedAccordion(false);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleUserSettings = () => {
    handleProfileMenuClose();
    navigate('/user-settings');
  };

  const handleSignOutClick = () => {
    handleProfileMenuClose();
    setSignOutDialogOpen(true);
  };

  const handleSignOutConfirm = () => {
    setSignOutDialogOpen(false);
    signOut(window.location.origin);
  };

  const handleSignOutCancel = () => {
    setSignOutDialogOpen(false);
  };

  const handleNavigate = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(path);
  };

  const handleComingSoon = (label: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setComingSoonFeature(label);
  };

  const handleAccordionChange =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedAccordion(isExpanded ? panel : false);
    };

  /** Checks if a route is the currently active route. */
  const isActiveRoute = (route: string): boolean => {
    return routerLocation.pathname === route;
  };

  // --- Navigation structure ---
  const categories: NavCategory[] = [
    {
      key: 'inventory',
      label: t('navigation:inventory'),
      icon: <InventoryIcon />,
      items: [
        {
          label: t('navigation:partsInventory'),
          icon: <ChecklistIcon color="inherit" />,
          featureId: 'parts-inventory',
          route: '/parts',
        },
        {
          label: t('navigation:unitInventory'),
          icon: <RvHookupIcon color="inherit" />,
          featureId: 'unit-inventory',
          route: null,
        },
        {
          label: t('navigation:ordering'),
          icon: <ShoppingCartCheckoutIcon color="inherit" />,
          featureId: 'ordering',
          route: null,
        },
        {
          label: t('navigation:receiving'),
          icon: <LocalShippingIcon color="inherit" />,
          featureId: 'receiving',
          route: null,
        },
        {
          label: t('navigation:stockAdjustments'),
          icon: <ShelvesIcon color="inherit" />,
          featureId: 'stock-adjustments',
          route: null,
        },
      ],
    },
    {
      key: 'service',
      label: t('navigation:service'),
      icon: <BuildIcon />,
      items: [
        {
          label: t('navigation:scheduler'),
          icon: <EditCalendarIcon color="inherit" />,
          featureId: 'scheduler',
          route: null,
        },
        {
          label: t('navigation:workOrders'),
          icon: <CarRepairIcon color="inherit" />,
          featureId: 'work-orders',
          route: null,
        },
        {
          label: t('navigation:techDispatch'),
          icon: <BusAlertIcon color="inherit" />,
          featureId: 'tech-dispatch',
          route: null,
        },
        {
          label: t('navigation:warrantycentral'),
          icon: <AddModeratorIcon color="inherit" />,
          featureId: 'warranty-central',
          route: null,
        },
      ],
    },
    {
      key: 'partsCounter',
      label: t('navigation:partsCounter'),
      icon: <PointOfSaleIcon />,
      items: [
        {
          label: t('navigation:counterSales'),
          icon: <AddShoppingCartIcon color="inherit" />,
          featureId: 'counter-sales',
          route: null,
        },
        {
          label: t('navigation:serviceCounter'),
          icon: <EngineeringIcon color="inherit" />,
          featureId: 'service-counter',
          route: null,
        },
        {
          label: t('navigation:returnsCores'),
          icon: <AssignmentReturnIcon color="inherit" />,
          featureId: 'returns-cores',
          route: null,
        },
      ],
    },
    {
      key: 'salesFI',
      label: t('navigation:salesFI'),
      icon: <ShoppingCartIcon />,
      items: [
        {
          label: t('navigation:quoteManager'),
          icon: <RequestQuoteIcon color="inherit" />,
          featureId: 'quote-manager',
          route: null,
        },
        {
          label: t('navigation:dealDesk'),
          icon: <CalculateIcon color="inherit" />,
          featureId: 'deal-desk',
          route: null,
        },
        {
          label: t('navigation:fiManager'),
          icon: <AccountBalanceWalletIcon color="inherit" />,
          featureId: 'fi-manager',
          route: null,
        },
        {
          label: t('navigation:deliveryScheduler'),
          icon: <EventAvailableIcon color="inherit" />,
          featureId: 'delivery-scheduler',
          route: null,
        },
        {
          label: t('navigation:consignments'),
          icon: <HandshakeIcon color="inherit" />,
          featureId: 'consignments',
          route: null,
        },
      ],
    },
    {
      key: 'rentals',
      label: t('navigation:rentals'),
      icon: <RentHangingSignIcon />,
      items: [
        {
          label: t('navigation:reservationBoard'),
          icon: <CalendarViewMonthIcon color="inherit" />,
          featureId: 'reservation-board',
          route: null,
        },
        {
          label: t('navigation:checkOut'),
          icon: <LogoutIcon color="inherit" />,
          featureId: 'check-out',
          route: null,
        },
        {
          label: t('navigation:checkIn'),
          icon: <LoginIcon color="inherit" />,
          featureId: 'check-in',
          route: null,
        },
        {
          label: t('navigation:fleetStatus'),
          icon: <DirectionsCarIcon color="inherit" />,
          featureId: 'fleet-status',
          route: null,
        },
        {
          label: t('navigation:rateManagement'),
          icon: <PriceChangeIcon color="inherit" />,
          featureId: 'rate-management',
          route: null,
        },
      ],
    },
    {
      key: 'crm',
      label: t('navigation:crm'),
      icon: <PeopleIcon />,
      items: [
        {
          label: t('navigation:customers'),
          icon: <PeopleIcon color="inherit" />,
          featureId: 'customers',
          route: null,
        },
        {
          label: t('navigation:salesLeads'),
          icon: <QueryStatsIcon color="inherit" />,
          featureId: 'sales-leads',
          route: null,
        },
        {
          label: t('navigation:communication'),
          icon: <ConnectWithoutContactIcon color="inherit" />,
          featureId: 'communication',
          route: null,
        },
        {
          label: t('navigation:tasks'),
          icon: <TaskIcon color="inherit" />,
          featureId: 'tasks',
          route: null,
        },
      ],
    },
    {
      key: 'accounting',
      label: t('navigation:accounting'),
      icon: <AttachMoneyIcon />,
      items: [
        {
          label: t('navigation:generalLedger'),
          icon: <MenuBookIcon color="inherit" />,
          featureId: 'general-ledger',
          route: null,
        },
        {
          label: t('navigation:accountsPayable'),
          icon: <PaymentsIcon color="inherit" />,
          featureId: 'accounts-payable',
          route: null,
        },
        {
          label: t('navigation:accountsReceivable'),
          icon: <ReceiptIcon color="inherit" />,
          featureId: 'accounts-receivable',
          route: null,
        },
        {
          label: t('navigation:cashiering'),
          icon: <AccountBalanceIcon color="inherit" />,
          featureId: 'cashiering',
          route: null,
        },
        {
          label: t('navigation:integrationSync'),
          icon: <SyncIcon color="inherit" />,
          featureId: 'integration-sync',
          route: null,
        },
      ],
    },
    {
      key: 'reportsAnalytics',
      label: t('navigation:reportsAnalytics'),
      icon: <AssessmentIcon />,
      items: [
        {
          label: t('navigation:salesReports'),
          icon: <TrendingUpIcon color="inherit" />,
          featureId: 'sales-reports',
          route: null,
        },
        {
          label: t('navigation:fixedOpsReports'),
          icon: <BuildCircleIcon color="inherit" />,
          featureId: 'fixed-ops-reports',
          route: null,
        },
        {
          label: t('navigation:rentalUtilization'),
          icon: <ShowChartIcon color="inherit" />,
          featureId: 'rental-utilization',
          route: null,
        },
        {
          label: t('navigation:financialStatements'),
          icon: <SummarizeIcon color="inherit" />,
          featureId: 'financial-statements',
          route: null,
        },
      ],
    },
    {
      key: 'admin',
      label: t('navigation:adminSettings'),
      icon: <BusinessIcon />,
      items: [
        {
          label: t('navigation:locations'),
          icon: <AddLocationAltIcon color="inherit" />,
          featureId: 'locations',
          route: '/locations',
        },
        {
          label: t('navigation:users'),
          icon: <BadgeIcon color="inherit" />,
          featureId: 'users',
          route: null,
        },
        {
          label: t('navigation:systemConfig'),
          icon: <ToggleOnIcon color="inherit" />,
          featureId: 'system-config',
          route: null,
        },
        {
          label: t('navigation:integrations'),
          icon: <CodeIcon color="inherit" />,
          featureId: 'integrations',
          route: null,
        },
      ],
    },
  ];

  /** Returns the click handler for a nav item. */
  const getNavItemHandler = (item: NavItem) => {
    if (item.route) {
      return handleNavigate(item.route);
    }
    return handleComingSoon(item.label);
  };

  // --- Render: Nav Item ---
  const renderNavItem = (item: NavItem) => {
    const active = item.route ? isActiveRoute(item.route) : false;
    const handler = getNavItemHandler(item);

    const button = (
      <ListItemButton
        onClick={handler}
        {...(item.route ? {component: Link, to: item.route} : {})}
        sx={{
          minHeight: 32,
          py: 0.25,
          px: collapsed ? 2 : 2.5,
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderLeft: active ? '3px solid' : '3px solid transparent',
          borderLeftColor: active ? 'primary.main' : 'transparent',
          backgroundColor: active ? 'action.selected' : 'transparent',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: collapsed ? 0 : 36,
            mr: collapsed ? 0 : 1,
            justifyContent: 'center',
            color: featureIconColor(item.featureId),
          }}
        >
          {item.icon}
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{variant: 'body2', fontSize: '0.8rem'}}
          />
        )}
      </ListItemButton>
    );

    if (collapsed) {
      return (
        <Tooltip title={item.label} placement="right" key={item.featureId}>
          <ListItem disablePadding>{button}</ListItem>
        </Tooltip>
      );
    }

    return (
      <ListItem disablePadding key={item.featureId}>
        {button}
      </ListItem>
    );
  };

  // --- Render: Category (expanded) ---
  const renderCategoryExpanded = (category: NavCategory) => {
    return (
      <Accordion
        key={category.key}
        expanded={expandedAccordion === category.key}
        onChange={handleAccordionChange(category.key)}
        disableGutters
        elevation={0}
        sx={{
          '&:before': {display: 'none'},
          backgroundColor: 'transparent',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{fontSize: 16}} />}
          sx={{
            minHeight: 34,
            px: 2,
            '& .MuiAccordionSummary-content': {
              my: 0.25,
              alignItems: 'center',
              gap: 1,
            },
          }}
        >
          <Box sx={{display: 'flex', alignItems: 'center', gap: 0.75}}>
            <Box sx={{fontSize: 18, display: 'flex'}}>{category.icon}</Box>
            <Typography variant="body2" sx={{fontWeight: 500, fontSize: '0.8125rem'}}>
              {category.label}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{p: 0}}>
          <List disablePadding dense>
            {category.items.map(renderNavItem)}
          </List>
        </AccordionDetails>
      </Accordion>
    );
  };

  // --- Render: Category (collapsed) ---
  const renderCategoryCollapsed = (category: NavCategory) => {
    return (
      <Tooltip title={category.label} placement="right" key={category.key}>
        <IconButton
          sx={{
            mx: 'auto',
            display: 'flex',
            color: 'text.secondary',
            '&:hover': {color: 'primary.main', backgroundColor: 'action.hover'},
          }}
          aria-label={category.label}
          onClick={() => {
            // When collapsed, clicking a category icon acts on the first item
            const firstItem = category.items[0];
            if (firstItem.route) {
              navigate(firstItem.route);
            } else {
              setComingSoonFeature(firstItem.label);
            }
          }}
        >
          {category.icon}
        </IconButton>
      </Tooltip>
    );
  };

  // --- Render: User profile avatar ---
  const renderAvatar = (size: number) => {
    if (profilePhotoUrl) {
      return <Avatar key={photoCacheBust} src={profilePhotoUrl} sx={{width: size, height: size}} />;
    }
    if (userInitials) {
      return (
        <Avatar
          sx={{
            width: size,
            height: size,
            bgcolor: 'primary.light',
            fontSize: size * 0.4,
            fontWeight: 600,
          }}
        >
          {userInitials}
        </Avatar>
      );
    }
    return <AccountCircleIcon sx={{fontSize: size}} />;
  };

  // --- Render ---
  return (
    <Box sx={{display: 'flex', minHeight: '100vh'}}>
      {/* AppBar — to the right of sidebar */}
      <AppBar
        position="fixed"
        elevation={0}
        enableColorOnDark
        sx={{
          width: `calc(100% - ${sidebarWidth}px)`,
          ml: `${sidebarWidth}px`,
          height: APPBAR_HEIGHT,
          transition: `width ${TRANSITION_DURATION} ease, margin-left ${TRANSITION_DURATION} ease`,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${APPBAR_HEIGHT}px !important`,
            height: APPBAR_HEIGHT,
            px: 2,
          }}
        >
          {/* Location dropdown */}
          <LocationSwitcher />

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{flexGrow: 1, fontWeight: 600, color: 'primary.contrastText'}}
          >
            {t('common:appName')}
          </Typography>

          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton
              aria-label="toggle dark mode"
              color="inherit"
              onClick={toggleColorMode}
              sx={{ml: 1}}
            >
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          <LanguageSwitcher />

          {/* User avatar + profile menu */}
          <Tooltip title={userClaims?.name || t('navigation:userSettings')}>
            <IconButton
              color="inherit"
              onClick={handleProfileMenuOpen}
              aria-label="profile menu"
              sx={{ml: 0.5}}
            >
              {renderAvatar(32)}
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={profileAnchorEl}
            open={Boolean(profileAnchorEl)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
            transformOrigin={{vertical: 'top', horizontal: 'right'}}
          >
            <MenuItem onClick={handleUserSettings}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('navigation:userSettings')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleSignOutClick}>
              <ListItemIcon>
                <PowerSettingsNewIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('navigation:signOut')}</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar — full height with logo */}
      <Drawer
        variant="permanent"
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sidebarWidth,
            boxSizing: 'border-box',
            transition: `width ${TRANSITION_DURATION} ease`,
            overflowX: 'hidden',
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Logo + collapse toggle */}
        <Box
          sx={{
            height: APPBAR_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            flexShrink: 0,
            px: collapsed ? 0 : 2,
          }}
        >
          {collapsed ? (
            <IconButton
              onClick={handleToggleSidebar}
              size="small"
              aria-label="expand sidebar"
              sx={{color: 'text.secondary', '&:hover': {color: 'primary.main'}}}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          ) : (
            <>
              <DmsLogoImage
                width={120}
                sxExtras={mode === 'dark' ? {filter: 'brightness(0) invert(1)'} : {}}
              />
              <IconButton
                onClick={handleToggleSidebar}
                size="small"
                aria-label="collapse sidebar"
                sx={{color: 'text.secondary', '&:hover': {color: 'primary.main'}}}
              >
                <MenuOpenIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>

        <Divider />

        {/* Scrollable nav area */}
        <Box sx={{flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', py: 0.5}}>
          {/* Home */}
          {collapsed ? (
            <Box sx={{display: 'flex', justifyContent: 'center', py: 0.5}}>
              <Tooltip title={t('navigation:home')} placement="right">
                <IconButton
                  onClick={handleNavigate('/')}
                  sx={{
                    color: isActiveRoute('/') ? 'primary.main' : 'text.secondary',
                    backgroundColor: isActiveRoute('/') ? 'action.selected' : 'transparent',
                    '&:hover': {color: 'primary.main', backgroundColor: 'action.hover'},
                  }}
                  aria-label={t('navigation:home')}
                >
                  <HomeIcon />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <List disablePadding dense>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={handleNavigate('/')}
                  sx={{
                    minHeight: 40,
                    px: 2.5,
                    borderLeft: isActiveRoute('/') ? '3px solid' : '3px solid transparent',
                    borderLeftColor: isActiveRoute('/') ? 'primary.main' : 'transparent',
                    backgroundColor: isActiveRoute('/') ? 'action.selected' : 'transparent',
                    '&:hover': {backgroundColor: 'action.hover'},
                  }}
                >
                  <ListItemIcon sx={{minWidth: 36, mr: 1}}>
                    <HomeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('navigation:home')}
                    primaryTypographyProps={{variant: 'body2'}}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          )}

          <Divider sx={{my: 0.5}} />

          {/* Categories */}
          {collapsed ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                py: 0.5,
              }}
            >
              {categories.map(renderCategoryCollapsed)}
            </Box>
          ) : (
            categories.map(renderCategoryExpanded)
          )}
        </Box>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: `${APPBAR_HEIGHT}px`,
          width: `calc(100% - ${sidebarWidth}px)`,
          transition: `width ${TRANSITION_DURATION} ease`,
          minHeight: `calc(100vh - ${APPBAR_HEIGHT}px)`,
        }}
      >
        <NetworkAlert />
        <Outlet />
      </Box>

      {/* Coming Soon Dialog */}
      <ComingSoonDialog
        open={!!comingSoonFeature}
        featureName={comingSoonFeature ?? ''}
        onClose={() => setComingSoonFeature(null)}
      />

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={signOutDialogOpen} onClose={handleSignOutCancel}>
        <DialogTitle>{t('navigation:signOut')}</DialogTitle>
        <DialogContent>
          <Typography>{t('navigation:signOutConfirm')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSignOutCancel} variant="outlined">
            {t('common:no')}
          </Button>
          <Button onClick={handleSignOutConfirm} variant="contained" color="primary">
            {t('navigation:signOutButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/** @deprecated Use the named export `Layout` instead. Kept for backward compatibility with route config. */
export default Layout;
