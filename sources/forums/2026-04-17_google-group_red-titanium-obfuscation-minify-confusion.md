---
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/2cO2apjQe5s
captured_at: '2026-04-17'
capture_method: script-rendered
source_type: forum
source_id: google-group
title_at_capture: Red Titanium Code Obfuscation warning -- I'm confused by it
author: null
evidence_class: b
topics: []
wayback_url: >-
  https://web.archive.org/web/20260417024636/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/2cO2apjQe5s
related_docs: []
notes: Fill in during curation.
thread_url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/2cO2apjQe5s
post_count: null
accepted_answer: null
---

# Red Titanium Code Obfuscation warning -- I'm confused by it

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

# Red Titanium Code Obfuscation warning -- I'm confused by it

449 views

Skip to first unread message



![Ajay Goel's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXiE7f0W7bLv1_MiVIO5THMtouFND6_ypW4A1FgwQcWXkHuZUqO=s40-c)

### Ajay Goel

unread,

Sep 30, 2023, 9:34:02 AM9/30/23

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

Hi there,

  

I have a long-standing extension in the Chrome Store with ID ehomdgjhgmbidokdgicgmdiedadncbgf. A few days ago I received a Red Titanium Code Obfuscation warning. The warning cited this:  

-   **Violation reference ID:** [Red Titanium](https://developer.chrome.com/docs/webstore/troubleshooting/#obfuscation)
-   **Violation:** Having obfuscated code in the package.
-   **Violating content:**
    -   **Code snippet:** gmassloader.js: var scriptstoget = \['https://' + loaderDomainCDN + '/ext2022/gmasssdk.js'
-   **How to rectify:** Replace the obfuscated code with human-readable code and resubmit the item.

I assumed that the warning was related to the obfuscation in the remotely loaded script gmasssdk.js. That script did have some minor obfuscation -- hex variables instead of human-readable variable names. So I UN-obfuscated that, and re-submitted, but the submission was rejected for the same reason.  
  
Note that I'm still on Manifest V2, so I still have remotely loaded scripts.  
  
Can anyone provide any insight as to why my submission after UN-obfuscating gmasssdk.js was rejected? Could it be that THIS actual line is considered obfuscated:  
  
var scriptstoget = 'https://' + loaderDomainCDN + '/ext2022/gmasssdk.js'  
  
loaderDomainCDN is just a variable representing the host that the script is retrieved from. The reason it's a variable is because different endpoints are tried until the script is successfully retrieved, since some networks block certain domains.  
  
Thanks,

Ajay Goel

  
  

![Deco's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUGoswBF5gKpF7XKeCVE7pdkBeXcdRsfh2OFX2suD9dh00Et-5kcw=s40-c)

### Deco

unread,

Sep 30, 2023, 9:37:45 AM9/30/23

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

to Ajay Goel, Chromium Extensions

Yes that's correct, the tldr is that since the variable is obfuscated, it doesn't provide it's intention clearly as such falls foul of this rule.

  

Cheers,

Deco

  





> \--  
> You received this message because you are subscribed to the Google Groups "Chromium Extensions" group.  
> To unsubscribe from this group and stop receiving emails from it, send an email to chromium-extens...@chromium.org.  
> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/9317ad59-c9b0-4af2-a33c-fdeace6828b4n%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/9317ad59-c9b0-4af2-a33c-fdeace6828b4n%40chromium.org?utm_medium=email&utm_source=footer).  

![Ajay Goel's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXiE7f0W7bLv1_MiVIO5THMtouFND6_ypW4A1FgwQcWXkHuZUqO=s40-c)

### Ajay Goel

unread,

Sep 30, 2023, 9:43:39 AM9/30/23

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

to Chromium Extensions, Deco, Chromium Extensions, Ajay Goel

That's shocking to me. Does that then mean that you're not allowed to set the value of any variable by concatenating strings with other variables? Doesn't that severely limit what you can do in JavaScript?  
  
So what's the solution? How do I make that line compliant, without having to hard-code the value of loaderDomainCDN?



![Stryder Crown's profile photo](//lh3.googleusercontent.com/a-/ALV-UjV6sPAqmn_GGrNAqYuR3NlkqbFu5HBMCJ_zSzSSKEnkcK1gXvFo=s40-c)

### Stryder Crown

unread,

Sep 30, 2023, 10:44:57 AM9/30/23

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

to Ajay Goel, Chromium Extensions, Deco

It sounds like a naive attempt to implement a constraint on malicious domains by preventing urls from being constructed dynamically. In this particular case, you might be better suited by creating a (hardcoded) map/array of all your valid domains and cycling through that instead of concat'ing them.  

  





> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/64e8ff88-b20e-4ca8-80d1-fb203debe24fn%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/64e8ff88-b20e-4ca8-80d1-fb203debe24fn%40chromium.org?utm_medium=email&utm_source=footer).  

![Patrick Kettner's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXAeZ7BcG6G83JtXobsIZw66NZtI4QR3PAkQFUOIGFQG17Oj1Q=s40-c)

### Patrick Kettner

unread,

Sep 30, 2023, 10:50:50 AM9/30/23

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

to Stryder Crown, Ajay Goel, Chromium Extensions, Deco

Speaking as someone on the Extensions team at Chrome...

  

If that was the only snippet listed as the violation, it sounds like a mistake of overzealous review. I would recommend opening an appeal via One Stop Support ([https://support.google.com/chrome\_webstore/contact/one\_stop\_support](https://support.google.com/chrome_webstore/contact/one_stop_support)) 

  





> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CADq%3D7qsJf5rU5gXk7YM315fg8gP93FcEMmytX%2BrNUsrxs4V-SQ%40mail.gmail.com](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CADq%3D7qsJf5rU5gXk7YM315fg8gP93FcEMmytX%2BrNUsrxs4V-SQ%40mail.gmail.com?utm_medium=email&utm_source=footer).  

![Ajay Goel's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXiE7f0W7bLv1_MiVIO5THMtouFND6_ypW4A1FgwQcWXkHuZUqO=s40-c)

### Ajay Goel

unread,

Sep 30, 2023, 2:06:05 PM9/30/23

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

to Chromium Extensions, Stryder Crown, Chromium Extensions, Deco, Ajay Goel

Stryder:

  

That's exactly what I am doing (hard coded array of valid domains and cycling through). This is at the top of the code:  
  
const arrayCDN = \["[cdn.gmass.us](http://cdn.gmass.us)", "[cdn.apigma3.net](http://cdn.apigma3.net)", "[cdn.gmass.co](http://cdn.gmass.co)", "[www.gmass.co](http://www.gmass.co)", "[ext.gmass.us](http://ext.gmass.us)", "[cdn.gmapi1.net](http://cdn.gmapi1.net)", "[cdn.wordzen.com](http://cdn.wordzen.com)"\];  
  
And then the loop tries each endpoint until one succeeds.  
  
Anyway, thanks for the insight. I could replace that line where the URL is dynamically constructed and just have a bunch of IF conditions with fixed URLs. Will probably try that.  
  
ajay  
  



![Ajay Goel's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXiE7f0W7bLv1_MiVIO5THMtouFND6_ypW4A1FgwQcWXkHuZUqO=s40-c)

### Ajay Goel

unread,

Sep 30, 2023, 2:06:35 PM9/30/23

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

to Chromium Extensions, Patrick Kettner, Ajay Goel, Chromium Extensions, Deco, Stryder Crown

Thanks Patrick. I actually did just that, this morning. So we'll see what happens.



![Patrick Kettner's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXAeZ7BcG6G83JtXobsIZw66NZtI4QR3PAkQFUOIGFQG17Oj1Q=s40-c)

### Patrick Kettner

unread,

Sep 30, 2023, 2:16:31 PM9/30/23

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

to Ajay Goel, Chromium Extensions, Deco, Stryder Crown

Can you share the ticket number?



![Ajay Goel's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXiE7f0W7bLv1_MiVIO5THMtouFND6_ypW4A1FgwQcWXkHuZUqO=s40-c)

### Ajay Goel

unread,

Sep 30, 2023, 2:18:17 PM9/30/23

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

to Chromium Extensions, Patrick Kettner, Chromium Extensions, Deco, Stryder Crown, Ajay Goel

Yes! It's:  
  
6-9077000034747



![Stryder Crown's profile photo](//lh3.googleusercontent.com/a-/ALV-UjV6sPAqmn_GGrNAqYuR3NlkqbFu5HBMCJ_zSzSSKEnkcK1gXvFo=s40-c)

### Stryder Crown

unread,

Sep 30, 2023, 3:29:21 PM9/30/23

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

to Ajay Goel, Chromium Extensions, Deco

I was suggesting storing the _full_ url, i.e. code below. But if someone can hand approve it (or indeed, didn't grok the original code) then no worries.  

  

\`\`\`

const arrayCDN = \[  
    "[https://cdn.gmass.us/ext2022/gmasssdk.js](https://cdn.gmass.us/ext2022/gmasssdk.js)",  
    "[https://cdn.apigma3.net/ext2022/gmasssdk.js](https://cdn.apigma3.net/ext2022/gmasssdk.js)",  
    "[https://cdn.gmass.co/ext2022/gmasssdk.js](https://cdn.gmass.co/ext2022/gmasssdk.js)",  
    "[https://www.gmass.co/ext2022/gmasssdk.js](https://www.gmass.co/ext2022/gmasssdk.js)",  
    "[https://ext.gmass.us/ext2022/gmasssdk.js](https://ext.gmass.us/ext2022/gmasssdk.js)",  
    "[https://cdn.gmapi1.net/ext2022/gmasssdk.js](https://cdn.gmapi1.net/ext2022/gmasssdk.js)",  
    "[https://cdn.wordzen.com/ext2022/gmasssdk.js](https://cdn.wordzen.com/ext2022/gmasssdk.js)"  
\];

\`\`\`  



![Ajay Goel's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXiE7f0W7bLv1_MiVIO5THMtouFND6_ypW4A1FgwQcWXkHuZUqO=s40-c)

### Ajay Goel

unread,

Sep 30, 2023, 9:06:11 PM9/30/23

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

to Chromium Extensions, Stryder Crown, Chromium Extensions, Deco, Ajay Goel

Ah, gotcha, makes sense. I will resort to that if my other avenues to remedy this situation fail. Thank you!



![Ajay Goel's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXiE7f0W7bLv1_MiVIO5THMtouFND6_ypW4A1FgwQcWXkHuZUqO=s40-c)

### Ajay Goel

unread,

Oct 15, 2023, 10:14:36 PM10/15/23

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

to Chromium Extensions, Ajay Goel, Chromium Extensions

For anyone still interested, and to help out others that find themselves in this position in the future, I finally got this resolved, but it took multiple back-and-forths with the developer support team.  
  
Here's the full conversation minus the initial message I sent through the web-based support form:  
[https://dl.dropbox.com/scl/fi/8uouv3rug753qyll8a9mu/chrome\_YL4nIGfZM8.png?rlkey=41jjckhbky1hvtc4q8l6l6a9j&dl=0](https://dl.dropbox.com/scl/fi/8uouv3rug753qyll8a9mu/chrome_YL4nIGfZM8.png?rlkey=41jjckhbky1hvtc4q8l6l6a9j&dl=0)



![Stryder Crown's profile photo](//lh3.googleusercontent.com/a-/ALV-UjV6sPAqmn_GGrNAqYuR3NlkqbFu5HBMCJ_zSzSSKEnkcK1gXvFo=s40-c)

### Stryder Crown

unread,

Oct 16, 2023, 8:44:53 AM10/16/23

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

to Ajay Goel, Chromium Extensions

Am I reading this thread correctly?  They flagged your extension, then acknowledged it was entirely compliant and _then_ said there was nothing they could do and made you re-submit the extension in its entirety?  Is that because the previous version was flagged?  If the parser that flagged this is clearly tagging false positives, is that being corrected/addressed or is this something we should all anticipate having to address in our submissions?  

  





> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/6b0d2534-d253-4b39-8613-15573ac1c462n%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/6b0d2534-d253-4b39-8613-15573ac1c462n%40chromium.org?utm_medium=email&utm_source=footer).  

![Oliver Dunk's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUzUEflsvjipGd7cvZEsFUHskmlfPymb4qDCb2t3fhdt4oaM5iB=s40-c)

### Oliver Dunk

unread,

Oct 17, 2023, 3:53:38 AM10/17/23

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

to Stryder Crown, Ajay Goel, Chromium Extensions

Hi Stryder,

  

We aren't easily able to change the verdict on a specific submission, so sometimes the review team will ask for you to repeat your submission so we can more easily approve it. I would expect that to be a much faster review though since the extension has already been looked at.

  

We have a mix of automated and manual review and I can't say what specifically happened here. But we do keep an eye on appeals and if we notice trends, we'll work to see if we can make any changes to help.  

Oliver Dunk | DevRel, Chrome Extensions | [https://developer.chrome.com/](https://developer.chrome.com/) | London, GB

  

  





> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CADq%3D7qu2LKagO75tEHL3dnpN%2BChGQyBEXcbydWaojwDxPs8hKQ%40mail.gmail.com](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CADq%3D7qu2LKagO75tEHL3dnpN%2BChGQyBEXcbydWaojwDxPs8hKQ%40mail.gmail.com?utm_medium=email&utm_source=footer).  

Reply all

Reply to author

Forward



0 new messages


