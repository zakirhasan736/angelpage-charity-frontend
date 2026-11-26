export type Locale = 'en' | 'fr';

export const LOCALE_COOKIE = 'angelpage-locale';

const en = {
  lang: {
    label: 'Language',
    en: 'EN',
    fr: 'FR',
  },
  nav: {
    sell: 'Sell an item',
    secureCheckout: 'Secure checkout',
    search: 'Search',
  },
  card: {
    add: 'Add to basket',
    added: 'Added',
    toCharity: '{amount} to charity',
    sellerKeeps: 'Seller keeps {percent}%',
    addedToast: 'Added to your basket.',
    failedToast: 'Could not add this item to your basket.',
    favouriteIn: 'Save',
    ships: 'Ships USA, Canada & UK',
    personal: 'Personal delivery',
    collect: 'Collection only',
    local: 'Local: {areas}',
    limited: 'Limited areas',
  },
  footer: {
    howItWorks: 'How it works',
    blog: 'Blog',
    events: 'Events',
    products: 'Products',
    faq: 'FAQ',
    privacy: 'Privacy policy',
    cookies: 'Cookie policy',
    terms: 'Terms of use',
    joinTitle: 'Join the Angelpage community',
    joinBody:
      'Be part of a community that values giving back. Sign up for updates on our impact, exclusive offers, and tips for your next purchase.',
    emailPlaceholder: 'Enter email',
    subscribe: 'Subscribe',
    submitting: 'Submitting...',
    subscribed: 'Subscribed',
    support: 'Platform support',
    contact: 'Contact us',
    admin: 'Admin login',
    emailRequired: 'Please enter an email address.',
    subscribedOk: 'Subscription successful. Check your inbox.',
    already: 'This email is already subscribed.',
  },
  market: {
    residents:
      'Angelpage starts in the United States. We also sell in Canada and the United Kingdom.',
    shippingOnly:
      'Angelpage ships to the United States, Canada, and the United Kingdom.',
    billingOnly:
      'Billing address must be in the United States, Canada, or the United Kingdom.',
    country: 'Country',
    unitedStates: 'United States',
    canada: 'Canada',
    unitedKingdom: 'United Kingdom',
  },
  cart: {
    title: 'Your basket',
    empty: 'Your basket is empty.',
    charity: 'Charity',
    remove: 'Remove',
    affiliate: 'Partner items',
    affiliateNote: 'These check out on the partner site.',
    affiliateCheckout: 'Partner checkout',
    total: 'Total',
    taxNote: 'Tax and shipping are calculated at checkout.',
    checkout: 'Checkout',
    browse: 'Continue shopping',
  },
  prefs: {
    title: 'Choose your market',
    body: 'Tell us where you shop and which language you prefer. Both are optional.',
    country: 'Country',
    language: 'Language',
    optional: '(optional)',
    choose: 'Select',
    continue: 'Continue',
  },
  cookies: {
    title: 'We value your privacy',
    body: 'We use cookies to run the shop, remember your settings and, with your OK, measure visits and ads. You choose what is on.',
    gpc: 'Your browser sent a privacy signal, so marketing cookies stay off.',
    accept: 'Accept all',
    reject: 'Reject all',
    customize: 'Manage choices',
    save: 'Save my choices',
    necessary: 'Strictly necessary',
    necessaryBody:
      'Sign-in, basket, secure checkout, fraud checks, language, your market and this choice. The site cannot work without them.',
    preferences: 'Preferences',
    preferencesBody:
      'Remembers things like recently viewed items and layout choices between visits.',
    analytics: 'Analytics',
    analyticsBody:
      'Google Analytics 4 tells us which pages help people find causes and items, using pseudonymous IDs.',
    marketing: 'Marketing',
    marketingBody:
      'Measures our ads (for example Google Ads) and shows Angelpage ads on other sites. Partner links to eBay or Amazon still work if this is off.',
    alwaysOn: 'Always on',
    used: 'What we use',
    policy: 'Cookie policy',
    settings: 'Cookie settings',
    open: 'Cookie settings',
    close: 'Close',
    dialogTitle: 'Your cookie choices',
    dialogBody:
      'Turn each kind on or off. You can change this at any time from the cookie button in the corner of every page.',
    saved: 'Your cookie choices are saved.',
    lastUpdated: 'Saved',
  },
};

