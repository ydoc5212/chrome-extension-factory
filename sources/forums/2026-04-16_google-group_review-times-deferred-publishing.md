---
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/BrwVKyIvCMs
captured_at: '2026-04-16'
capture_method: script-rendered
source_type: forum
source_id: google-group
title_at_capture: Extension review time. How to improve it?
author: null
evidence_class: b
topics:
  - cws-review
  - deferred-publishing
  - review-times
wayback_url: >-
  https://web.archive.org/web/20260416224123/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/BrwVKyIvCMs
related_docs: []
notes: Fill in during curation.
thread_url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/BrwVKyIvCMs
post_count: null
accepted_answer: null
---

# Extension review time. How to improve it?

## Signal extracted

<!--
Fill in during curation. One to three sentences describing the insight
buried in this thread. Quote the load-bearing post verbatim if it's short.
-->

## Raw content

<!--
Auto-extracted dump. For JS-rendered forums (Google Groups, Reddit), this
may be empty or incomplete — split posts into `## Post N` sections manually
following sources/_templates/forum-thread.md.
-->

Groups

Search

Clear search

Close search

Main menu

Google apps

[![](https://fonts.gstatic.com/s/i/productlogos/groups/v9/web-48dp/logo_groups_color_1x_web_48dp.png)Groups](./my-groups)

Conversations

All groups and messages

Send feedback to Google

Help

Training

[](https://www.google.com/intl/en/about/products?tab=gh)

[Sign in](https://accounts.google.com/ServiceLogin?hl=en&passive=true&continue=https://groups.google.com&ec=GAZA0AM)

[Groups](./my-groups)

Groups

## Chromium Extensions

[

Conversations



](./a/chromium.org/g/chromium-extensions)

[

About



](./a/chromium.org/g/chromium-extensions/about)

[Privacy](https://policies.google.com/privacy?hl=en_US) • [Terms](https://policies.google.com/terms?hl=en_US)









# Extension review time. How to improve it?

757 views

Skip to first unread message



![William A.'s profile photo](//lh3.googleusercontent.com/a-/ALV-UjWD_GQNcC0ZfrfG4GOFgyrcX5DLZdAgTvSVf6VJQ6QIH5k_yGc=s40-c)

### William A.

unread,

Apr 20, 2023, 7:28:58 AM4/20/23







Reply to author

Sign in to reply to author

Forward

Sign in to forward

Delete

You do not have permission to delete messages in this group

Copy link

Report message

Show original message

Either email addresses are anonymous for this group or you need the view member email addresses permission to view the original message

to Chromium Extensions

What are the factors that affect the extension review time? We see that some of the extension approval happens immediately while others can take days or week to get approval. 

  

Is there anything we as extension developers can do to improve the time? What are the factors that affect this. 

  

The reason I ask is that sometimes when there is a bug it takes us only a couple of hours to have a fix for it, but it takes days to get it approved for teh chrome store. 

  

Regards

William A. 

![Deco's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUGoswBF5gKpF7XKeCVE7pdkBeXcdRsfh2OFX2suD9dh00Et-5kcw=s40-c)

### Deco

unread,

Apr 20, 2023, 7:48:33 AM4/20/23







Reply to author

Sign in to reply to author

Forward

Sign in to forward

Delete

You do not have permission to delete messages in this group

Copy link

Report message

Show original message

Either email addresses are anonymous for this group or you need the view member email addresses permission to view the original message

to William A., Chromium Extensions

There are certain extension updates criteria which judge how long a change can take, for example, requesting a new permission will go through a more thorough review than one that doesn't. 

The following are examples from the [CWS documentation](https://developer.chrome.com/docs/webstore/review-process/#review-time-factors):   

### Notable factors that increase review time

Reviews may take longer for extensions that request broad host permissions or sensitive execution permissions, or which include a lot of code or hard-to-review code.

Broad host permissions

[Host permissions](https://developer.chrome.com/docs/extensions/mv3/declare_permissions/) patterns like `*://*/*`, `https://*/*`, and `<all_urls>` give extensions extensive access to the user's web activity, especially when combined with other permissions. Extensions with this kind of access can collect a user's browsing history, hijack web search behavior, scrape data from banking websites, harvest credentials, or exploit users in other ways.

Sensitive execution permissions

Permissions grant extensions special data access and manipulation rights. Some permissions do this directly (for example, `tabs` and `downloads`) while others must be combined with host permissions grants (for example, `cookies` and `webRequest`). Review must verify that each requested permission is actually necessary and is used appropriately. Requesting powerful and potentially dangerous capabilities takes more time to review.

Amount and formatting of code

The more code an extension contains, the more work it takes to verify that code is safe. Obfuscation is disallowed as it increases the complexity of the validation process. Minification is allowed, but it can also make reviewing extension code more difficult. Where possible, consider submitting your code as authored. You may also want to consider structuring your code in a way that is easy for others to understand.

  

There isn't you as a developer can do to shorten the review time, everyone goes through the same process. Mainly, be vigilant of what you are changing, try and if possible factor this into how long a review will take.

  

Thanks,

Deco

  





> \--  
> You received this message because you are subscribed to the Google Groups "Chromium Extensions" group.  
> To unsubscribe from this group and stop receiving emails from it, send an email to chromium-extens...@chromium.org.  
> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/1d8d25f2-5643-47fa-ab54-6f9f58ac9508n%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/1d8d25f2-5643-47fa-ab54-6f9f58ac9508n%40chromium.org?utm_medium=email&utm_source=footer).  

![Deco's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUGoswBF5gKpF7XKeCVE7pdkBeXcdRsfh2OFX2suD9dh00Et-5kcw=s40-c)

### Deco

unread,

Apr 20, 2023, 7:49:35 AM4/20/23







Reply to author

Sign in to reply to author

Forward

Sign in to forward

Delete

You do not have permission to delete messages in this group

Copy link

Report message

Show original message

Either email addresses are anonymous for this group or you need the view member email addresses permission to view the original message

to William A., Chromium Extensions

Typo error: "There isn't you as a developer" to "There isn't anything you as a developer" 



![Oliver Dunk's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUzUEflsvjipGd7cvZEsFUHskmlfPymb4qDCb2t3fhdt4oaM5iB=s40-c)

### Oliver Dunk

unread,

Apr 20, 2023, 7:55:25 AM4/20/23







Reply to author

Sign in to reply to author

Forward

Sign in to forward

Delete

You do not have permission to delete messages in this group

Copy link

Report message

Show original message

Either email addresses are anonymous for this group or you need the view member email addresses permission to view the original message

to Deco, William A., Chromium Extensions

Plus one to Deco's excellent answer!

  

Some variance is expected, but we do try to keep the times down as much as possible.

  

Deferred publishing can help in some situations if you're planning for a launch, for example: [https://developer.chrome.com/docs/webstore/publish/#deferred-publishing](https://developer.chrome.com/docs/webstore/publish/#deferred-publishing)  

Oliver Dunk | DevRel, Chrome Extensions | [https://developer.chrome.com/](https://developer.chrome.com/) | London, GB

  

  





> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CABcX4Ue8ZhoYnu1KNTA0rEJy3Q1U-ShOOFxyxtmNmPn0LyFJ7Q%40mail.gmail.com](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CABcX4Ue8ZhoYnu1KNTA0rEJy3Q1U-ShOOFxyxtmNmPn0LyFJ7Q%40mail.gmail.com?utm_medium=email&utm_source=footer).  

![William A.'s profile photo](//lh3.googleusercontent.com/a-/ALV-UjWD_GQNcC0ZfrfG4GOFgyrcX5DLZdAgTvSVf6VJQ6QIH5k_yGc=s40-c)

### William A.

unread,

Apr 20, 2023, 8:28:23 AM4/20/23







Reply to author

Sign in to reply to author

Forward

Sign in to forward

Delete

You do not have permission to delete messages in this group

Copy link

Report message

Show original message

Either email addresses are anonymous for this group or you need the view member email addresses permission to view the original message

to Chromium Extensions, Oliver Dunk, William A., Chromium Extensions, Deco

Thank you for the great answers. This is very helpful. 



Reply all

Reply to author

Forward



0 new messages


