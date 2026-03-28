import urllib.request
import re
from collections import Counter
import ssl
from urllib.parse import urlparse, urljoin

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

urls = [
    "https://mistral.ai",
    "https://console.mistral.ai/build/playground",
    "https://elevenlabs.io",
    "https://play.ht"
]

def get_content(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
    try:
        return urllib.request.urlopen(req, context=ctx).read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return ""

for url in urls:
    print(f"\n====================\nAnalyzing {url}")
    html = get_content(url)
    if not html:
        continue
    
    # Find CSS links
    css_links = re.findall(r'<link[^>]+rel=[\'"]stylesheet[\'"][^>]+href=[\'"]([^\'"]+)[\'"]', html)
    css_content = html
    for href in css_links:
        full_url = urljoin(url, href)
        print(f"Fetching CSS: {full_url[:100]}...")
        css_content += " " + get_content(full_url)
            
    # Find colors
    colors = re.findall(r'#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b', css_content)
    colors_lower = [c.lower() for c in colors]
    print(f"Top 15 hex colors: {Counter(colors_lower).most_common(15)}")
    
    # Find rgb/rgba colors
    rgb_colors = re.findall(r'rgba?\([0-9\s,\.]+\)', css_content)
    print(f"Top 10 rgb(a) colors: {Counter(rgb_colors).most_common(10)}")

    # Find fonts
    fonts = re.findall(r'font-family:\s*([^;\}]+)', css_content)
    clean_fonts = [f.strip().strip('"\'').split(',')[0].strip(' "\'') for f in fonts]
    print(f"Top 10 fonts: {Counter(clean_fonts).most_common(10)}")

