// A separate tiny Worker redirects www without running the app Worker for every
// static asset request. Preserve the path and query; never redirect arbitrary hosts.
export default {
  fetch(request) {
    const url = new URL(request.url);
    if (url.hostname !== 'www.vivlica.com') return new Response('Not found', { status: 404 });
    url.protocol = 'https:';
    url.hostname = 'vivlica.com';
    url.port = '';
    return Response.redirect(url.href, 308);
  },
};
