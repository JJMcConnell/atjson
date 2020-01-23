function without<T>(array: T[], value: T): T[] {
  let presentParts: T[] = [];
  for (let part of array) {
    if (part !== value) {
      presentParts.push(part);
    }
  }

  return presentParts;
}

interface IUrl {
  protocol: string;
  host: string;
  pathname: string;
  hash: string;
  searchParams: { [key: string]: string } | URLSearchParams;
}

function getSearchParam(
  searchParams: { [key: string]: string } | URLSearchParams,
  name: string
) {
  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(name);
  }
  return searchParams[name];
}

function toURL(url: IUrl) {
  let protocol = url.protocol.replace(":", "");
  let result = new URL(`${protocol}://${url.host}`);

  result.pathname = url.pathname;
  result.hash = url.hash;
  for (let param in url.searchParams) {
    let value = getSearchParam(url.searchParams, param);
    if (value) {
      result.searchParams.set(param, value);
    }
  }
  return result.href;
}

function isYouTubeURL(url: IUrl) {
  return isYouTubeEmbedURL(url) || isYouTubeWatchURL(url);
}

// Youtube embed code
// - youtu.be/
// - youtube-nocookie.com/embed/
// - youtube.com/embed
function isYouTubeEmbedURL(url: IUrl) {
  return (
    url.host === "youtu.be" ||
    (["www.youtube-nocookie.com", "www.youtube.com"].includes(url.host) &&
      url.pathname.startsWith("/embed/"))
  );
}

// Youtube watch URLs
// - www.youtube.com/watch?v=
// - m.youtube.com/watch?v=
// - youtube.com/watch?v=
function isYouTubeWatchURL(url: IUrl) {
  return (
    ["www.youtube.com", "m.youtube.com", "youtube.com"].includes(url.host) &&
    url.pathname.startsWith("/watch") &&
    getSearchParam(url.searchParams, "v") !== null
  );
}

function normalizeYouTubeURL(url: IUrl) {
  let normalized =
    url.host === "www.youtube-nocookie.com"
      ? new URL("https://www.youtube-nocookie.com")
      : new URL("https://www.youtube.com");

  let timestamp = getSearchParam(url.searchParams, "t");
  if (timestamp) {
    normalized.searchParams.set("t", timestamp);
  }

  if (isYouTubeEmbedURL(url)) {
    let parts = without<string>(url.pathname.split("/"), "");
    let id = parts.pop();
    normalized.pathname = `/embed/${id}`;

    let controls = getSearchParam(url.searchParams, "controls");
    if (controls) {
      normalized.searchParams.set("controls", controls);
    }
  } else {
    normalized.pathname = `/embed/${getSearchParam(url.searchParams, "v")}`;
  }

  return normalized.href;
}

// Dailymotion URLs
// - https://www.dailymotion.com/video/:id
function isDailymotionURL(url: IUrl) {
  return (
    url.host?.match(/^[^.]*\.dailymotion\.com/) &&
    (url.pathname?.startsWith("/video") ||
      url.pathname?.match(/^\/[^\\]*\/video\//))
  );
}

function normalizeDailymotionURL(url: IUrl) {
  let normalized = new URL("https://www.dailymotion.com");
  for (let param in url.searchParams) {
    let value = getSearchParam(url.searchParams, param);
    if (value) {
      normalized.searchParams.set(param, value);
    }
  }

  let parts = without<string>(url.pathname.split("/"), "");
  let part = parts.shift();
  while (part !== "video") {
    part = parts.shift();
  }
  let id = parts.shift();
  normalized.pathname = `/embed/video/${id}`;

  return normalized.href;
}

// Vimeo URLs
// - https://vimeo.com/:id
// - https://www.vimeo.com/m/#/:id
// - https://player.vimeo.com/embed/
function isVimeoURL(url: IUrl) {
  return (
    url.host === "vimeo.com" ||
    url.host === "player.vimeo.com" ||
    url.host === "www.vimeo.com"
  );
}

function isVimeoEmbedURL(url: IUrl) {
  return url.host === "player.vimeo.com";
}

function normalizeVimeoURL(url: IUrl) {
  if (isVimeoEmbedURL(url)) {
    // Enforce https ~
    url.protocol = "https";
    return toURL(url);
  }
  let normalized = new URL("https://player.vimeo.com");
  let parts = without<string>(url.pathname.split("/"), "");
  let id = parts.shift();
  normalized.pathname = `/video/${id}`;

  return normalized.href;
}

// Brightcove URLs
// - https://players.brightcove.com/
// - https://bcove.video
// - https://bcove.me
function isBrightcoveURL(url: IUrl) {
  return (
    url.host === "players.brightcove.net" ||
    url.host === "bcove.video" ||
    url.host === "bcove.me"
  );
}

export function identify(url: IUrl) {
  if (isYouTubeURL(url)) {
    return normalizeYouTubeURL(url);
  }

  if (isVimeoURL(url)) {
    return normalizeVimeoURL(url);
  }

  if (isDailymotionURL(url)) {
    return normalizeDailymotionURL(url);
  }

  if (isBrightcoveURL(url)) {
    return toURL(url);
  }

  return null;
}
