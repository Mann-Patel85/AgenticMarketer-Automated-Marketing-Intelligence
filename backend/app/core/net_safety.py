"""
AgenticMarketer Backend — Outbound request safety (SSRF protection).

Any URL that comes from a user (SEO audit target, custom webhook) must go through
`safe_request`, which only allows http(s) URLs whose hostname resolves exclusively
to public internet addresses, and re-validates every redirect hop. This blocks
requests to localhost, private networks and cloud metadata endpoints
(e.g. 169.254.169.254).
"""

import asyncio
import ipaddress
import socket
import urllib.parse

import httpx


class UnsafeURLError(ValueError):
    """Raised when a user-supplied URL points somewhere we refuse to fetch."""


async def assert_public_url(url: str) -> str:
    """Validates that `url` is http(s) and resolves only to public IPs. Returns the URL."""
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise UnsafeURLError("Only http:// and https:// URLs are allowed.")
    host = parsed.hostname
    if not host:
        raise UnsafeURLError("URL is missing a hostname.")

    try:
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
    except ValueError:
        raise UnsafeURLError("URL has an invalid port.")

    try:
        infos = await asyncio.get_running_loop().getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except socket.gaierror:
        raise UnsafeURLError(f"Could not resolve host '{host}'.")

    for info in infos:
        ip = ipaddress.ip_address(info[4][0].split("%", 1)[0])
        if not ip.is_global or ip.is_multicast:
            raise UnsafeURLError(f"Requests to private or internal addresses are not allowed ('{host}').")
    return url


async def safe_request(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    *,
    max_redirects: int = 5,
    **kwargs,
) -> httpx.Response:
    """Performs a request, validating the initial URL and each redirect target.

    The client should be created with follow_redirects=False (the default);
    redirects are followed here manually so each hop can be checked.
    """
    current = url
    for _ in range(max_redirects + 1):
        await assert_public_url(current)
        resp = await client.request(method, current, follow_redirects=False, **kwargs)
        if resp.is_redirect and resp.headers.get("location"):
            current = urllib.parse.urljoin(str(resp.url), resp.headers["location"])
            if resp.status_code in (301, 302, 303):
                method, kwargs = "GET", {k: v for k, v in kwargs.items() if k not in ("json", "data", "content")}
            continue
        return resp
    raise UnsafeURLError("Too many redirects.")
