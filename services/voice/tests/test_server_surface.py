"""Dependency-free source contracts; live ASGI inference remains a separate gate."""
import ast
import unittest
from pathlib import Path


class ServerSurfaceTests(unittest.TestCase):
    def test_schema_docs_and_redoc_routes_are_disabled(self):
        tree = ast.parse((Path(__file__).resolve().parents[1] / "server.py").read_text(encoding="utf-8"))
        apps = [node for node in ast.walk(tree) if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "FastAPI"]
        self.assertEqual(len(apps), 1)
        settings = {keyword.arg: ast.literal_eval(keyword.value) for keyword in apps[0].keywords}
        for name in ("docs_url", "redoc_url", "openapi_url"):
            self.assertIsNone(settings[name])
    def test_every_voice_route_authorizes_before_running_work(self):
        tree = ast.parse((Path(__file__).resolve().parents[1] / "server.py").read_text(encoding="utf-8"))
        handlers = [node for node in tree.body if isinstance(node, ast.AsyncFunctionDef) and node.decorator_list]
        self.assertEqual(len(handlers), 4)
        for handler in handlers:
            first = handler.body[0]
            self.assertIsInstance(first, ast.Expr)
            self.assertEqual(first.value.func.id, "authorize")
