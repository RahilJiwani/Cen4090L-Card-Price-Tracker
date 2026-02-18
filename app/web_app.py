import os
from functools import wraps
from typing import Optional

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    flash,
)

from sqlalchemy import text

from .db import get_session
from .alerts import run_alerts
from .load_prices_mtgjson import main as load_prices_main


def create_app() -> Flask:
    app = Flask(
        __name__,
        template_folder="templates",
        static_folder=None,
    )

    # Secret key for sessions; you can override with FLASK_SECRET_KEY in env
    app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-me")

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def login_required(view_func):
        @wraps(view_func)
        def wrapper(*args, **kwargs):
            if "user_id" not in session:
                flash("Please log in with your email first.", "warning")
                return redirect(url_for("index"))
            return view_func(*args, **kwargs)

        return wrapper

    def get_current_user_id() -> Optional[int]:
        return session.get("user_id")

    # ------------------------------------------------------------------
    # Routes
    # ------------------------------------------------------------------

    @app.route("/", methods=["GET", "POST"])
    def index():
        """Email-only login / signup."""
        if request.method == "POST":
            email = (request.form.get("email") or "").strip().lower()
            if not email:
                flash("Please enter a valid email address.", "danger")
                return redirect(url_for("index"))

            with get_session() as db:
                row = db.execute(
                    text("SELECT id, active FROM users WHERE email = :email"),
                    {"email": email},
                ).fetchone()

                if row is None:
                    # Create new user
                    result = db.execute(
                        text(
                            """
                            INSERT INTO users (email, active)
                            VALUES (:email, TRUE)
                            RETURNING id;
                            """
                        ),
                        {"email": email},
                    )
                    user_id = result.fetchone().id
                    db.commit()
                    flash("New user created.", "success")
                else:
                    user_id = row.id
                    if not row.active:
                        db.execute(
                            text(
                                "UPDATE users SET active = TRUE WHERE id = :id"
                            ),
                            {"id": user_id},
                        )
                        db.commit()
                        flash("User reactivated.", "info")

            session["user_id"] = user_id
            session["user_email"] = email
            flash(f"Logged in as {email}", "success")
            return redirect(url_for("dashboard"))

        # GET
        if "user_id" in session:
            return redirect(url_for("dashboard"))

        return render_template("index.html")

    @app.route("/logout")
    def logout():
        session.clear()
        flash("You have been logged out.", "info")
        return redirect(url_for("index"))

    @app.route("/dashboard")
    @login_required
    def dashboard():
        """Show current user's watchlist and recent alerts."""
        user_id = get_current_user_id()

        with get_session() as db:
            watch_rows = db.execute(
                text(
                    """
                    SELECT
                        w.user_id,
                        w.uuid,
                        w.finish,
                        w.pct_drop_threshold,
                        w.max_price,
                        w.lookback_days,
                        w.notes,
                        w.active,
                        c.name,
                        c.set_code,
                        c.collector_number
                    FROM watchlist w
                    JOIN cards c ON c.uuid = w.uuid
                    WHERE w.user_id = :user_id
                    ORDER BY c.name, c.set_code, c.collector_number;
                    """
                ),
                {"user_id": user_id},
            ).fetchall()

            alert_rows = db.execute(
                text(
                    """
                    SELECT
                        a.id,
                        a.price_date,
                        a.latest_price,
                        a.old_price,
                        a.pct_drop,
                        a.lookback_days,
                        a.finish,
                        a.created_at,
                        c.name,
                        c.set_code,
                        c.collector_number
                    FROM alerts a
                    JOIN cards c ON c.uuid = a.uuid
                    WHERE a.user_id = :user_id
                    ORDER BY a.created_at DESC
                    LIMIT 20;
                    """
                ),
                {"user_id": user_id},
            ).fetchall()

        return render_template(
            "dashboard.html",
            watchlist=watch_rows,
            alerts=alert_rows,
            user_email=session.get("user_email"),
        )

    # ------------------------------------------------------------------
    # Watchlist management
    # ------------------------------------------------------------------

    @app.route("/watchlist/search", methods=["GET", "POST"])
    @login_required
    def watchlist_search():
        results = []
        query_name = ""
        query_set = ""

        if request.method == "POST":
            query_name = (request.form.get("name") or "").strip()
            query_set = (request.form.get("set_code") or "").strip()

            if not query_name:
                flash("Please enter part of a card name.", "danger")
            else:
                name_pattern = f"%{query_name}%"
                params = {"name_pattern": name_pattern}

                base_sql = """
                    SELECT
                        uuid,
                        name,
                        set_code,
                        collector_number,
                        tcgplayer_product_id
                    FROM cards
                    WHERE LOWER(name) LIKE LOWER(:name_pattern)
                """

                if query_set:
                    base_sql += " AND LOWER(set_code) = LOWER(:set_code)"
                    params["set_code"] = query_set

                base_sql += """
                    ORDER BY set_code, collector_number
                    LIMIT 50;
                """

                with get_session() as db:
                    results = db.execute(text(base_sql), params).fetchall()

                if not results:
                    flash("No cards found matching your search.", "warning")

        return render_template(
            "watchlist_search.html",
            results=results,
            query_name=query_name,
            query_set=query_set,
        )

    @app.route("/watchlist/add/<uuid_str>", methods=["GET", "POST"])
    @login_required
    def watchlist_add(uuid_str: str):
        user_id = get_current_user_id()
        if user_id is None:
            flash("Please log in first.", "warning")
            return redirect(url_for("index"))

        with get_session() as db:
            card = db.execute(
                text(
                    """
                    SELECT
                        uuid,
                        name,
                        set_code,
                        collector_number
                    FROM cards
                    WHERE uuid = :uuid
                    """
                ),
                {"uuid": uuid_str},
            ).fetchone()

        if card is None:
            flash("Card not found.", "danger")
            return redirect(url_for("watchlist_search"))

        if request.method == "POST":
            finish = (request.form.get("finish") or "normal").strip()
            pct_drop_threshold = float(
                request.form.get("pct_drop_threshold") or 15.0
            )
            max_price = float(request.form.get("max_price") or 40.0)
            lookback_days = int(request.form.get("lookback_days") or 14)
            notes = (request.form.get("notes") or "").strip()

            with get_session() as db:
                db.execute(
                    text(
                        """
                        INSERT INTO watchlist (
                            user_id,
                            uuid,
                            finish,
                            pct_drop_threshold,
                            max_price,
                            lookback_days,
                            notes,
                            active
                        )
                        VALUES (
                            :user_id,
                            CAST(:uuid AS uuid),
                            :finish,
                            :pct_drop_threshold,
                            :max_price,
                            :lookback_days,
                            :notes,
                            TRUE
                        )
                        ON CONFLICT (user_id, uuid, finish)
                        DO UPDATE SET
                            pct_drop_threshold = EXCLUDED.pct_drop_threshold,
                            max_price          = EXCLUDED.max_price,
                            lookback_days      = EXCLUDED.lookback_days,
                            notes              = EXCLUDED.notes,
                            active             = TRUE;
                        """
                    ),
                    {
                        "user_id": user_id,
                        "uuid": uuid_str,
                        "finish": finish,
                        "pct_drop_threshold": pct_drop_threshold,
                        "max_price": max_price,
                        "lookback_days": lookback_days,
                        "notes": notes,
                    },
                )
                db.commit()

            flash(
                f"Watchlist updated for {card.name} [{card.set_code}] #{card.collector_number} ({finish}).",
                "success",
            )
            return redirect(url_for("dashboard"))

        return render_template("watchlist_add.html", card=card)

    @app.route("/watchlist/deactivate/<uuid_str>/<finish>", methods=["POST"])
    @login_required
    def watchlist_deactivate(uuid_str: str, finish: str):
        user_id = get_current_user_id()
        with get_session() as db:
            db.execute(
                text(
                    """
                    UPDATE watchlist
                    SET active = FALSE
                    WHERE user_id = :user_id
                      AND uuid = CAST(:uuid AS uuid)
                      AND finish = :finish;
                    """
                ),
                {"user_id": user_id, "uuid": uuid_str, "finish": finish},
            )
            db.commit()

        flash("Watchlist entry deactivated.", "info")
        return redirect(url_for("dashboard"))

    # ------------------------------------------------------------------
    # Run daily job from the web
    # ------------------------------------------------------------------

    @app.route("/run-daily-job", methods=["POST"])
    @login_required
    def run_daily_job():
        try:
            flash("Starting daily job (this may take a bit)...", "info")
            load_prices_main()
            run_alerts()
            flash(
                "Daily job completed. Any matching alerts have been emailed.",
                "success",
            )
        except Exception as exc:
            flash(f"Error running daily job: {exc}", "danger")

        return redirect(url_for("dashboard"))

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)
