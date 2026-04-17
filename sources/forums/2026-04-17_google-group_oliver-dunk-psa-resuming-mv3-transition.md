---
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/X-aHqPOKcQU
captured_at: '2026-04-17'
capture_method: script-rendered
source_type: forum
source_id: google-group
title_at_capture: 'PSA: Resuming the transition to Manifest V3'
author: null
evidence_class: b
topics: []
wayback_url: null
related_docs: []
notes: Fill in during curation.
thread_url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/X-aHqPOKcQU
post_count: null
accepted_answer: null
---

# PSA: Resuming the transition to Manifest V3

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

# PSA: Resuming the transition to Manifest V3

1,137 views

Skip to first unread message



![Oliver Dunk's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUzUEflsvjipGd7cvZEsFUHskmlfPymb4qDCb2t3fhdt4oaM5iB=s40-c)

### Oliver Dunk

unread,

Nov 16, 2023, 9:07:16 AM11/16/23

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

Hello everyone,  
  
We’ve just published a [blog post announcing that we are resuming the transition to Manifest V3](https://developer.chrome.com/blog/resuming-the-transition-to-mv3/). It took a bit longer than we originally expected when we paused the MV2 deprecation timeline beginning this year. We really wanted to make sure that we’d addressed all the feedback that we’ve received.  
  
Thank you all for your patience and support during this.  
  
Oliver on behalf of the Chrome Extensions Team  

  

Message has been deleted

![wOxxOm's profile photo](//lh3.googleusercontent.com/a-/ALV-UjX4hF_IK5jhOzipxM-zPHfxUcqF61e2IbXJZW-yVpKo17jLulo=s40-c)

### wOxxOm

unread,

Nov 16, 2023, 11:29:43 PM11/16/23

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

to Chromium Extensions, Oliver Dunk

\>  We really wanted to make sure that we’d addressed all the feedback that we’ve received.  
  

Lots of reported use cases are still unaddressed and judging by the rate of progress so far you won't be able to address them in time.  

  

P.S. Edited my initial response because I realized it's likely that you genuininely believe in what you wrote since you'rve just recently started to participate in extension community. Hopefully you'll have time to revisit all the reports in [crbug.com](http://crbug.com) and change your opinion.



![wOxxOm's profile photo](//lh3.googleusercontent.com/a-/ALV-UjX4hF_IK5jhOzipxM-zPHfxUcqF61e2IbXJZW-yVpKo17jLulo=s40-c)

### wOxxOm

unread,

Nov 17, 2023, 12:05:20 AM11/17/23

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

to Chromium Extensions, wOxxOm, Oliver Dunk

To name a few off the top of my head that are likely to take more than a year to fix:

-   The service worker registration, update, and subsequent wake up are still unreliable - this is being investigated but there's no guarantee it'll be fixed in time.
-   Lots of MV2 extensions that use webRequestBlocking for various intelligent processing and tweaking of navigation behavior - there is no good replacement, the existing workarounds are either inconvenient for the users or completely unreliable.
-   The multiple reported limitations of the service worker specification cause a lot of pain for developers and will cause a lot more as it's the least compatible technology designed specifically for remote web pages, so its core design principles make little to no sense for extensions. You promised to remove these limits eventually, but so far only a couple of trivial cases were implemented e.g. the static ES modules in SW support was already complete by the time it was enabled for ManifestV3, but you didn't enable dynamic imports or postponed importScripts in all these years since the problem was reported, which is not trivial and a fix may require years causing a lot of pain and inconvenience for developers of nontrivial extensions.
-   Extensions that have to use the offscreen API consume twice as much memory and are unnecessarily complicated, especially the non-trivial cross-browser extensions.
-   The offscreen document is not a solution, it's just a temporary terribly inefficient workaround and you promised to provide real solutions for the problems caused by your choice to use service workers instead of event pages - where's the schedule on that so we can track the progress and keep you accountable for your promises?
-   There's still no good user-friendly and efficient API to allow the user to enter custom JS code that will run on demand (i.e. after pressing a button in the extension popup); the workaround is either affected by site's CSP so extensions have to reduce the site's security to remove it (and they can't remove <meta> CSP) or we have to register a controlling userscript on all URLs which will run the custom code on-demand i.e. it'd be wasteful ~99.99999% of time.



![Peter Bloomfield's profile photo](https://lh3.googleusercontent.com/a/default-user=s40-c)

### Peter Bloomfield

unread,

Nov 20, 2023, 12:53:56 AM11/20/23

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

to Chromium Extensions, Oliver Dunk

Hi Oliver,

  

Thanks for the update. Please can you tell me when the Chrome Web Store will stop accepting updates for existing manifest v2 extensions, and when will it stop serving them altogether?

  

The reason I ask is that a number of our enterprise customers still use Chromebooks long past their Auto Update Expiry, meaning they'll never support mv3. When the Chrome Web Store stops serving mv2, they won't be able to get the extensions at all. Our aim is to move them over to self-hosted extensions, but it would be useful to know what the deadline will be for that.

  

Thanks,

Peter  
  



![Oliver Dunk's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUzUEflsvjipGd7cvZEsFUHskmlfPymb4qDCb2t3fhdt4oaM5iB=s40-c)

### Oliver Dunk

unread,

Nov 20, 2023, 9:56:17 AM11/20/23

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

to wOxxOm, Chromium Extensions

Hi wOxxOm,  
  
Having addressed the [known critical platform gaps](https://developer.chrome.com/docs/extensions/migrating/known-issues/), we believe developers have the building blocks to successfully migrate. We fixed several service worker issues as part of this and are now seeing far fewer reports of issues. In other cases, like with one time injection for user scripts, we [called this out](https://github.com/w3c/webextensions/blob/main/proposals/user-scripts-api.md#execute-user-scripts-one-time) as something we’d like to consider in the future.  
  
We explicitly decided not to support the blocking version of webRequest. This is a tradeoff, and we are aware there may be some gaps between this and what is possible in declarativeNetRequest, but we ultimately decided this was the right path.  
  
Thanks for the feedback, and know that we will continue to consider suggestions and look to improve the platform.

Oliver Dunk | DevRel, Chrome Extensions | [https://developer.chrome.com/](https://developer.chrome.com/) | London, GB

  



![Oliver Dunk's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUzUEflsvjipGd7cvZEsFUHskmlfPymb4qDCb2t3fhdt4oaM5iB=s40-c)

### Oliver Dunk

unread,

Nov 20, 2023, 10:00:20 AM11/20/23

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

to Peter Bloomfield, Chromium Extensions

Hi Peter,

  

Thanks for the question!

  

I don't think we said anything about either of these things in our announcement. Let me follow-up there and find out what we are comfortable sharing at this stage.

  

Thanks,

  

Oliver Dunk | DevRel, Chrome Extensions | [https://developer.chrome.com/](https://developer.chrome.com/) | London, GB



![wOxxOm's profile photo](//lh3.googleusercontent.com/a-/ALV-UjX4hF_IK5jhOzipxM-zPHfxUcqF61e2IbXJZW-yVpKo17jLulo=s40-c)

### wOxxOm

unread,

Nov 20, 2023, 10:01:54 AM11/20/23

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

to Chromium Extensions, Oliver Dunk, Chromium Extensions, wOxxOm

\>  We explicitly decided not to support the blocking version of webRequest. This is a tradeoff, and we are aware there may be some gaps between this and what is possible in declarativeNetRequest, but we ultimately decided this was the right path.  
  

Your team promised to evaluate the gaps on a use-case basis with the goal of closing them by providing the alternative (declarative) solutions. Until those bug reports are fixed or closed as wontfix, your claim that you "addressed all the feedback" is misleading and incorrect.



![Sebastian Benz's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUucyyVbSsBi-ul_Ue6kqAc6pWD0L_D-0hd0YIDpLGMhQEkQVDeDQ=s40-c)

### Sebastian Benz

unread,

Nov 20, 2023, 1:07:36 PM11/20/23

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

to Chromium Extensions, Oliver Dunk, Chromium Extensions, peter.bl...@qoria.com

Hi Peter,

  

we will allow MV2 extensions to be updated via the Web Store for as long as any supported client allows them. For enterprise extensions this means at least until June 2025. 

  

Hope that helps,

  

Sebastian  
  



![Jói Sigurdsson's profile photo](//lh3.googleusercontent.com/a-/ALV-UjX9EdFgY0IwDuiO2o_Tlu6v4P544mFB6_9NBqwNbRboE-30GpJR=s40-c)

### Jói Sigurdsson

unread,

Nov 21, 2023, 7:47:00 AM11/21/23

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

to Chromium Extensions, Sebastian Benz, Oliver Dunk, Chromium Extensions, peter.bl...@qoria.com

Hi Sebastian,

  

Thanks for the details on allowing MV2 extensions to be updated for as long as any supported client allows them.

  

Will it be possible to specify in manifest or somehow in the web store, that users with Chrome versions older than a cut-off point version of Chrome should continue to get the MV2 version, and that users with a newer versions of Chrome should start receiving the MV3 version? This was one of the issues we had identified when we looked into roll-out of MV3 at the time - that it would maybe be OK for our users on recent versions of Chrome, but corporate users might be on significantly older versions of Chrome and as such should not receive an update to the MV3 version (and would need to still be able to install the MV2 version).

  

Best regards,

Jói



![NERBlock Developer's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUHrv5b3TTr9nGjEN5EtxfvYi71cpjuCRHL5-GPOsO7DoyFenqD=s40-c)

### NERBlock Developer

unread,

Nov 21, 2023, 8:40:43 AM11/21/23

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

to Chromium Extensions, Sebastian Benz, Oliver Dunk, Chromium Extensions, peter.bl...@qoria.com

Hi Sebastian,

  

And when will you stop accepting updates of existing mv2 extensions into the webstore from developers? This isn't covered in the latest blogpost despite being the effective deadline for devs to switch over to mw3 if they don't want to risk losing their users in case something breaks and the extension becomes unusable.

  

Thanks,

nerblock  
  



![Sebastian Benz's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUucyyVbSsBi-ul_Ue6kqAc6pWD0L_D-0hd0YIDpLGMhQEkQVDeDQ=s40-c)

### Sebastian Benz

unread,

Nov 21, 2023, 12:02:59 PM11/21/23

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

to Chromium Extensions, NERBlock Developer, Sebastian Benz, Oliver Dunk, Chromium Extensions, peter.bl...@qoria.com

Hey Jói and nerblock,

  

\> Will it be possible to specify in manifest or somehow in the web store, that users with Chrome versions older than a cut-off point version of Chrome should continue to get the MV2 version, and that users with a newer versions of Chrome should start receiving the MV3 version? This was one of the issues we had identified when we looked into roll-out of MV3 at the time - that it would maybe be OK for our users on recent versions of Chrome, but corporate users might be on significantly older versions of Chrome and as such should not receive an update to the MV3 version (and would need to still be able to install the MV2 version).

  

This will not be supported. The Web Store only serves the latest version of your extension. If you need to continue supporting clients on older versions of Chrome you need to self-host the extension.  

  

\> And when will you stop accepting updates of existing mv2 extensions into the webstore from developers? This isn't covered in the latest blogpost despite being the effective deadline for devs to switch over to mw3 if they don't want to risk losing their users in case something breaks and the extension becomes unusable.

  

We will allow MV2 extensions to be updated via the Web Store for as long as any supported client allows them. So being stuck on a broken MV2 version of an extension is not a risk. Also note that we plan to launch rollback support in the Web Store before June to help ease the migration and reduce the risk of MV3 rollouts. 

  

Cheers,

  

Sebastian



![Jói Sigurdsson's profile photo](//lh3.googleusercontent.com/a-/ALV-UjX9EdFgY0IwDuiO2o_Tlu6v4P544mFB6_9NBqwNbRboE-30GpJR=s40-c)

### Jói Sigurdsson

unread,

Nov 21, 2023, 12:14:53 PM11/21/23

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

to Sebastian Benz, Chromium Extensions, NERBlock Developer, Oliver Dunk, peter.bl...@qoria.com

Hi Sebastian,  

  

Thanks for the response.  

  

> This will not be supported. The Web Store only serves the latest version of your extension. If you need to continue supporting clients on older versions of Chrome you need to self-host the extension.  

  

OK, but self-hosting is an enterprise-only feature as far as I understand it, meaning we'd need to ask enterprise customers to make changes to Group Policy to distribute the separate extension to their users. Am I getting that right?  

  

Could we instead ask our enterprise customers who are stuck on older versions of Chrome, to pin the extension version using Group Policy? Would they then continue to receive the older, MV2, version of our extension?  

  

Best regards,  

Jói

  

![ ](https://ci6.googleusercontent.com/proxy/O-jNyy8fpkxVVkmFEiaddODtInQjMQiaHdQbretDTYkHLgqZ4c1qw-zm5C1d_4om8I4Z5m1UUFqAspn2u9ojBk53SGR6qA9h1TkpRjeE3Peoe91MJNPLelrkCnED3bBH96aLbdfoR8zhqlzViysTPHjSWKzFET8-dIPB_TB34SZvORvlUK983CwkIVc_N7RsECnBdzYsVwatdbJd3JoJnb7fHPjVEAhwn2dg73DUTBO82VMR57ZV22OOoC0ut2VWD0ZdaXDqZsPBcgAHk3-SSPxM2yjdoi1P3nOKv678uvYMW0kFzxd1wwKWpqa0asJcsTZg4FF0FQ=s0-d-e1-ft#https://r.superhuman.com/yTqQLkhxCGfaiD5c5K9re-7RZvTwT9gWxN8WtEaVjuY9y19FOQzDcusycO0mJPrgQnAAXhqXWj5f_VLpxbQkQdHJAxZboFSB7vQLvsI1Q83HqjjmrBA6YGYEpGDWrl4YvBGMkGwJtzFahg_zDeHZlFCKw-AjinMgW1au-qcb2n_SGYG-norh8uDNRYcNop2pcGGPsg.gif)

  

![](https://ci6.googleusercontent.com/proxy/Ptlv7OGhUde0q9oKuw9-R9uVuvQZ8QzgacKHPa8Ir6Z0QqJvrJJBNux0XNt1hIhSztjzbHTFYnU4N1t-VyoUq_wVP3RlnYXY_EkiPfu3Bz9B=s0-d-e1-ft#https://crankwheel.com/static/redesign/img/crankwheel_logo.png)  

Jói Sigurdsson / Founder & CEO   
j...@crankwheel.com

CrankWheel   
[+1 (877) 753-2945](tel:\(877\)%20753-2945)  
Dalshraun 1, Hafnarfjordur 220, Iceland   
[http://crankwheel.com/](http://crankwheel.com/)

  

  





> \--  
> You received this message because you are subscribed to a topic in the Google Groups "Chromium Extensions" group.  
> To unsubscribe from this topic, visit [https://groups.google.com/a/chromium.org/d/topic/chromium-extensions/X-aHqPOKcQU/unsubscribe](https://groups.google.com/a/chromium.org/d/topic/chromium-extensions/X-aHqPOKcQU/unsubscribe).  
> To unsubscribe from this group and all its topics, send an email to chromium-extensions+unsubscribe@chromium.org.  
> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/37316219-43ab-4ee1-ab4c-c81570662006n%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/37316219-43ab-4ee1-ab4c-c81570662006n%40chromium.org?utm_medium=email&utm_source=footer).

  

![Joe Floe's profile photo](//lh3.googleusercontent.com/a-/ALV-UjU6jWkLXZ6hU0l7rUbGiH86Mjwu2f7ZrYlNJQu5JHkd4n9nSw=s40-c)

### Joe Floe

unread,

Nov 29, 2023, 5:55:32 AM11/29/23

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

to Chromium Extensions, Jói Sigurdsson, Chromium Extensions, NERBlock Developer, Oliver Dunk, peter.bl...@qoria.com, Sebastian Benz

Hi Oliver,

May you help to draw Chrome developers' attention to this bug? It is a serious gap between MV2 and MV3 for us, as stated in the last comment there:  
[https://bugs.chromium.org/p/chromium/issues/detail?id=1408888](https://bugs.chromium.org/p/chromium/issues/detail?id=1408888)  
  







> > To unsubscribe from this group and all its topics, send an email to chromium-extens...@chromium.org.



![Oliver Dunk's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUzUEflsvjipGd7cvZEsFUHskmlfPymb4qDCb2t3fhdt4oaM5iB=s40-c)

### Oliver Dunk

unread,

Nov 29, 2023, 6:49:07 AM11/29/23

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

to Joe Floe, Chromium Extensions, Jói Sigurdsson, NERBlock Developer, peter.bl...@qoria.com, Sebastian Benz

Hi Joe,

  

Am I understanding correctly that you previously used the chrome.webRequest API, but were considering the chrome.debugger API with the Fetch namespace as an alternative?

  

We intentionally moved away from allowing dynamic, blocking access to network requests so I don't think this is something we would prioritize fixing in the context of the MV3 migration.

  

Have you looked at if the [chrome.declarativeNetRequest](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/) API might work? It would also be useful to know more about your use case, since that may give some hints at solutions (for example, blocking webRequest is still available for policy-installed extensions).

  

Oliver Dunk | DevRel, Chrome Extensions | [https://developer.chrome.com/](https://developer.chrome.com/) | London, GB



![wOxxOm's profile photo](//lh3.googleusercontent.com/a-/ALV-UjX4hF_IK5jhOzipxM-zPHfxUcqF61e2IbXJZW-yVpKo17jLulo=s40-c)

### wOxxOm

unread,

Nov 29, 2023, 7:01:41 AM11/29/23

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

to Chromium Extensions, Oliver Dunk, Chromium Extensions, Jói Sigurdsson, NERBlock Developer, peter.bl...@qoria.com, Sebastian Benz, Joe Floe

You should provide an alternative API for cookie headers to actually address the problem, because this is an important use case not covered by chrome.cookies API. There are many use cases, here's one: it's used by Tampermonkey/Violentmonkey to extract cookies from a network response's Set-Cookie headers and remove them to avoid applying them to the browser profile, and this feature is used by many popular userscripts that scrape info from one site where the user is logged-on to add it into another. Currently, you either abandon such users or effectively require them to install the extension via policies, which is on top of being inconvenient may be impossible due to other policies in the company, there's also no guarantee that webRequestBlocking will be kept around forever.



![wOxxOm's profile photo](//lh3.googleusercontent.com/a-/ALV-UjX4hF_IK5jhOzipxM-zPHfxUcqF61e2IbXJZW-yVpKo17jLulo=s40-c)

### wOxxOm

unread,

Nov 29, 2023, 7:43:06 AM11/29/23

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

to Chromium Extensions, wOxxOm, Oliver Dunk, Chromium Extensions, Jói Sigurdsson, NERBlock Developer, peter.bl...@qoria.com, Sebastian Benz, Joe Floe

To clarify, "where the user is logged-on" means a multi-user setup where the custom credentials are supplied by the user of the userscript to be used instead of whatever is currently set in the browser profile. There are also extensions for Chrome that emulate such multi-user containers via webRequestBlocking, and they're broken too.

  

Overall, the decision to disable webRequestBlocking and replace it with declarativeNetRequest is based on the wrong assumptions and not on the actual investigation of how it is used in the field and in what specific cases it really degrades performance/security. Someday you'll probably want to perform such an investigation and you'll see that there's only one such major case: content blockers that observe all requests. There are dozens of other important use cases not covered by declarativeNetRequest where webRequestBlocking doesn't actually degrade the performance (because it's used with resourceTypes or url conditions that match rarely e.g. once a day) and doesn't worsen the user's security (because the extension has host\_permissions for this site anyway in order to provide its functionality). A much more sensible solution would be to introduce limits e.g. allow webRequestBlocking only for main\_frame/sub\_frame on requests not made by the extension itself (this alone reduces the frequency of the API events ~100 times) or add a quota like NUMBER\_OF\_REQUESTS\_PER\_FRAME or PER\_HOUR.



![Cuyler Stuwe's profile photo](//lh3.googleusercontent.com/a-/ALV-UjV-mxEuckDxnVjYZL2U2eYbFJX8ZlUEHUbI61QNIv08B-d6aUBv=s40-c)

### Cuyler Stuwe

unread,

Nov 30, 2023, 10:29:41 AM11/30/23

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

to wOxxOm, Chromium Extensions, Oliver Dunk, Jói Sigurdsson, NERBlock Developer, peter.bl...@qoria.com, Sebastian Benz, Joe Floe

Given the recent spotlight on AI, I think it's especially weird that Chrome has eliminated the ability for extensions to view the entire context of a network request.

  

In a previous cybersecurity startup I worked for, one of our extension's headlining features involved deploying an AI model which would block/redirect requests according to how the model responded to all of the request's context.

  

We rewrote the extension in a hurry under the urgency of the initial MV3 deadlines, and ultimately we had to scrap that feature entirely (leaving a HUGE feature gap compared to customer expectations) because there simply was no effective way to make the feature work properly without being able to read network requests. AI models are a sort of "black box" in a way, and so it wasn't possible to have the same effect by simply "declaring a list of static rules".

  





> You received this message because you are subscribed to the Google Groups "Chromium Extensions" group.  
> To unsubscribe from this group and stop receiving emails from it, send an email to chromium-extens...@chromium.org.  
> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/583c836b-7ff7-4c9e-b700-508a30be87e0n%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/583c836b-7ff7-4c9e-b700-508a30be87e0n%40chromium.org?utm_medium=email&utm_source=footer).  

![Cuyler Stuwe's profile photo](//lh3.googleusercontent.com/a-/ALV-UjV-mxEuckDxnVjYZL2U2eYbFJX8ZlUEHUbI61QNIv08B-d6aUBv=s40-c)

### Cuyler Stuwe

unread,

Nov 30, 2023, 10:34:13 AM11/30/23

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

to wOxxOm, Chromium Extensions, Oliver Dunk, Jói Sigurdsson, NERBlock Developer, peter.bl...@qoria.com, Sebastian Benz, Joe Floe

All-in-all, I think this type of thing I just mentioned is just evidence that when you build a general platform, you can't just enumerate all of the specific use-cases you can think up and build to support only those use-cases. This seems like it's applying "product thinking" to "platforms", but "platform as a product" is an oxymoron full of mutual incompatibilities.



![Khan Sahab's profile photo](https://lh3.googleusercontent.com/a/default-user=s40-c)

### Khan Sahab

unread,

Nov 30, 2023, 10:35:10 AM11/30/23

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

to Cuyler Stuwe, wOxxOm, Chromium Extensions, Oliver Dunk, Jói Sigurdsson, NERBlock Developer, peter.bl...@qoria.com, Sebastian Benz, Joe Floe





> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CA%2BYuxdfCw\_CiV%3DZX7gTY1buo0oSGZ2aH%2Bhht%2BKhzGvmqU6aKkQ%40mail.gmail.com](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CA%2BYuxdfCw_CiV%3DZX7gTY1buo0oSGZ2aH%2Bhht%2BKhzGvmqU6aKkQ%40mail.gmail.com?utm_medium=email&utm_source=footer).  

![hrg...@gmail.com's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUrMLri16e-4R5f8midFeMtYLlGdMCJ2VX7mzFCERz_1SDXU2Ko=s40-c)

### hrg...@gmail.com

unread,

Nov 30, 2023, 4:42:10 PM11/30/23

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

to Chromium Extensions, Cuyler Stuwe, Chromium Extensions, Oliver Dunk, Jói Sigurdsson, NERBlock Developer, peter.bl...@qoria.com, Sebastian Benz, Joe Floe, wOxxOm

> when you build a general platform, you can't just enumerate all of the specific use-cases you can think up and build to support only those use-cases.

  

The Extensions Team has shown an uncanny obsession with use cases throughout the entire MV3 transition. This is bad software engineering in general, unless your motivation is to limit the possible uses of the product so that the manufacturer cannot be surprised by use cases they didn't think about.

MV2 was all about extending the capabilities of the platform. Whereas MV3 is about putting a cap on those capabilities.

  

![Rodney Kuhn's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVRKmTmGEMt6me9wMJPNntt4xEelu5iwwrKm2JCyIuqZs-ll0Ix=s40-c)

### Rodney Kuhn

unread,

Nov 30, 2023, 10:56:40 PM11/30/23

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

to Oliver Dunk, Chromium Extensions

Dear Chromium Team,  
  
I am writing on behalf of small startups worldwide to express our thoughts about the transition timelines for Manifest V3. We understand and appreciate the significant effort that has gone into developing Manifest V3 and are eager to align with these changes.  
  
However, we are facing a considerable challenge with the current 6-month deadline for this transition. As startups with limited resources, adapting to such a significant update in a relatively short period is extremely challenging, especially considering our other priorities. The absence of a definitive final version of Manifest V3 over the past year/s has hindered our ability to start early on this transition, as it limited our ability to plan and implement the necessary changes effectively.  
  
In light of these circumstances, we are respectfully requesting an extension of the transition period. An extended timeline would be immensely beneficial, allowing us to ensure a smooth and successful integration of Manifest V3 without jeopardizing our operational stability.  
  
We are fully committed to complying with the new standards and are eager to continue contributing to the Chromium ecosystem. Your understanding and support in granting us additional time would be greatly appreciated and would go a long way in helping small companies like ours thrive in an ever-evolving digital landscape.  
  
We look forward to your response and any further guidance you can provide.  
  
Warm regards,

  

[![](https://ci3.googleusercontent.com/mail-sig/AIorK4w8ivbLlkaGmOpnivJn8aGWIjItbtlf3mtFcIRAI3x6cKBUoTHbvOtoVccEl22tnXSdwwCgzkg)](http://sortd.com/?utm_source=email_sig&utm_medium=email&utm_campaign=Ro_Ku)  

**Rodney Kuhn**  

  

  





> \--  
> You received this message because you are subscribed to the Google Groups "Chromium Extensions" group.  
> To unsubscribe from this group and stop receiving emails from it, send an email to chromium-extens...@chromium.org.  

> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CAOsQqBmzPR1ynp7W7r%3DgjP1e\_XmrVbrFU486Oe\_%3DcSfikG%3D4qw%40mail.gmail.com](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CAOsQqBmzPR1ynp7W7r%3DgjP1e_XmrVbrFU486Oe_%3DcSfikG%3D4qw%40mail.gmail.com?utm_medium=email&utm_source=footer).  

![](https://ci5.googleusercontent.com/proxy/hCIV7BWyKcXfhvDKFpPgSxMS0ZXNd3b4wFPVKf0hZRW85otuwBFcRB36MPFdkzqE2ZpzOcDt1XW__8DPlT41I_OHGMLdzo5g_m-Gdlix-iXatyBMb6Yxtr6lMUKLVYkRLvsclgBmgGPbHw=s0-d-e1-ft#https://app.sortd.com/rr/65697ecef9b659f0e52c0433?from=7318accbfdbcd4ab18cf5f424866c2f9)

![Aamir Mansoor's profile photo](//lh3.googleusercontent.com/a-/ALV-UjW0hpdgbdV8tlvKrFZt3bHNLpcxWiiiPrt2GLc4ozcnAvlsddM=s40-c)

### Aamir Mansoor

unread,

Dec 5, 2023, 1:33:36 PM12/5/23

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

to Chromium Extensions, Oliver Dunk

Hi Olive + Chrome team,   
  
Since 2014, our startup has been developing our primary application using the Chrome Web Store. We are well-acquainted with the policies of the Chrome Web Store and their evolution over time.  
  
The transition from Manifest V2 to Manifest V3 has introduced several beneficial improvements. We have comfortably transitioned our extension from MV2 to MV3.  
  
However, we are encountering challenges with the development of new features. Our current primary concern involves the Content Security Policy (CSP) rules, which we find excessively restrictive. Consider the following scenarios involving a Chrome Extension that primarily utilizes a Side Panel for its user interface:  

-   \-**Google Analytics**: We are unable to integrate Google Analytics due to CSP restrictions that prevent the use of script tags. As there are no standalone Google Analytics packages available on npmjs, we are considering discontinuing its use.
-   **Intercom**: Our goal is to incorporate an Intercom chat bubble within our app for product announcements and live chat support. While this is easily implemented on webpages via a script tag, CSP restrictions impede this functionality within our extension.

We have noted your recent updates concerning user scripts and sandboxing. Unfortunately, these do not seem to address these specific scenarios.  
  
Is there an existing open issue for these issues, or a way for us to monitor progress more closely?  
  
Thank you



![Patrick Kettner's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXAeZ7BcG6G83JtXobsIZw66NZtI4QR3PAkQFUOIGFQG17Oj1Q=s40-c)

### Patrick Kettner

unread,

Dec 6, 2023, 2:06:42 AM12/6/23

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

to Aamir Mansoor, Chromium Extensions, Oliver Dunk

Hi Aamir!

  

We actually published a guide for [Google Analytics v4](https://developer.chrome.com/docs/extensions/how-to/integrate/google-analytics-4) a bit ago. As for Intercom, I don't use the tool so I don't have any insight at the moment. What is the specific problem you are encountering?

  

patrick

  





> \--  
> You received this message because you are subscribed to the Google Groups "Chromium Extensions" group.  
> To unsubscribe from this group and stop receiving emails from it, send an email to chromium-extens...@chromium.org.  

> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/e92d281e-97c7-476f-be02-16cc7758d912n%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/e92d281e-97c7-476f-be02-16cc7758d912n%40chromium.org?utm_medium=email&utm_source=footer).  

![Mitchell's profile photo](//lh3.googleusercontent.com/a-/ALV-UjU1yL0PIepp1y5oIs54TPFcx3EGybmrK7_rsKY71k5LrZZoQnOW=s40-c)

### Mitchell

unread,

Dec 12, 2023, 9:13:11 AM12/12/23

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

to Chromium Extensions, Sebastian Benz, Oliver Dunk, peter.bl...@qoria.com

Hi Sebastian,

  

My question is mainly around any additional restrictions after MV2 disablement rollout (starting in June 2024). For our clients, we get our extension reviewed and approved through the Web Store, then distribute the extension outside the Web Store (for version control). Will this still be possible after June 2024? Can we continue to install outside the Web Store without GPO required?

  

Thanks,

  

Mitchell  
  



![Patrick Kettner's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXAeZ7BcG6G83JtXobsIZw66NZtI4QR3PAkQFUOIGFQG17Oj1Q=s40-c)

### Patrick Kettner

unread,

Dec 14, 2023, 5:45:43 AM12/14/23

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

to Mitchell, Chromium Extensions, Sebastian Benz, Oliver Dunk

Hi Mitchell,

There is not going to be any change, other than the requirement to use Manifest v3.

  





> \--  
> You received this message because you are subscribed to the Google Groups "Chromium Extensions" group.  
> To unsubscribe from this group and stop receiving emails from it, send an email to chromium-extens...@chromium.org.  

> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/420ab29c-6c08-47eb-b98a-f38cbdd8b0f9n%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/420ab29c-6c08-47eb-b98a-f38cbdd8b0f9n%40chromium.org?utm_medium=email&utm_source=footer).  

![Grant Dawson's profile photo](//lh3.googleusercontent.com/a-/ALV-UjV3KhCLvzpKNp-rYzA8Yt6r4g8iJdQZsX8cAeAjVbm0URRHPQ=s40-c)

### Grant Dawson

unread,

Dec 21, 2023, 8:17:04 AM12/21/23

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

to Chromium Extensions, Patrick Kettner, Chromium Extensions, Oliver Dunk, Aamir Mansoor

From the way Google Analytics v4 looks, is it safe to assume that MV3 expects all third party services, like Intercom, to migrate to a purely REST API?  
  
This would impact any libraries that are UI-based and can't operate solely through network endpoints. In effect, limit what features Side Panel and Chrome Extensions are capable of. We are looking to adopt the Side Panel functionality but the inability to use dynamically loaded scripts cuts out the possibility of certain features.  
  
For example, how would Google Maps be used within a Side Panel? It is a REST and UI API hybrid. In the case of Google Maps, being a REST hybrid, its script files are loaded dynamically based on API key and permission scopes. Which can't be copy/pasted to a local folder.

  

Would love to hear your thoughts on the suggested way forward for implementing a library like that.  
  



![Patrick Kettner's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXAeZ7BcG6G83JtXobsIZw66NZtI4QR3PAkQFUOIGFQG17Oj1Q=s40-c)

### Patrick Kettner

unread,

Dec 21, 2023, 8:22:19 AM12/21/23

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

to Grant Dawson, Chromium Extensions, Oliver Dunk, Aamir Mansoor

You would use an iframe



Reply all

Reply to author

Forward



0 new messages


