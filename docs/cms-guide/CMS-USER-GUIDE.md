# FEKRA CMS User Guide

English edition | October 2026

CMS: https://www.fekra-egy.com/admin

## Find your way around the CMS

Use the menu button at the top left to open navigation. Collections hold individual records; the Site area holds settings used across the website.

![Find your way around the CMS](screenshots/02-dashboard.png)

1. Open Pages for the homepage, contact content, and other standalone pages. Open Blog for articles, and Services for service landing pages.
2. Open Careers for job adverts and Media for reusable images, videos, and PDFs. Authors and Categories organize blog content.
3. Open Applications or Contact messages to review submissions. Admins also see CV files in the menu.
4. Open Header & Navigation, Footer, or Site Settings for sitewide changes. Use the top right Locale control to choose the editing language.

**Remember:** Editor accounts can manage content and submissions. Admin accounts also manage users and Site Settings.

## Create or update a page

A page contains a title, one shared URL slug, and a sequence of layout blocks. The homepage uses the special slug home.

![Create or update a page](screenshots/04-page-editor.png)

1. Choose Pages, then open an existing title. To create a page, select Create New from the list.
2. Enter the Title and a short Slug such as about. Keep an existing live slug unless a developer has arranged the redirect.
3. Open Content and edit the Layout blocks. Use Settings to manage Available Locales and Hide From Sitemap.
4. Save Draft, review the page with Preview, then choose Publish changes. Open the public URL to confirm the result.

**Remember:** Pages require explicit saving. A page is not added to the header or footer automatically when published.

## Build a page from sections

Layout blocks are the sections of a page, shown from top to bottom in the same order as the website.

![Build a page from sections](screenshots/21-block-picker.png)

1. Select Add Layout and choose the appropriate block. Hero introduces a page; Rich text holds long copy; CTA band adds a call to action.
2. Expand the new block using its arrow. Fill required fields marked with an asterisk, choose media, and configure any buttons.
3. Use the drag handle to move a block. Open its three dot menu for available actions; check the selected block before removing it.
4. Collapse sections to navigate a long page. Save Draft and review the full composition before publishing.

**Remember:** Other blocks include FAQ, Testimonials, Process steps, Card grid, Tech stack, Industry grid, Contact section, and Booking embed.

## Edit headings images and buttons

Each block exposes fields for its content and supported visual options. Start with a small change and check it in context.

![Edit headings images and buttons](screenshots/18-block-editor.png)

1. Expand the relevant block. In a Hero block, edit Heading, Heading Accent, and Body. Rotating Words replace the fixed accent line when present.
2. Select Create New or Choose from existing in a media field. Use descriptive alt text on the media record.
3. Expand Ctas or the link group. Set a visible Label and choose Internal page, Built-in route, or External URL.
4. Use an internal document relationship for a CMS page, a built-in route for a listing such as Blog, and a full https:// URL for an external destination.

**Remember:** A link without a label is not rendered. Check button destinations and images in Preview at mobile and desktop sizes.

## Save preview publish and restore

Drafts let you review content before changing the public website. The top toolbar shows the document status and publishing controls.

![Save preview publish and restore](screenshots/04-page-editor.png)

1. Save Draft after editing. Blog and Services also autosave drafts, but wait for saving to finish before leaving or translating.
2. Use the eye icon for Live Preview or the adjacent arrow icon to open a preview. Choose Mobile, Tablet, Laptop, or Desktop when the preview offers device controls.
3. Choose Publish changes when the copy, layout, links, SEO, and translations are approved. Then check the public page outside preview mode.
4. To recover older content, open Versions, select the relevant version, compare it, and use the restore control offered there. Review the restored content before publishing.

**Remember:** Header, Footer, Site Settings, Media, Authors, and Categories save directly. Their Save action does not use the content draft review process.

## Set search and social information

Pages, Blog, Services, and Careers have an SEO tab. It controls the search title, description, and social sharing image.

![Set search and social information](screenshots/20-seo.png)

1. Open SEO. Enter a clear Title and Description; the CMS displays length guidance and a search result preview.
2. Choose a Meta Image. A 1200 by 630 image is a useful social sharing size; Site Settings provides the default image when a document has none.
3. Leave Canonical Override empty for the normal page URL. Ask the site owner before using a different canonical.
4. Enable Noindex only when the page should be excluded from search results and the sitemap. Save and publish the content change.

**Remember:** Hide From Sitemap in page Settings only excludes that page from the sitemap. Noindex also requests exclusion from search results.

## Manage languages and shared sections

The CMS supports English EN, Arabic AR, German DE, French FR, and Spanish ES. Localized fields carry a language indicator.

![Manage languages and shared sections](screenshots/19-locales.png)

