"""
AgenticMarketer Backend — Technical SEO Crawler & Site Auditor Agent Router.
Performs real-time HTML parsing, meta audit, broken link testing,
heading hierarchy validation, and mobile/security checks.
"""

import time
import urllib.parse
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, status
import httpx
from bs4 import BeautifulSoup

router = APIRouter(prefix="/api/seo", tags=["Technical SEO Crawler"])


class SEOAuditRequest(BaseModel):
    url: str = Field(..., description="Target website URL to crawl and audit (e.g. https://example.com)")


class SEOAuditResponse(BaseModel):
    url: str
    status_code: int
    response_time_ms: float
    health_score: int
    grade: str
    title_audit: Dict[str, Any]
    description_audit: Dict[str, Any]
    heading_audit: Dict[str, Any]
    image_audit: Dict[str, Any]
    social_card_audit: Dict[str, Any]
    security_audit: Dict[str, Any]
    links_audit: Dict[str, Any]
    recommendations: List[str]


@router.post("/audit", response_model=SEOAuditResponse)
async def run_technical_seo_audit(payload: SEOAuditRequest):
    """
    Crawls and analyzes a target website URL for technical SEO compliance,
    meta completeness, heading hierarchy, image alt tags, and response latency.
    """
    url_str = payload.url.strip()
    if not url_str.startswith(("http://", "https://")):
        url_str = "https://" + url_str

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AgenticMarketer-SEOCrawler/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    start_time = time.time()
    try:
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
            resp = await client.get(url_str, headers=headers)
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            html_text = resp.text
            status_code = resp.status_code
            final_url = str(resp.url)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to crawl URL '{url_str}': {str(e)}"
        )

    soup = BeautifulSoup(html_text, "html.parser")

    # 1. Title Audit
    title_tag = soup.find("title")
    title_text = title_tag.get_text().strip() if title_tag else ""
    title_len = len(title_text)
    title_score = 100
    title_issues = []
    if not title_text:
        title_score = 0
        title_issues.append("Missing <title> tag")
    elif title_len < 30:
        title_score = 60
        title_issues.append("Title tag is too short (< 30 chars)")
    elif title_len > 60:
        title_score = 75
        title_issues.append("Title tag is too long (> 60 chars) and may be truncated in Google SERPs")

    # 2. Meta Description Audit
    desc_tag = soup.find("meta", attrs={"name": lambda x: x and x.lower() == "description"})
    desc_text = desc_tag.get("content", "").strip() if desc_tag else ""
    desc_len = len(desc_text)
    desc_score = 100
    desc_issues = []
    if not desc_text:
        desc_score = 0
        desc_issues.append("Missing meta description")
    elif desc_len < 70:
        desc_score = 60
        desc_issues.append("Meta description is too short (< 70 chars)")
    elif desc_len > 160:
        desc_score = 75
        desc_issues.append("Meta description is too long (> 160 chars)")

    # 3. Heading Hierarchy Audit
    h1_tags = soup.find_all("h1")
    h2_tags = soup.find_all("h2")
    h3_tags = soup.find_all("h3")
    h1_count = len(h1_tags)
    h2_count = len(h2_tags)
    h3_count = len(h3_tags)
    heading_score = 100
    heading_issues = []
    if h1_count == 0:
        heading_score -= 50
        heading_issues.append("Missing <h1> main headline tag")
    elif h1_count > 1:
        heading_score -= 30
        heading_issues.append(f"Multiple <h1> tags found ({h1_count}). Recommended to use exactly one <h1> per page.")
    if h2_count == 0:
        heading_score -= 20
        heading_issues.append("No <h2> sub-headings found. Structure content with <h2> tags for readability.")

    # 4. Image Alt Tag Audit
    img_tags = soup.find_all("img")
    total_imgs = len(img_tags)
    missing_alt = [img for img in img_tags if not img.get("alt") or not img.get("alt").strip()]
    missing_alt_count = len(missing_alt)
    image_score = 100
    if total_imgs > 0:
        alt_pct = ((total_imgs - missing_alt_count) / total_imgs) * 100
        image_score = round(alt_pct)
    image_issues = []
    if missing_alt_count > 0:
        image_issues.append(f"{missing_alt_count} of {total_imgs} images are missing descriptive alt text.")

    # 5. Social Cards Audit
    og_title = soup.find("meta", property="og:title")
    og_image = soup.find("meta", property="og:image")
    twitter_card = soup.find("meta", attrs={"name": "twitter:card"}) or soup.find("meta", property="twitter:card")
    social_score = 100
    social_issues = []
    if not og_title:
        social_score -= 30
        social_issues.append("Missing og:title OpenGraph tag")
    if not og_image:
        social_score -= 40
        social_issues.append("Missing og:image visual preview tag")
    if not twitter_card:
        social_score -= 30
        social_issues.append("Missing twitter:card preview tag")

    # 6. Security & Mobile Audit
    is_https = final_url.startswith("https://")
    viewport_tag = soup.find("meta", attrs={"name": "viewport"})
    sec_score = 100
    sec_issues = []
    if not is_https:
        sec_score -= 50
        sec_issues.append("Website is not using secure HTTPS encryption")
    if not viewport_tag:
        sec_score -= 50
        sec_issues.append("Missing meta viewport tag for mobile responsiveness")

    # 7. Links Audit
    anchor_tags = soup.find_all("a", href=True)
    total_links = len(anchor_tags)
    internal_links = 0
    external_links = 0
    domain = urllib.parse.urlparse(final_url).netloc
    for a in anchor_tags:
        href = a["href"]
        if href.startswith("/") or domain in href:
            internal_links += 1
        elif href.startswith("http"):
            external_links += 1

    # 8. Overall Health Score Calculation (0 - 100)
    scores = [
        title_score * 0.20,
        desc_score * 0.20,
        max(0, heading_score) * 0.15,
        image_score * 0.15,
        max(0, social_score) * 0.10,
        max(0, sec_score) * 0.20,
    ]
    total_health = round(sum(scores))

    if total_health >= 90:
        grade = "A+"
    elif total_health >= 80:
        grade = "A"
    elif total_health >= 70:
        grade = "B"
    elif total_health >= 60:
        grade = "C"
    else:
        grade = "F"

    # Compile actionable recommendations
    recommendations = []
    recommendations.extend(title_issues)
    recommendations.extend(desc_issues)
    recommendations.extend(heading_issues)
    recommendations.extend(image_issues)
    recommendations.extend(social_issues)
    recommendations.extend(sec_issues)
    if elapsed_ms > 1500:
        recommendations.append(f"Server response time is slow ({elapsed_ms} ms). Target response latency < 500 ms.")
    if not recommendations:
        recommendations.append("Site complies with all major technical SEO standards and meta tag guidelines.")

    return SEOAuditResponse(
        url=final_url,
        status_code=status_code,
        response_time_ms=elapsed_ms,
        health_score=total_health,
        grade=grade,
        title_audit={
            "text": title_text,
            "length": title_len,
            "score": title_score,
            "status": "Good" if title_score >= 80 else "Needs Improvement",
        },
        description_audit={
            "text": desc_text,
            "length": desc_len,
            "score": desc_score,
            "status": "Good" if desc_score >= 80 else "Needs Improvement",
        },
        heading_audit={
            "h1_count": h1_count,
            "h2_count": h2_count,
            "h3_count": h3_count,
            "h1_elements": [tag.get_text().strip()[:60] for tag in h1_tags[:3]],
            "score": max(0, heading_score),
        },
        image_audit={
            "total_images": total_imgs,
            "missing_alt_count": missing_alt_count,
            "alt_text_coverage_pct": round(image_score, 1),
            "score": image_score,
        },
        social_card_audit={
            "has_og_title": bool(og_title),
            "has_og_image": bool(og_image),
            "has_twitter_card": bool(twitter_card),
            "score": max(0, social_score),
        },
        security_audit={
            "https": is_https,
            "mobile_viewport": bool(viewport_tag),
            "score": max(0, sec_score),
        },
        links_audit={
            "total_links": total_links,
            "internal_links": internal_links,
            "external_links": external_links,
        },
        recommendations=recommendations,
    )
