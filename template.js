const sendHttpRequest = require('sendHttpRequest');
const JSON = require('JSON');
const getEventData = require('getEventData');
const getAllEventData = require('getAllEventData');
const getCookieValues = require('getCookieValues');
const setCookie = require('setCookie');
const getRequestHeader = require('getRequestHeader');
const logToConsole = require('logToConsole');
const generateRandom = require('generateRandom');
const parseUrl = require('parseUrl');
const getType = require('getType');
const makeString = require('makeString');
const makeInteger = require('makeInteger');
const computeEffectiveTldPlusOne = require('computeEffectiveTldPlusOne');
const encodeUri = require('encodeUri');

/*==============================================================================
==============================================================================*/

const ANON_COOKIE_KEY = 'sp__anon_id';
const USER_COOKIE_KEY = 'sp__user_id';
const COOKIE_EXPIRY_DAYS = 365;

const eventData = getAllEventData();
const useOptimisticScenario = isUIFieldTrue(data.useOptimisticScenario);

if (!isConsentGivenOrNotRequired(data, eventData)) {
  return data.gtmOnSuccess();
}

const url = getUrl(eventData);
if (url && url.lastIndexOf('https://gtm-msr.appspot.com/', 0) === 0) {
  return data.gtmOnSuccess();
}

const methodType = data.methodType;

switch (methodType) {
  case 'page':
    handlePage();
    break;
  case 'identify':
    handleIdentify();
    break;
  case 'track':
    handleTrack();
    break;
  case 'group':
    handleGroup();
    break;
  default:
    return data.gtmOnFailure();
}

if (useOptimisticScenario) {
  return data.gtmOnSuccess();
}

/*==============================================================================
  Vendor related functions
==============================================================================*/

function extractCampaign(url) {
  const campaign = {};

  if (!url) return campaign;

  const parsedUrl = parseUrl(url);
  if (!parsedUrl || !parsedUrl.searchParams) return campaign;

  if (parsedUrl.searchParams.utm_source) {
    campaign.source = parsedUrl.searchParams.utm_source;
  }
  if (parsedUrl.searchParams.utm_medium) {
    campaign.medium = parsedUrl.searchParams.utm_medium;
  }
  if (parsedUrl.searchParams.utm_campaign) {
    campaign.name = parsedUrl.searchParams.utm_campaign; // Note: maps to 'name'
  }
  if (parsedUrl.searchParams.utm_term) {
    campaign.term = parsedUrl.searchParams.utm_term;
  }
  if (parsedUrl.searchParams.utm_content) {
    campaign.content = parsedUrl.searchParams.utm_content;
  }

  return campaign;
}

function buildPageContext() {
  const pageLocation = getEventData('page_location') || '';
  const parsedUrl = parseUrl(pageLocation);

  return {
    path: parsedUrl ? parsedUrl.pathname : '',
    referrer: getEventData('page_referrer') || '',
    search: parsedUrl ? parsedUrl.search : '',
    title: getEventData('page_title') || '',
    url: pageLocation
  };
}

function buildBasePayload(method) {
  const pageContext = buildPageContext();

  return {
    type: method,
    context: {
      timezone: getEventData('ga_session_data.timezone') || getEventData('timezone') || 'UTC',
      campaign: extractCampaign(pageContext.url),
      userAgent: getEventData('user_agent') || getRequestHeader('user-agent') || '',
      page: pageContext,
      locale: getEventData('language') || getEventData('user_properties.language') || null
    },
    userId: getStoredUserId() || getEventData('user_id') || null,
    anonymousId: getOrCreateAnonymousId(),
    writeKey: data.workspaceId
  };
}

function handlePage() {
  const payload = buildBasePayload('page');

  const pageLocation = getEventData('page_location') || '';
  const pageTitle = getEventData('page_title') || '';
  const parsedUrl = parseUrl(pageLocation);

  const screenResolution = getEventData('screen_resolution') || '';
  let width = null;
  let height = null;

  if (screenResolution && screenResolution.indexOf('x') > -1) {
    const dimensions = screenResolution.split('x');
    width = makeInteger(dimensions[0]);
    height = makeInteger(dimensions[1]);
  }

  payload.properties = {
    title: pageTitle,
    url: pageLocation,
    path: parsedUrl ? parsedUrl.pathname : '',
    hash: parsedUrl ? parsedUrl.hash || '' : '',
    search: parsedUrl ? parsedUrl.search : '',
    width: width,
    height: height
  };

  return sendToSpectacle('/p', payload);
}

function handleIdentify() {
  const payload = buildBasePayload('identify');
  const traits = {};

  const userId = data.userId || getEventData('user_id') || getEventData('user_data.email_address');
  if (userId) {
    payload.userId = makeString(userId);
    if (
      userId !== getEventData('user_data.email_address') ||
      !data.doNotSaveUserEmailAsUserIdCookie
    ) {
      storeUserId(payload.userId);
    }
  }

  const email =
    data.email || getEventData('user_data.email_address') || getEventData('user_properties.email');
  if (email) traits.email = email;

  const firstName =
    data.firstName ||
    getEventData('user_data.first_name') ||
    getEventData('user_properties.first_name');
  if (firstName) traits.firstName = firstName;

  const lastName =
    data.lastName ||
    getEventData('user_data.last_name') ||
    getEventData('user_properties.last_name');
  if (lastName) traits.lastName = lastName;

  const phone =
    data.phone || getEventData('user_data.phone_number') || getEventData('user_properties.phone');
  if (phone) traits.phone = phone;

  if (getType(data.userTraits) === 'array') {
    for (let i = 0; i < data.userTraits.length; i++) {
      const trait = data.userTraits[i];
      if (trait.key && trait.value) {
        traits[trait.key] = trait.value;
      }
    }
  }

  payload.traits = traits;

  return sendToSpectacle('/i', payload);
}

