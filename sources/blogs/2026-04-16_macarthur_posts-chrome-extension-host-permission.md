---
url: https://macarthur.me/posts/chrome-extension-host-permission/
captured_at: '2026-04-16'
capture_method: script
source_type: blog
source_id: macarthur
title_at_capture: Avoiding a "Host Permission" Review Delay When Publishing a Chrome Extension | Alex MacArthur
author: Alex MacArthur
evidence_class: c
topics:
  - permissions
  - cws-review
  - activeTab
wayback_url: https://web.archive.org/web/20260416224023/https://macarthur.me/posts/chrome-extension-host-permission/
related_docs: []
notes: Fill in during curation.
---

# Avoiding a "Host Permission" Review Delay When Publishing a Chrome Extension | Alex MacArthur

## Signal extracted

<!-- Fill in during curation. The one insight this post has that's hard to get elsewhere. -->

---

I just wrapped up [a Chrome Extension](https://picperf.io/image-saver-extension) that allows you to convert and download any AVIF or WebP image as a more useful JPEG, PNG, or GIF (it aims to solve one of the [greatest pains on the internet](https://www.reddit.com/r/Windows10/comments/yw4bau/i_cant_stand_this_webp_format_i_cant_easily_save/)). The extension's very simple, but I ran into an interesting slowdown getting it finished up and submitted for review.

Under the "Permission Justification" section of the submission form, the following banner was shown after uploading my ZIP file:

!["Due to the Host Permission, your extension may require an in-depth review which will delay publishing" banner](https://picperf.io/https://cms.macarthur.me/content/images/2024/11/image-7.png?sitemap_path=/posts/chrome-extension-host-permission)

"Delay publishing" is rather ambiguous, which led me to assume it'd be forever before it'd finally get reviewed. I wasn't up for that, so I did some digging and found a way to circumvent the issue by structuring my extension a bit differently. Hopefully, it can help speed up someone else's process too.

## [The Initial Structural Problem](#the-initial-structural-problem)

This warning was triggered by the first version of my `manifest.json` file – specifically my usage of `content_scripts`:

![](https://picperf.io/https://cms.macarthur.me/content/images/2024/11/image-8.png?sitemap_path=/posts/chrome-extension-host-permission)

Here's how it looked:

```
{
    "manifest_version": 3,
    "name": "PicPerf's Image Saver",
    "version": "1.1",
    "description": "Convert and save images in different formats.",
    "permissions": ["contextMenus", "downloads"],
    "background": {
        "service_worker": "background.js"
    },
    "content_scripts": [
        {
            "matches": ["<all_urls>"],
            "js": ["content.js"]
        }
    ], 
    "icons": {
        "16": "images/icon-16.png",
        "48": "images/icon-48.png",
        "128": "images/icon-128.png"
    },  
    "action": {}
}
```

The `content_scripts` section of the file specifies code that can [run in the context of a loaded web page](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts). Any scripts injected here can read, modify, and share details about what the user's viewing. That sounds inherently risky, and for good reason. And even risker, the `<all_urls>` match meant `content.js` would be able to run on _any_ page. No restrictions.

My extension does legitimately need to access this kind of stuff. It'd performs a little bit of DOM work to indicate a conversion is being performed, and it's also necessary for triggering a download when the work is finished. (There may be a way to offload some of this work to that `background.js` file referenced above, but I haven't done deep exploration into those possibilities yet).

All of this `content.js` work was triggered by an event published from my `background.js` file:

```
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const formatId = info.menuItemId.replace("convert-to-", "");
  const format = FORMATS.find((f) => f.id === formatId);

  chrome.tabs.sendMessage(tab.id, {
    type: "CONVERT_IMAGE",
    imageUrl: info.srcUrl,
    format: format,
  });
});
```

All of this was functioning fine, so I was eager to figure out a workaround.

## [Granting Access On-Demand](#granting-access-on-demand)

Thankfully, it didn't take long. I was able to find an alternative approach using Chrome's ["activeTab" and "scripting" permissions](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab), which would grant access to the page _only when the extension is explicitly invoked._ This way, all the work I needed to do would only ever happen in response to a user's action, and only on the current tab. It's a bit safer, and it'd mean I could bypass that extra review time.

First up, I added a couple more permissions and removed the `content_scripts` property from my `manifest.json` file.

```
{
    "manifest_version": 3,
    "name": "PicPerf's Image Saver",
    "version": "1.1",
    "description": "Convert and save images in different formats.",
-    "permissions": ["contextMenus", "downloads"],
+    "permissions": ["contextMenus", "downloads", "activeTab", "scripting"],
    "background": {
        "service_worker": "background.js"
    },
-    "content_scripts": [
-        {
-            "matches": ["<all_urls>"],
-            "js": ["content.js"]
-        }
-    ], 
    "icons": {
        "16": "images/icon-16.png",
        "48": "images/icon-48.png",
        "128": "images/icon-128.png"
    },  
    "action": {}
}
```

Next, I adjusted that `background.js` bit to use Chrome's [Scripting API](https://developer.chrome.com/docs/extensions/reference/api/scripting). Rather than strictly publishing a message to a content script that's already listening, it'd first _execute_ that script, and _then_ publish the message.

It's a bit contrived for ease of explanation, but this is how it unfolded:

```
// background.js

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const formatId = info.menuItemId.replace("convert-to-", "");
  const format = FORMATS.find((f) => f.id === formatId);

  // First, execute the client-side script.
  chrome.scripting
    .executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    })
    .then(() => {
      // Then, publish the message like before.
      chrome.tabs.sendMessage(tab.id, {
        type: "CONVERT_IMAGE",
        imageUrl: info.srcUrl,
        format: format,
      });
    },
    (error) => {
      console.error(error);
    }
  );
});
```

At first attempted, everything continued to work fine. Until I started to repeatedly save images on the same page.

### [Avoiding Repeat Execution](#avoiding-repeat-execution)

With this setup, `content.js` was executing _every time_ my context menu item was clicked. That meant my event listener would become repeatedly reregistered, causing more callbacks to trigger unnecessarily.

For my needs, the fix was simple enough: only execute the script when I know it hadn't been done before. Otherwise, publish that message like normal.

```
// background.js

globalThis._PP_EXECUTED_ON_TABS = new Set();

function publishMessage(tabId, srcUrl, format) {
  chrome.tabs.sendMessage(tabId, {
    type: "CONVERT_IMAGE",
    imageUrl: srcUrl,
    format: format,
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const formatId = info.menuItemId.replace("convert-to-", "");
  const format = FORMATS.find((f) => f.id === formatId);

  // It's already been executed on this tab! Bow out early.
  if (globalThis._PP_EXECUTED_ON_TABS.has(tab.id)) {
    publishMessage(tab.id, info.srcUrl, format);

    return;
  }

  globalThis._PP_EXECUTED_ON_TABS.add(tab.id);

  chrome.scripting
    .executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    })
    .then(() => {
      publishMessage(tab.id, info.srcUrl, format);
    },
    (error) => {
      console.error(error);
    }
  );
});
```

No change to my `content.js` file was needed at all, by the way. It just listened for an event from Chrome like before:

```
// content.js

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "CONVERT_IMAGE") {
    // Do stuff.
  }
});
```

Works great, and all parties (especially me) were satisfied. ✅

## [I'll Be Back](#ill-be-back)

I am still so sorely unfamiliar with the extension writing process, as well as the APIs and conventions Chrome provides with it. So, while it's such a little thing, understanding how some of these pieces fit together was very satisfying. I'm eager to iterate on this extension and be back to build more tools in the future.

The PicPerf Image Saver is live, by the way. [Install it](https://chromewebstore.google.com/detail/picperfs-image-saver/mkkhekgceoieddgneokfmijahkombhcg) and send me your feedback!

## Curator notes

<!-- Empty at capture time. -->
