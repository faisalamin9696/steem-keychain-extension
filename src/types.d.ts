declare module 'sscjs';
declare module '@steemit/steem-js';
declare module 'valid-url';
declare module '@steemit/steem-js/lib/auth/memo';
declare module '@steemit/steem-js/lib/auth';
interface Window {
  dataLayer: Array<any>;
  gtag: (a: string, b: any, c?: any) => void;
}

declare module '*.svg' {
  import React = require('react');

  export const ReactComponent: React.SFC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}