function handleTrack() {
  const payload = buildBasePayload('track');

  const eventName = data.eventName || getEventData('event_name');
  if (!eventName) {
    log({
      Name: 'SpectacleServerTag',
      Type: 'Message',
      EventName: payload.type,
      Message: '🛑 [ERROR] Request was not sent.',
      Reason: 'No event name provided for track call'
    });
    return data.gtmOnFailure();
  }

  payload.event = eventName;

  const properties = {};

  if (data.revenue) {
    properties.revenue = data.revenue;
  }

  if (data.currency) {
    properties.currency = data.currency;
  }

  if (getType(data.eventProperties) === 'array') {
    for (let i = 0; i < data.eventProperties.length; i++) {
      const prop = data.eventProperties[i];
      if (prop.key && prop.value) {
        properties[prop.key] = prop.value;
      }
    }
  }

  payload.properties = properties;

  return sendToSpectacle('/t', payload);
}

function handleGroup() {
  const payload = buildBasePayload('group');

  const groupId = data.groupId || getEventData('group_id');
  if (!groupId) {
    log({
      Name: 'SpectacleServerTag',
      Type: 'Message',
      EventName: payload.type,
      Message: '🛑 [ERROR] Request was not sent.',
      Reason: 'No event name provided for group call'
    });
    return data.gtmOnFailure();
  }

  payload.groupId = makeString(groupId);

  const traits = {};

  if (getType(data.groupTraits) === 'array') {
    for (let i = 0; i < data.groupTraits.length; i++) {
      const trait = data.groupTraits[i];
      if (trait.key && trait.value) {
        traits[trait.key] = trait.value;
      }
    }
  }

  payload.traits = traits;

  return sendToSpectacle('/g', payload);
}

function sendToSpectacle(endpoint, payload) {
  const url = encodeUri(data.baseUrl) + endpoint;
  const options = {
    headers: {
      'Content-Type': 'text/plain',
      'User-Agent': payload.context.userAgent
    },
    method: 'POST'
  };

  sendHttpRequest(url, options, JSON.stringify(payload))
    .then((result) => {
      if (!useOptimisticScenario) {
        if (result.statusCode >= 200 && result.statusCode < 300) {
          data.gtmOnSuccess();
        } else {
          data.gtmOnFailure();
        }
      }
    })
    .catch((error) => {
      if (!useOptimisticScenario) data.gtmOnFailure();
    });
}

function getOrCreateAnonymousId() {
  let anonymousId;

  const anonCookieValues = getCookieValues(ANON_COOKIE_KEY);
  if (anonCookieValues && anonCookieValues.length > 0) {
    anonymousId = anonCookieValues[0];
  }

  if (!anonymousId) {
    anonymousId = generateAnonymousId();
  }

  setCookie(ANON_COOKIE_KEY, anonymousId, {
    domain: getCookieDomain(data.cookieDomain),
    path: '/',
    'max-age': COOKIE_EXPIRY_DAYS * 24 * 60 * 60,
    secure: true,
    sameSite: 'lax'
  });

  return anonymousId;
}

function getStoredUserId() {
  const userCookieValues = getCookieValues(USER_COOKIE_KEY);
  if (userCookieValues && userCookieValues.length > 0) {
    return userCookieValues[0];
  }
  return null;
}

function storeUserId(userId) {
  if (userId) {
    setCookie(USER_COOKIE_KEY, makeString(userId), {
      domain: getCookieDomain(data.cookieDomain),
      path: '/',
      'max-age': COOKIE_EXPIRY_DAYS * 24 * 60 * 60,
      secure: true,
      sameSite: 'lax'
    });
  }
}

/*==============================================================================
  Helpers
==============================================================================*/

function getUrl(eventData) {
  return eventData.page_location || eventData.page_referrer || getRequestHeader('referer');
}

function getCookieDomain(cookieDomain) {
  if (cookieDomain) return cookieDomain[0] !== '.' ? '.' + cookieDomain : cookieDomain;
  return (
    computeEffectiveTldPlusOne(getEventData('page_location') || getRequestHeader('referer')) ||
    'auto'
  );
}

function generateAnonymousId() {
  // Generate segments for UUID format
  const seg1 = generateRandom(10000000, 99999999);
  const seg2 = generateRandom(1000, 9999);
  const seg3 = generateRandom(1000, 9999);
  const seg4 = generateRandom(1000, 9999);
  const seg5 = generateRandom(100000000000, 999999999999);

  return seg1 + '-' + seg2 + '-' + seg3 + '-' + seg4 + '-' + seg5;
}

function isUIFieldTrue(field) {
  return [true, 'true', 1, '1'].indexOf(field) !== -1;
}

function isConsentGivenOrNotRequired(data, eventData) {
  if (data.adStorageConsent !== 'required') return true;
  if (eventData.consent_state) return !!eventData.consent_state.ad_storage;
  const xGaGcs = eventData['x-ga-gcs'] || ''; // x-ga-gcs is a string like "G110"
  return xGaGcs[2] === '1';
}

function log(rawDataToLog) {
  rawDataToLog.TraceId = getRequestHeader('trace-id');
  logToConsole(JSON.stringify(rawDataToLog));
}
