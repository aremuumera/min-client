// import { getSiteURL } from '@/lib/get-site-url';
// import { LogLevel } from '@/lib/logger';

// const palettes = {
//   chateauGreen,
// };

// Check if running in production
const isProduction = process.env.NODE_ENV === 'production';

export const API_HOSTNAME = isProduction
  ? process.env.NEXT_PUBLIC_API_URL || 'https://api.minmeg.com/api'
  : 'http://127.0.0.1:8081/api';

// export const API_HOSTNAME = 'https://api.minmeg.com/api';
// export const WEB_URL = 'https://d-minmeg.vercel.app/';

export const WEB_URL = 'https://www.minmeg.com/';

// export const API_HOSTNAME = 'https://minmeg-server-166643862a3a.herokuapp.com/api';

export const config = {
  site: {
    name: 'MinMeg',
    description: '',
    colorScheme: 'light',
    themeColor: '#16b364',
    primaryColor: 'chateauGreen',
    // palette: {
    //   primary:  palettes.chateauGreen,
    // },
    // url: getSiteURL(),
    instagram: 'https://www.instagram.com/minmmeg?igsh=MWl2emh0dXk1a24ydQ==',
    twitter: 'https://x.com/minmmeg?s=21',
    facebook: 'https://www.facebook.com/profile.php?id=61580639941262',
    linkedin: 'https://www.linkedin.com/company/minmeg/',
    // youtube: 'https://www.youtube.com/@minmeg-global',
    version: process.env.NEXT_PUBLIC_SITE_VERSION || '0.0.0',
  },
  // logLevel: (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || LogLevel.ALL,
  auth: { strategy: process.env.NEXT_PUBLIC_AUTH_STRATEGY },
  // auth0: { domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN, clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID },

  mapbox: { apiKey: process.env.NEXT_PUBLIC_MAPBOX_API_KEY },
  gtm: { id: process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID },
};
