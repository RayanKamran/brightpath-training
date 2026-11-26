import 'i18next';
import type common from './locales/en/common.json';
import type home from './locales/en/home.json';
import type locationSwitcher from './locales/en/locationSwitcher.json';
import type locations from './locales/en/locations.json';
import type navigation from './locales/en/navigation.json';
import type parts from './locales/en/parts.json';
import type signIn from './locales/en/sign-in.json';
import type userSettings from './locales/en/userSettings.json';
import type users from './locales/en/users.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      home: typeof home;
      locationSwitcher: typeof locationSwitcher;
      locations: typeof locations;
      navigation: typeof navigation;
      parts: typeof parts;
      'sign-in': typeof signIn;
      userSettings: typeof userSettings;
      users: typeof users;
    };
  }
}
