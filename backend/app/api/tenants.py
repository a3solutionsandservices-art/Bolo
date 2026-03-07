from __future__ import annotations
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.middleware.auth import get_current_user, require_admin
from app.models.tenant import Tenant
from app.models.user import User

router = APIRouter(prefix="/tenants", tags=["tenants"])


class UpdateTenantRequest(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    widget_name: Optional[str] = None
    widget_allowed_domains: Optional[list[str]] = None
    default_source_language: Optional[str] = None
    default_target_language: Optional[str] = None
    supported_languages: Optional[list[str]] = None


@router.get("/me")
async def get_my_tenant(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    return {
        "id": str(tenant.id),
        "name": tenant.name,
        "slug": tenant.slug,
        "domain": tenant.domain,
        "logo_url": tenant.logo_url,
        "primary_color": tenant.primary_color,
        "secondary_color": tenant.secondary_color,
        "widget_name": tenant.widget_name,
        "widget_allowed_domains": tenant.widget_allowed_domains,
        "default_source_language": tenant.default_source_language,
        "default_target_language": tenant.default_target_language,
        "supported_languages": tenant.supported_languages,
        "plan_tier": tenant.plan_tier,
        "is_white_label": tenant.is_white_label,
        "created_at": tenant.created_at.isoformat(),
    }


@router.patch("/me")
async def update_my_tenant(
    body: UpdateTenantRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    update_data = body.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(tenant, field, value)

    await db.commit()
    await db.refresh(tenant)
    return {"message": "Tenant updated successfully", "id": str(tenant.id)}


@router.get("/me/widget-config")
async def get_widget_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    return {
        "tenant_id": str(tenant.id),
        "api_endpoint": "https://api.vaaniai.com",
        "widget_name": tenant.widget_name,
        "primary_color": tenant.primary_color,
        "secondary_color": tenant.secondary_color,
        "logo_url": tenant.logo_url,
        "default_source_language": tenant.default_source_language,
        "default_target_language": tenant.default_target_language,
        "supported_languages": tenant.supported_languages,
        "allowed_domains": tenant.widget_allowed_domains,
        "embed_snippet": f"""<script>
  window.VaaniConfig = {{
    tenantId: "{tenant.id}",
    apiEndpoint: "https://api.vaaniai.com",
    language: "hi"
  }};
  (function(w,d,s,o,f,js,fjs){{
    w['VaaniWidget']=o;w[o]=w[o]||function(){{(w[o].q=w[o].q||[]).push(arguments)}};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }}(window,document,'script','vaani','https://cdn.vaaniai.com/widget/vaani.min.js'));
  vaani('init', window.VaaniConfig);
</script>""",
    }
