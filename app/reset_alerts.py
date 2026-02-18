from __future__ import annotations

from sqlalchemy import text

from .db import get_session


def main() -> None:
    """
    Delete alerts from the database.

    Right now this deletes ALL alerts, which is handy for testing
    so the daily job will generate a fresh alert (and email) each run.
    """
    with get_session() as session:
        result = session.execute(text("DELETE FROM alerts"))
        session.commit()

    deleted = result.rowcount or 0
    print(f"Deleted {deleted} alert(s).")


if __name__ == "__main__":
    main()
