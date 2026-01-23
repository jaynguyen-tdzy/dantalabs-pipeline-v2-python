import requests
from bs4 import BeautifulSoup
import re
import urllib3

# Suppress SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class TechStackDetector:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        }
        
    def detect(self, url: str):
        """
        Analyzes a URL to detect the technology stack.
        Returns a dictionary with categories: cms, frontend, server, ecommerce, crm, analytics
        """
        if not url:
            return self._empty_result()
            
        if not url.startswith('http'):
            url = 'https://' + url
            
        try:
            response = requests.get(url, headers=self.headers, timeout=10, verify=False)
            # Proceed even if 404/500, data might still be there, but usually we want 200.
            # Some sites return partial content on errors.
            
            headers = response.headers
            html = response.text
            soup = BeautifulSoup(html, 'html.parser')
            
            return {
                "cms": self._detect_cms(html, headers, soup),
                "frontend": self._detect_frontend(html, headers, soup),
                "server": self._detect_server(headers),
                "ecommerce": self._detect_ecommerce(html, soup),
                "crm": self._detect_crm(html, soup),
                "analytics": self._detect_analytics(html, soup),
                "agents": self._detect_agents(html, soup),
                "is_wordpress": self._is_wordpress(html, headers, soup)
            }
            
        except Exception as e:
            print(f"⚠️ Tech Detect Error for {url}: {e}")
            return self._empty_result()

    def _empty_result(self):
        return {
            "cms": [], "frontend": [], "server": [], "ecommerce": [], 
            "crm": [], "analytics": [], "is_wordpress": False
        }

    def _detect_cms(self, html: str, headers: dict, soup: BeautifulSoup):
        detected = set()
        html_lower = html.lower()
        
        # 1. Meta Generator
        meta_generator = soup.find('meta', attrs={'name': 'generator'})
        if meta_generator:
            content = meta_generator.get('content', '').lower()
            if 'wordpress' in content: detected.add('WordPress')
            if 'shopify' in content: detected.add('Shopify')
            if 'wix' in content: detected.add('Wix')
            if 'squarespace' in content: detected.add('Squarespace')
            if 'joomla' in content: detected.add('Joomla')
            if 'drupal' in content: detected.add('Drupal')
            if 'webflow' in content: detected.add('Webflow')
        
        # 2. Path & Content Signatures
        if '/wp-content/' in html_lower or '/wp-includes/' in html_lower: detected.add('WordPress')
        if 'cdn.shopify.com' in html_lower: detected.add('Shopify')
        if 'wix.com' in html_lower or 'wix-bolt' in html_lower: detected.add('Wix')
        if 'static1.squarespace.com' in html_lower: detected.add('Squarespace')
        if 'webflow.com' in html_lower or 'w-mod-' in html_lower: detected.add('Webflow')
        
        # 3. Headers
        if 'x-shopify-stage' in headers: detected.add('Shopify')
        if 'x-wix-request-id' in headers: detected.add('Wix')
        
        return list(detected)

    def _detect_frontend(self, html: str, headers: dict, soup: BeautifulSoup):
        detected = set()
        html_lower = html.lower()
        
        # Frameworks
        if 'next.js' in html_lower or '/_next/static' in html_lower or '__NEXT_DATA__' in html_lower: detected.add('Next.js')
        if 'react' in html_lower or 'react-dom' in html_lower: detected.add('React')
        if 'vue.js' in html_lower or 'vue.min.js' in html_lower or 'data-v-' in html_lower: detected.add('Vue.js')
        if 'nuxt' in html_lower or '/_nuxt/' in html_lower: detected.add('Nuxt.js')
        if 'angular' in html_lower or 'ng-version' in html_lower: detected.add('Angular')
        if 'svelte' in html_lower or 'svelte-' in html_lower: detected.add('Svelte')
        
        # CSS
        if 'tailwind' in html_lower: detected.add('Tailwind CSS')
        if 'bootstrap' in html_lower: detected.add('Bootstrap')
        if 'jquery' in html_lower: detected.add('jQuery')
        
        return list(detected)

    def _detect_server(self, headers: dict):
        detected = set()
        
        server = headers.get('Server', '').lower()
        powered_by = headers.get('X-Powered-By', '').lower()
        
        if 'cloudflare' in server: detected.add('Cloudflare')
        if 'nginx' in server: detected.add('Nginx')
        if 'apache' in server: detected.add('Apache')
        if 'vercel' in headers.get('x-vercel-id', '').lower(): detected.add('Vercel')
        if 'netlify' in headers.get('x-netlify-id', '').lower(): detected.add('Netlify')
        
        if 'php' in powered_by: detected.add('PHP')
        if 'asp.net' in powered_by: detected.add('ASP.NET')
        
        return list(detected)

    def _detect_ecommerce(self, html: str, soup: BeautifulSoup):
        detected = set()
        html_lower = html.lower()
        
        if 'woocommerce' in html_lower: detected.add('WooCommerce')
        if 'shopify' in html_lower: detected.add('Shopify')
        if 'magento' in html_lower or 'mage/' in html_lower: detected.add('Magento')
        if 'bigcommerce' in html_lower: detected.add('BigCommerce')
        if 'prestashop' in html_lower: detected.add('PrestaShop')
        
        return list(detected)

    def _detect_crm(self, html: str, soup: BeautifulSoup):
        detected = set()
        html_lower = html.lower()
        
        if 'hs-scripts.com' in html_lower or 'hubspot' in html_lower: detected.add('HubSpot')
        if 'salesforce' in html_lower or 'pardot' in html_lower: detected.add('Salesforce')
        if 'zoho' in html_lower: detected.add('Zoho')
        if 'bitrix24' in html_lower: detected.add('Bitrix24')
        if 'intercom' in html_lower: detected.add('Intercom')
        if 'zendesk' in html_lower: detected.add('Zendesk')
        if 'drift' in html_lower: detected.add('Drift')
        
        return list(detected)

    def _detect_analytics(self, html: str, soup: BeautifulSoup):
        detected = set()
        html_lower = html.lower()
        
        if 'google-analytics.com' in html_lower or 'gtag' in html_lower or 'ga.js' in html_lower: detected.add('Google Analytics')
        if 'googletagmanager.com' in html_lower: detected.add('Google Tag Manager')
        if 'facebook.net/en_US/fbevents.js' in html_lower or 'fbq(' in html_lower: detected.add('Facebook Pixel')
        if 'hotjar' in html_lower: detected.add('Hotjar')
        if 'segment.com' in html_lower or 'analytics.js' in html_lower: detected.add('Segment')
        
        return list(detected)

    def _is_wordpress(self, html: str, headers: dict, soup: BeautifulSoup):
        # Re-use logic or just check empty
        cms = self._detect_cms(html, headers, soup)
        return 'WordPress' in cms

    def _detect_agents(self, html: str, soup: BeautifulSoup):
        detected = set()
        html_lower = html.lower()
        
        # Chat Widgets & AI Agents
        if 'intercom' in html_lower or 'intercomsettings' in html_lower: detected.add('Intercom')
        if 'drift' in html_lower or 'driftt' in html_lower: detected.add('Drift')
        if 'zendesk' in html_lower or 'zopim' in html_lower: detected.add('Zendesk')
        if 'tawk.to' in html_lower: detected.add('Tawk.to')
        if 'livechat' in html_lower or 'livechatinc' in html_lower: detected.add('LiveChat')
        if 'crisp' in html_lower or 'crisp.chat' in html_lower: detected.add('Crisp')
        if 'manychat' in html_lower: detected.add('ManyChat')
        if 'chatbase' in html_lower: detected.add('Chatbase')
        if 'voiceflow' in html_lower: detected.add('Voiceflow')
        if 'stack' in html_lower and 'ai' in html_lower: detected.add('Stack AI') 
        if 'botpress' in html_lower: detected.add('Botpress')
        if 'dialogflow' in html_lower: detected.add('Dialogflow')
        if 'tidio' in html_lower: detected.add('Tidio')
        
        return list(detected)