const fr: typeof en = {
  lang: {
    label: 'Langue',
    en: 'EN',
    fr: 'FR',
  },
  nav: {
    sell: 'Vendre un article',
    secureCheckout: 'Paiement sécurisé',
    search: 'Rechercher',
  },
  card: {
    add: 'Ajouter au panier',
    added: 'Ajouté',
    toCharity: '{amount} pour l’organisme',
    sellerKeeps: 'Le vendeur garde {percent} %',
    addedToast: 'Article ajouté à votre panier.',
    failedToast: 'Impossible d’ajouter cet article au panier.',
    favouriteIn: 'Enregistrer',
    ships: 'Livraison États-Unis, Canada et R.-U.',
    personal: 'Livraison en personne',
    collect: 'Retrait seulement',
    local: 'Local : {areas}',
    limited: 'Zones limitées',
  },
  footer: {
    howItWorks: 'Comment ça marche',
    blog: 'Blogue',
    events: 'Événements',
    products: 'Produits',
    faq: 'FAQ',
    privacy: 'Politique de confidentialité',
    cookies: 'Politique de cookies',
    terms: 'Conditions d’utilisation',
    joinTitle: 'Rejoignez la communauté Angelpage',
    joinBody:
      'Faites partie d’une communauté qui redonne. Inscrivez-vous pour suivre notre impact, les offres exclusives et des conseils pour votre prochain achat.',
    emailPlaceholder: 'Entrez votre courriel',
    subscribe: 'S’abonner',
    submitting: 'Envoi...',
    subscribed: 'Abonné',
    support: 'Assistance',
    contact: 'Nous joindre',
    admin: 'Connexion admin',
    emailRequired: 'Veuillez entrer une adresse courriel.',
    subscribedOk: 'Abonnement confirmé. Vérifiez votre boîte de réception.',
    already: 'Ce courriel est déjà abonné.',
  },
  market: {
    residents:
      'Angelpage commence aux États-Unis. Nous vendons aussi au Canada et au Royaume-Uni.',
    shippingOnly:
      'Angelpage livre aux États-Unis, au Canada et au Royaume-Uni.',
    billingOnly:
      'L’adresse de facturation doit être aux États-Unis, au Canada ou au Royaume-Uni.',
    country: 'Pays',
    unitedStates: 'États-Unis',
    canada: 'Canada',
    unitedKingdom: 'Royaume-Uni',
  },
  cart: {
    title: 'Votre panier',
    empty: 'Votre panier est vide.',
    charity: 'Organisme',
    remove: 'Retirer',
    affiliate: 'Articles partenaires',
    affiliateNote: 'Le paiement se fait sur le site partenaire.',
    affiliateCheckout: 'Paiement partenaire',
    total: 'Total',
    taxNote: 'Les taxes et la livraison sont calculées au paiement.',
    checkout: 'Payer',
    browse: 'Continuer vos achats',
  },
  prefs: {
    title: 'Choisissez votre marché',
    body: 'Indiquez où vous magasinez et la langue que vous préférez. Les deux sont facultatifs.',
    country: 'Pays',
    language: 'Langue',
    optional: '(facultatif)',
    choose: 'Choisir',
    continue: 'Continuer',
  },
  cookies: {
    title: 'Votre vie privée compte',
    body: 'Nous utilisons des cookies pour faire fonctionner la boutique, retenir vos réglages et, avec votre accord, mesurer les visites et les publicités. Vous choisissez.',
    gpc: 'Votre navigateur a envoyé un signal de confidentialité : les cookies marketing restent désactivés.',
    accept: 'Tout accepter',
    reject: 'Tout refuser',
    customize: 'Gérer mes choix',
    save: 'Enregistrer mes choix',
    necessary: 'Strictement nécessaires',
    necessaryBody:
      'Connexion, panier, paiement sécurisé, lutte contre la fraude, langue, votre marché et ce choix. Le site ne fonctionne pas sans eux.',
    preferences: 'Préférences',
    preferencesBody:
      'Retient par exemple les articles consultés récemment et vos choix d’affichage entre deux visites.',
    analytics: 'Analyse',
    analyticsBody:
      'Google Analytics 4 nous indique quelles pages aident à trouver des causes et des articles, avec des identifiants pseudonymes.',
    marketing: 'Marketing',
    marketingBody:
      'Mesure nos publicités (par exemple Google Ads) et affiche des publicités Angelpage sur d’autres sites. Les liens partenaires eBay ou Amazon fonctionnent même si c’est désactivé.',
    alwaysOn: 'Toujours actifs',
    used: 'Ce que nous utilisons',
    policy: 'Politique de cookies',
    settings: 'Réglages des cookies',
    open: 'Réglages des cookies',
    close: 'Fermer',
    dialogTitle: 'Vos choix de cookies',
    dialogBody:
      'Activez ou désactivez chaque type. Vous pouvez changer d’avis à tout moment avec le bouton cookie en bas de chaque page.',
    saved: 'Vos choix de cookies sont enregistrés.',
    lastUpdated: 'Enregistré le',
  },
};

export const messages = { en, fr };

export type MessageTree = typeof en;

export function translate(
  locale: Locale,
  path: string,
  vars?: Record<string, string | number>
) {
  const parts = path.split('.');
  let node: unknown = messages[locale];
  for (const part of parts) {
    if (!node || typeof node !== 'object') return path;
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node !== 'string') return path;
  if (!vars) return node;
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    node
  );
}
