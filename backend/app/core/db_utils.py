
from sqlalchemy import DateTime
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.sql.functions import GenericFunction


class trunc_day(GenericFunction):
    """Cross-database DATE_TRUNC to day granularity."""
    type = DateTime()
    inherit_cache = True


class trunc_hour(GenericFunction):
    """Cross-database DATE_TRUNC to hour granularity."""
    type = DateTime()
    inherit_cache = True


@compiles(trunc_day)
def _trunc_day_default(element, compiler, **kw):
    col = compiler.process(list(element.clauses)[0], **kw)
    return f"date_trunc('day', {col})"


@compiles(trunc_day, "sqlite")
def _trunc_day_sqlite(element, compiler, **kw):
    col = compiler.process(list(element.clauses)[0], **kw)
    return f"strftime('%Y-%m-%d', {col})"


@compiles(trunc_hour)
def _trunc_hour_default(element, compiler, **kw):
    col = compiler.process(list(element.clauses)[0], **kw)
    return f"date_trunc('hour', {col})"


@compiles(trunc_hour, "sqlite")
def _trunc_hour_sqlite(element, compiler, **kw):
    col = compiler.process(list(element.clauses)[0], **kw)
    return f"strftime('%Y-%m-%d %H:00:00', {col})"


def as_date_str(val) -> str:
    """Convert date_trunc result to ISO date string (handles both str and datetime)."""
    if isinstance(val, str):
        return val[:10]
    return val.date().isoformat()


def as_datetime_str(val) -> str:
    """Convert date_trunc result to ISO datetime string (handles both str and datetime)."""
    if isinstance(val, str):
        return val
    return val.isoformat()
