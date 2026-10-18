# Regional Access and Known Limitations

Checklist 23.10, 23.11 and 25.5. Run on **14 Oct 2026** against the live domain
`https://www.fekra-egy.com`.

## Method

[Globalping](https://globalping.io) probes in the target markets made an HTTPS `GET /` and a
DNS lookup. check-host.net has no probes in Egypt, KSA or the UAE, so it could not be used.

- HTTP measurement `2ok4QbUOWRHTIes9q00021Jj4`
- DNS measurement `2xjJ7K6PKASCuBFlU00021Jj4`

Anyone can reopen the raw results at `https://api.globalping.io/v1/measurements/<id>` for a
limited time.

## Results

| Market | City | Network | HTTP | Time to first byte | Total | DNS answer |
| --- | --- | --- | --- | --- | --- | --- |
| Egypt | Cairo | Huawei Cloud | 200 | 975 ms | 1634 ms | 216.198.79.1 |
| Egypt | Cairo | LightNode | 200 | 587 ms | 737 ms | 216.198.79.1 |
| KSA | Riyadh | Huawei Cloud | 200 | 1035 ms | 1614 ms | 216.198.79.1 |
| KSA | Jeddah | Oracle | 200 | 650 ms | 1242 ms | 216.198.79.1 |
| UAE | Dubai | M247 | 200 | 1079 ms | 1324 ms | 216.198.79.1 |
| UAE | Abu Dhabi | Emirates Internet (Etisalat) | 200 | 990 ms | 1541 ms | 216.198.79.1 |
| UK | London | Oracle | 200 | 2987 ms | 3065 ms | 216.198.79.1 |
| EU | Falkenstein, DE | Hetzner | 200 | 354 ms | 482 ms | 216.198.79.1 |
| EU | Roubaix, FR | OVH | 200 | 661 ms | 734 ms | 216.198.79.1 |
| USA | Buffalo | HostPapa | 200 | 689 ms | 967 ms | 216.198.79.1 |
| USA | Los Angeles | HostPapa | 200 | 3064 ms | 3261 ms | 216.198.79.1 |

**Result: reachable from every target market.** All 11 probes got HTTP 200 over valid TLS and
the same DNS answer (Vercel). There were no 403s, challenges or geo-blocks.

**Speed.** First-byte times of 0.6–1.1 s in the Gulf and up to 3 s in London and Los Angeles
are high. HTML is not CDN-cached today (severity register S-02), so every visit is rendered in
Frankfurt. When caching is restored these should fall to roughly 50–200 ms. Re-run the
probes after that fix.

## Known limitations

These are outside the website project's control, or not yet tested. FEKRA should be aware of
them before sign-off.

1. **Probe networks.** All probes run in data centres or on cloud networks; one is on
   Etisalat. Home and mobile ISPs such as Vodafone/WE Egypt, STC and du were not tested
   directly. Spot-check from a real phone in each market.
2. **Single compute region.** Server rendering runs in Vercel `fra1` (Frankfurt) and the
   database is Supabase `eu-north-1` (Stockholm). Uncached pages make a Frankfurt↔Stockholm
   round trip. Static files are served from Vercel's global CDN.
3. **Third-party services.** Calendly (booking), Google Analytics 4, Cloudflare Turnstile (bot
   check), Resend (email), Google Fonts are *not* used (fonts are self-hosted). If one of these
   is slow or blocked, only its feature is affected:
   - Ad blockers and some corporate networks block GA4, so analytics will under-count.
   - If Turnstile is blocked, forms fall back to a maths question, so submission still works.
   - If Calendly is unreachable, booking is unavailable. The contact form remains.
4. **Sanctions.** Vercel, Calendly and Google are US companies and follow US export rules.
   Visitors from sanctioned regions may be refused by those providers. This was not tested and
   cannot be changed by the website.
5. **VPN and bot traffic.** Firewall and bot rules can challenge traffic from known VPN or
   data-centre addresses. Normal visitors were not challenged in any probe.
6. **Domain and DNS.** DNS is hosted at Hostinger (`cdns1/2.main-hosting.eu`). The registrar is
   PDR Ltd (PublicDomainRegistry) and the domain **expires 08 Jul 2027**. Renewal and DNS
   access must sit with FEKRA (see handover §9). Company email (MX) is Google Workspace and is
   not part of this project.
7. **Email delivery.** Notifications go through Resend. Whether they reach the inbox depends on
   SPF/DKIM for the sending domain and on the recipients' spam filters.
