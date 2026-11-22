"""Dependency-free request authorization for an optionally local-only voice service."""
import ipaddress
import secrets


def authorize_voice_client(token, authorization, client_host):
    secret = (token or "").strip()
    if secret:
        if not secrets.compare_digest(authorization or "", "Bearer " + secret):
            raise PermissionError("Unauthorized")
        return
    try:
        address = ipaddress.ip_address(client_host or "")
        loopback = address.is_loopback or bool(getattr(address, "ipv4_mapped", None) and address.ipv4_mapped.is_loopback)
    except ValueError:
        loopback = False
    if not loopback:
        raise PermissionError("VOICE_SERVICE_TOKEN is required for non-loopback clients")
