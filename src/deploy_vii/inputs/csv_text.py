"""One decoding of a CSV file's bytes, shared by the launcher's source reader and the portfolio
export check, so a file the check passes is a file the launcher reads to the same text."""


class CsvDecodeError(ValueError):
    """A CSV file's bytes are neither UTF-8 nor Windows-1252 text."""


def decode_csv_text(raw: bytes) -> str:
    """The text of a CSV file: UTF-8 (a byte-order mark is kept; the caller strips it where it
    must), else strict Windows-1252, what Excel for Windows writes. Raises `CsvDecodeError` for
    bytes that are neither (Windows-1252 leaves five byte values undefined: a file holding one is
    not read as Latin-1, which would turn a damaged file into text)."""
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        pass
    try:
        return raw.decode("cp1252")
    except UnicodeDecodeError as error:
        raise CsvDecodeError("its text is neither UTF-8 nor Windows-1252") from error
