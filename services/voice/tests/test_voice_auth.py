from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from voice_auth import authorize_voice_client


class LocalServiceAuthTests(unittest.TestCase):
    def test_unconfigured_token_allows_only_loopback_addresses(self):
        for host in ["127.0.0.1", "127.0.0.2", "::1", "::ffff:127.0.0.1"]:
            authorize_voice_client("", None, host)
        for host in ["192.168.1.10", "203.0.113.5", "::", "0.0.0.0", "localhost.attacker.example", None]:
            with self.assertRaises(PermissionError):
                authorize_voice_client("", None, host)

    def test_configured_token_requires_an_exact_match_even_for_local_requests(self):
        for header in [None, "", "Bearer wrong", "Basic installed-secret"]:
            with self.assertRaises(PermissionError):
                authorize_voice_client("installed-secret", header, "127.0.0.1")
        authorize_voice_client("installed-secret", "Bearer installed-secret", "203.0.113.5")

    def test_blank_whitespace_token_does_not_enable_remote_access(self):
        with self.assertRaises(PermissionError):
            authorize_voice_client("  ", "Bearer  ", "192.168.1.10")


if __name__ == "__main__":
    unittest.main()