1. Select the editing language using Locale at the top right. Translate localized copy, including titles, block text, button labels, and SEO fields.
2. Keep the same slug across languages. English pages use /about; Arabic pages use /ar/about, with equivalent prefixes for the other languages.
3. Add a language to Available Locales only when its translation is approved. Find this field under Settings for Pages, Meta for Blog, Structure for Services, or Details for Careers.
4. For a Shared section block, edit its source section on the Home page in the same locale, then publish Home and check the pages that reuse it.

**Remember:** Shared fields such as slugs, images, relationships, and layout structure can affect multiple languages. A Shared section reuses homepage content rather than maintaining a separate copy.

## Write and publish a blog article

Blog articles combine an article body with an excerpt, hero image, category, author, optional extra sections, and SEO.

![Write and publish a blog article](screenshots/06-blog-create.png)

1. Open Blog and select Create New. Enter a Title and Slug, a concise Excerpt of up to 320 characters, and a Hero Image.
2. Keep Content Format set to Rich text editor. Write the body and use H2, H3, or H4 headings. The page template provides the main H1.
3. Open Meta to choose Category, Author, Tags, Related Posts, and Available Locales. Create author or category records first if needed.
4. Complete SEO, set Featured if appropriate, review Published At, and preview the article. Publish changes and check its listing on /blog.

**Remember:** Authors store name, role, photo, bio, and LinkedIn URL. Categories store a title, slug, and description.

## Import an HTML blog article

Use the custom HTML editor when an article has already been prepared as HTML. The normal article title, image, metadata, and SEO still apply.

![Import an HTML blog article](screenshots/07-blog-html.png)

1. In the article Content tab, choose Import / paste HTML under Content Format.
2. Paste the markup into HTML content or choose an .html file using the import control. Keep the file smaller than 500 KB.
3. Use inline CSS or a style block and absolute image URLs. JavaScript and forms are disabled in the rendered article.
4. Review both Desktop and Mobile under HTML preview. Save the draft, check the complete article preview, then publish.

**Remember:** Put article markup in HTML content, not Excerpt. Excerpt is a short plain language summary for article cards.

## Translate blog articles

The custom Translate empty languages button creates draft translations from the English article for languages that are still empty.

![Translate blog articles](screenshots/23-translate.png)

1. Select EN and complete the article. Save the English changes first; the translation button is disabled while the form has unsaved changes.
2. Select Translate empty languages. Allow the operation to finish and read any success or failure message.
3. Switch to each translated locale and review the title, body, excerpt, and SEO. Existing edited translations are kept by the normal button.
4. Check Available Locales in Meta. The translation action adds successful languages to the draft list, so retain only languages approved for release before publishing.

**Remember:** Translations are saved as drafts and require editorial review. If a language fails, keep the English source saved and retry after checking the reported error.

## Create and organize services

Services have their own landing pages, page builder layout, and navigation structure.

![Create and organize services](screenshots/22-service-structure.png)

1. Open Services and choose Create New. Enter Title, Slug, and required Summary. Choose an Icon and build the page in Content.
2. Open Structure. Choose Parent for a related child landing page, and select Related Services to connect relevant pages.
3. Set Order to control the overview sequence; lower numbers appear first. Add Menu Roles when the service should provide role labels in the Services mega menu.
4. Set Available Locales, complete SEO, and preview. Publish, then check the landing page, overview, breadcrumbs, and header menu.

**Remember:** The Parent field supports service relationships and breadcrumbs. Keep live slugs stable even when reorganizing services.

## Publish and close job vacancies

A job has two separate states: its CMS draft or published state, and its open or closed recruitment status.

![Publish and close job vacancies](screenshots/10-job-details.png)

1. Open Careers and choose Create New. In Role, enter Title, Slug, required Summary and Description, plus Requirements and Benefits.
2. In Details, enter Location and choose Work Model and Employment Type. Review Department, Country Code, City, Valid Through, and Available Locales.
3. Keep Role Status set to Open when applications should be accepted. Complete SEO, preview, and Publish changes.
4. To stop recruitment, set Role Status to Closed and publish that change. The page stays reachable, its application form is disabled, and JobPosting structured data is removed.

**Remember:** The Careers collection manages individual job adverts. Page builder content for careers landing sections belongs in Pages where configured.

## Upload and reuse media

Media is the reusable library for public images, MP4 videos, and PDF documents. Applicant CVs belong in the separate private CV files collection.

![Upload and reuse media](screenshots/11-media.png)

1. Open Media and choose Create New. Select a file, drag it into the upload area, or use the offered URL option.
2. Write useful Alt text for meaningful images. Choose Decorative only when an image conveys no information.
3. Add a localized Caption and a Credit where needed. Save the media record, then select it from the relevant page or article field.
4. For an image, review the focal point and the resulting crop where the upload editor offers those controls. Check both a card and the full page.

**Remember:** Media is saved directly and may be reused in several places. Check dependencies before replacing or deleting a shared asset.

