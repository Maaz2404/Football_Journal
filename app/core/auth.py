# core/auth.py
import jwt
from jwt import PyJWKClient, PyJWKClientError, InvalidTokenError
from functools import lru_cache
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.future import select

from core.config import get_settings
from models.user import User
from core.database import get_db

security = HTTPBearer()
settings = get_settings()

# ---------------------------------------------------------------------------
# Clerk signs its session JWTs with RS256.  The public keys are published at
# the JWKS endpoint below.  PyJWKClient fetches and caches them automatically.
#
# You need TWO env vars (add them to your .env / config):
#   CLERK_JWKS_URL  – e.g. https://<your-slug>.clerk.accounts.dev/.well-known/jwks.json
#   CLERK_ISSUER    – e.g. https://<your-slug>.clerk.accounts.dev
#
# Both values are shown in the Clerk Dashboard → API Keys page.
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _get_jwks_client() -> PyJWKClient:
    """
    Cached JWKS client so we don't re-fetch the public keys on every request.
    PyJWKClient handles key rotation transparently.
    """
    return PyJWKClient(settings.JWKS_URL)


def _verify_clerk_token(token: str) -> dict:
    """
    Verify a Clerk-issued JWT and return its decoded claims.

    Raises HTTPException 401 on any verification failure so callers never
    need to catch low-level jwt errors themselves.
    """
    try:
        client = _get_jwks_client()
        # Fetch the matching public key from the JWKS (uses kid header claim)
        signing_key = client.get_signing_key_from_jwt(token)
    except PyJWKClientError as exc:
        print(f"JWKS_URL={settings.JWKS_URL}")
        try:
            print(f"Available keys: {client.get_jwk_set().keys}")
        except:
            pass
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not fetch Clerk signing key: {exc}",
        )

    try:
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],       # Clerk always uses RS256 – never allow "none"
            issuer=settings.CLERK_FRONTEND_URL,
            options={
                "require": ["sub", "exp", "iat"],   # must be present
                "verify_exp": True,
                "verify_iat": True,
            },
            # NOte: Clerk tokens don't set an `aud` claim by default.
            # If you configure a custom audience in the Clerk Dashboard,
            # uncomment the line below and add CLERK_AUDIENCE to your settings.
            # audience=settings.CLERK_AUDIENCE,
        )
    except jwt.ExpiredSignatureError: 
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
        )
    except jwt.InvalidIssuerError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token issuer is invalid.",
        )
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )

    # Clerk puts the user's Clerk ID in the `sub` claim
    if not claims.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is missing subject claim.",
        )

    return claims


async def get_current_user(
    session: AsyncSession = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """
    FastAPI dependency that:
      1. Extracts the Bearer token from the Authorization header.
      2. Verifies it against Clerk's JWKS endpoint (RS256, exp, iss checks).
      3. Returns the matching User row, auto-creating it on first login.
    """
    claims = _verify_clerk_token(credentials.credentials)
    clerk_user_id: str = claims["sub"]

    # -----------------------------------------------------------------------
    # Upsert the user in your own database.
    # On first login the row won't exist yet – create it transparently.
    # -----------------------------------------------------------------------
    result = await session.execute(
        select(User).where(User.auth_provider_id == clerk_user_id)
    )
    user = result.scalar_one_or_none()

    clerk_username: str | None = claims.get("username")

    if not user:
        user = User(auth_provider_id=clerk_user_id, username=clerk_username)
        session.add(user)
        await session.commit()
        await session.refresh(user)
    elif clerk_username and user.username != clerk_username:
        # Keep local DB in sync with Clerk's username on every request
        user.username = clerk_username
        session.add(user)
        await session.commit()
        await session.refresh(user)

    return user