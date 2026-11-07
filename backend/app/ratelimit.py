import time
from collections import defaultdict, deque
from collections.abc import Callable


class RateLimiter:
    """In-memory sliding-window limiter keyed by client address. Nothing is persisted."""

    def __init__(self, limit: int, window_seconds: int, clock: Callable[[], float] = time.monotonic) -> None:
        self._limit = limit
        self._window = window_seconds
        self._clock = clock
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = self._clock()
        hits = self._hits[key]
        while hits and now - hits[0] >= self._window:
            hits.popleft()
        if len(hits) >= self._limit:
            return False
        hits.append(now)
        return True