## Update header links and announcements

Header & Navigation controls the main menu, nested dropdown links, call to action buttons, and the announcement.

![Update header links and announcements](screenshots/12-header.png)

1. Open Header & Navigation. Expand the menu item to change, or add a Menu item. Use the drag handle to adjust order.
2. Set a visible Label and choose the correct link type and destination. Use Children for dropdown entries and add descriptions when useful.
3. Review Ctas for header buttons. In Announcement, enable the banner, enter localized Text, and configure its link.
4. Select Save. Test the header links, dropdowns, announcement, and mobile menu on the public site in each affected language.

**Remember:** The header supports up to 8 menu items, 12 dropdown items per menu entry, and 2 CTA buttons. Saving makes the change directly.

## Maintain the footer

The Footer global manages its introductory copy, link columns, newsletter text, legal links, and copyright.

![Maintain the footer](screenshots/13-footer.png)

1. Open Footer and choose the editing Locale. Update Tagline and Blurb.
2. Add or edit Columns, their titles, and links. Configure each link label and destination using the same link controls as the header.
3. Review Newsletter Enabled, Heading, and Body. Add the approved Privacy, Cookies, and Terms destinations under Legal Links.
4. Update Copyright and Save. Check the public footer on desktop and mobile, including newsletter text and every legal link.

**Remember:** The footer supports up to 4 link columns and 6 legal links. Changes to shared link structure can affect multiple languages.

## Maintain site identity and contact settings

Site Settings is updated by admins. Its Save action changes settings used throughout the website.

![Maintain site identity and contact settings](screenshots/14-settings.png)

1. In Identity, review Site Name, Legal Name, localized Tagline, light and dark logos, Default OG Image, and Social Profiles.
2. In Contact & Offices, maintain office records, General Email, Notification Emails for enquiries, and Careers Emails for applications.
3. In Integrations, maintain the Calendly booking URL and approved analytics identifiers. Review Consent Mode with the site owner.
4. In SEO & Crawlers, review the title suffix, default description, crawler policy, and Search Console verification. Save and check affected public pages.

**Remember:** CMS fields do not configure database credentials, email delivery API keys, or storage credentials. A developer maintains those environment settings.

## Review applications and contact messages

Submissions arrive from the public website. Open existing records in the collection list to review and update them.

![Review applications and contact messages](screenshots/16-contact.png)

1. Open Contact messages. Use Filters and Columns to find enquiries by status or date, then open a record and read its details.
2. Reply using the team inbox or agreed communication channel. Change Status to replied, closed, or spam as appropriate, and Save. Changing status does not send a reply.
3. Open Applications to review the candidate, Job, CV, and Cover Note. Set status to new, reviewing, interviewing, rejected, or hired, then Save.
4. Expand Attribution to inspect source page, locale, campaign values, and referrer. Open CVs while logged in; if an expiring download stops working, reopen it from the CMS.

**Remember:** Only admins can delete submissions and CV files. Handle candidate and enquiry data according to the organization retention policy.

## Manage CMS user access

Admins create accounts and assign roles. Editors can update their own account details, but cannot promote themselves to admin.

![Manage CMS user access](screenshots/17-users.png)

1. Open Users and select Create New. Enter the user Email, Name, New Password, and Confirm Password.
2. Choose Editor for routine content work or Admin for a person who must also manage users and Site Settings.
3. Save the account and provide access through the team secure process. Each person should use an individual account.
4. Use the top right account control to manage your own profile and sign out. Use Forgot password on the login page when recovery email is configured.

**Remember:** Sessions last 8 hours. Five failed login attempts lock an account for 10 minutes; stop retrying and use the recovery or administrator route.

## Before publishing

- The correct document and locale are selected.
- Required fields are complete; copy and translations are approved.
- Links lead to the intended published pages and have visible labels.
- Images have useful alt text or are correctly marked decorative.
- Mobile and desktop previews are readable.
- SEO title, description, and social image are set.
- Available Locales contains only approved translations.
- After publishing, the public page, listing, navigation, and reused sections are checked.

## Troubleshooting

**Publish is disabled**  Wait for the current save to finish. Correct required field errors and check the saved status.

**Preview cannot open**  Save the document first. If it still fails, ask the developer to check preview configuration.

**A language is missing**  Check its localized content and Available Locales. Publish approved changes and check the language switcher.

**A change is not visible**  Confirm the correct record and locale were published. Check whether the section is shared from Home.

**Translation is disabled**  Save the English article changes first, then retry Translate empty languages.

**A link is invisible**  Add a visible Label and a valid destination, then save the parent record.

**Email or upload fails**  Keep the error and time of failure. Ask the administrator or developer to check delivery or storage settings.

**The CMS shows a server error**  Reload once. If it persists, send the developer the page URL and displayed error ID; avoid repeated saves.
