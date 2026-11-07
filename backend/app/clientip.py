import ipaddress

from fastapi import Request


def client_key(request: Request, header: str = "") -> str:
    """Key for per-client rate limiting.

    By default this is the socket address. Behind a hosting proxy that overwrites a header with the
    real client address (the name is set in CLIENT_IP_HEADER), that header is used instead, but only
    when its value is a valid IP address; anything else falls back to the socket address.
    """
    if header:
        raw = request.headers.get(header, "").strip()
        try:
            return str(ipaddress.ip_address(raw))
        except ValueError:
            pass
    return request.client.host if request.client else "unknown"
