"""Sealed display examples for the disposable branch control test."""
import sys
from html.parser import HTMLParser
from pathlib import Path


class Display(HTMLParser):
    def __init__(self):
        super().__init__()
        self.values = {}
        self.field = None

    def handle_starttag(self, tag, attrs):
        self.field = dict(attrs).get("data-case")

    def handle_endtag(self, tag):
        self.field = None

    def handle_data(self, data):
        if self.field:
            self.values[self.field] = data


page = Display()
page.feed(Path(sys.argv[1]).read_text())
expected = {"missing": "No prior observation", "zero": "0"}
if page.values != expected:
    raise SystemExit(f"Expected {expected}, browser displayed {page.values}")
print(page.values)
