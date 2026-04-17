---
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/POU6sW-I39M
captured_at: '2026-04-16'
capture_method: script-rendered
source_type: forum
source_id: google-group
title_at_capture: MV3 service worker broken after auto-update
author: null
evidence_class: b
topics:
  - service-worker
  - auto-update
  - lifecycle
  - race-condition
wayback_url: >-
  https://web.archive.org/web/20260416224152/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/POU6sW-I39M
related_docs: []
notes: Fill in during curation.
thread_url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/POU6sW-I39M
post_count: null
accepted_answer: null
---

# MV3 service worker broken after auto-update

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

# MV3 service worker broken after auto-update

8,203 views

Skip to first unread message



![Kyle Edwards's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXyoWSuzJwAUw6yXaZe1H9zhEOTFQ0hr0QmaEe3gbJygMXvvRU=s40-c)

### Kyle Edwards

unread,

Jun 23, 2021, 10:55:30 AM6/23/21

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

I've had a hard time keeping users on the latest version of my MV3 extension with chrome's default auto-update behavior - as a result I've been playing around with a "forced auto-update" approach, as [outlined in the extension docs](https://developer.chrome.com/docs/extensions/reference/runtime/#event-onUpdateAvailable). It was a simple addition to the service worker -  it reloads + installs the latest version of my extension as soon as the browser downloads the updated package:   
  
\`\`\`

chrome.runtime.onUpdateAvailable.addListener((details) =>

  chrome.runtime.reload()

);

\`\`\`

  

I've seen this exact block of code in other well established extensions in the wild, so I'm lead to believe it's a reasonable / safe approach to take.  

  

I've pushed this change to my "trusted testers" beta channel, and most of the time it works like a charm.  For a couple of users something goes wrong and the service worker stops loading all together - ie all message passing stops working, the user can't launch the service worker inspector.  This behavior even persists through chrome restarts.  The only two ways to fix the service worker are 1) to push another update that overwrites the "bad" update (it's odd the issue is intermittent with users). or 2) have the user remove / re-install the new version.  
  
The users with broken service workers are on the same chrome version as users that experience no issues.  No errors appear in chrome://extensions and content scripts continue work as expected (...except for message passing).    
  
Has anyone else experienced this behavior with MV3 service workers - with or without ?  Could this be an MV3 bug?    
  
Cheers,  
Kyle

![Kyle Edwards's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXyoWSuzJwAUw6yXaZe1H9zhEOTFQ0hr0QmaEe3gbJygMXvvRU=s40-c)

### Kyle Edwards

unread,

Jun 23, 2021, 11:04:53 AM6/23/21

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

to Chromium Extensions, Kyle Edwards

There was a confusing typo in my last paragraph - it should be: "...with or without auto-update\*\*?"



![wOxxOm's profile photo](//lh3.googleusercontent.com/a-/ALV-UjX4hF_IK5jhOzipxM-zPHfxUcqF61e2IbXJZW-yVpKo17jLulo=s40-c)

### wOxxOm

unread,

Jun 24, 2021, 11:00:04 AM6/24/21

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

to Chromium Extensions, Kyle Edwards

Assuming there's no conditional global code at the start of the script that may produce an unhandled exception, definitely sounds like a bug. To investigate more try opening any extension page (or just chrome-extension://\*\*\*\*\*\*\*/manifest.json), then open devtools -> Application -> Service Worker, and see what's different there.



![Simeon Vincent's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVgVhafMl3AGttO1wqSVfFIgcOHdyISm0BTWi7tebqoy3H7C6Y=s40-c)

### Simeon Vincent

unread,

Jun 24, 2021, 11:12:58 AM6/24/21

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

to Kyle Edwards, Chromium Extensions

The behavior you describe sounds reminiscent of a service worker (SW) failing to register at installation time, but in the current versions of the stable, beta, and canary channels there will at least be aa (minimally helpful) error logged in the extension's error view (chrome://extensions/?errors=<ID>).  The really odd part is the intermittent nature of the problem. 

  

Are you doing anything with [serviceWorker.register](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register) or [serviceWorkerRegistration.update](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update)? I'm asking as the extension platform handles SW registration for you, so you should not need to manually modify the root scope SW, and doing so may lead to unexpected results.

  

Assuming it is a worker registration issue, is there anything in your SW that could conditionally throw on the first execution of the script? If so, that may account for the behavior you're seeing. You can also ask affected users to take a look at chrome://serviceworker-internals/. You should be able to search for the extenisn's ID on this page; if it is not present, the SW is not registered.

  

Another thing you may want to try is to wrap your SW in a try/catch. The least disruptive way to do this is to introduce a try/catch wrapper script as your background context. Quick example…

  

> **Old manifest**

> {
> 
> ...
> 
> "background": {
> 
> "service\_worker": "background.js"
> 
> }
> 
> ...
> 
> }

  

> **New manifest**
> 
> {
> 
> ...
> 
> "background": {
> 
> "service\_worker": "wrapper.js"
> 
> }
> 
> ...
> 
> }

>   

> **wrapper.js**  
> 
> try {
> 
> importScripts("background.js");
> 
> } catch (err) {
> 
> console.error(err);
> 
> }

  

This also makes it easy to remove from your project when Chrome addresses the underlying issues that necessitate its use.

  

Simeon - @dotproto

Chrome Extensions DevRel

  

  





> \--  
> You received this message because you are subscribed to the Google Groups "Chromium Extensions" group.  
> To unsubscribe from this group and stop receiving emails from it, send an email to chromium-extens...@chromium.org.  
> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/f20a4033-e48e-41fe-88ab-91f82270c443n%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/f20a4033-e48e-41fe-88ab-91f82270c443n%40chromium.org?utm_medium=email&utm_source=footer).  

![Kyle Edwards's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXyoWSuzJwAUw6yXaZe1H9zhEOTFQ0hr0QmaEe3gbJygMXvvRU=s40-c)

### Kyle Edwards

unread,

Nov 8, 2021, 2:49:39 PM11/8/21

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

to Chromium Extensions, Simeon Vincent, Chromium Extensions, Kyle Edwards, Will Decker, William Griffin

Circling back as the issue has persisted - our user base is growing, making updates increasingly painful.  We have 1000+ users and ~1% of them are impacted each release.  It's a seemingly random distribution - it hardly(or never) affects the same user twice.   The extension is rendered completely useless; you can't even inspect the service worker at chrome://extensions/.  No error is shown, and a browser(or computer) restart doesn't help.  The only solution is to manually reinstall the extension.

  

As a reminder, the issue started after moving to MV3, and included a change for [forced update](https://gist.github.com/kltdwrds/adc956705147d32aada0e967c0a92bce#file-background-js-L189-L216) (a documented pattern we've seen other popular extensions take advantage of), as well as error reporting with [Sentry](https://gist.github.com/kltdwrds/adc956705147d32aada0e967c0a92bce#file-background-js-L6-L31).  

  

Here's the published extension: [https://chrome.google.com/webstore/detail/brighthire/mbokiighkhdopgedihndpibkincpcgan](https://chrome.google.com/webstore/detail/brighthire/mbokiighkhdopgedihndpibkincpcgan)

  

@wOxxOm or @Simeon - if you're curious, here's the service worker source (~200 lines):  
[https://gist.github.com/kltdwrds/adc956705147d32aada0e967c0a92bce](https://gist.github.com/kltdwrds/adc956705147d32aada0e967c0a92bce)  

  

As per your suggestion, I added the SW wrapper try..catch, but have yet to actually captured an exception.   

  

Appreciate all your help with extension development + community support!

  

Cheers,  
Kyle



![Simeon Vincent's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVgVhafMl3AGttO1wqSVfFIgcOHdyISm0BTWi7tebqoy3H7C6Y=s40-c)

### Simeon Vincent

unread,

Nov 8, 2021, 7:10:14 PM11/8/21

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

to Kyle Edwards, Chromium Extensions, Will Decker, William Griffin

Thanks for following up on this. I was already planning to follow up with a couple engineers to discuss the extension service worker lifecycle and update flow later this week. Since this seems very related, I'll make sure to pass along your report.

  

Simeon - @dotproto

Chrome Extensions DevRel

  



![wOxxOm's profile photo](//lh3.googleusercontent.com/a-/ALV-UjX4hF_IK5jhOzipxM-zPHfxUcqF61e2IbXJZW-yVpKo17jLulo=s40-c)

### wOxxOm

unread,

Nov 9, 2021, 2:54:22 AM11/9/21

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

to Chromium Extensions, Kyle Edwards, Simeon Vincent, Chromium Extensions, Will Decker, William Griffin

Try checking navigator.serviceWorker.getRegistrations() after the update in a normal extension page such as the popup or a post-update notification page and if the returned array is empty or has more than one entry or the entry's parameters differ from the expected ones, ask the user to reinstall the extension and send a bug report to you with the info.



![Kyle Edwards's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXyoWSuzJwAUw6yXaZe1H9zhEOTFQ0hr0QmaEe3gbJygMXvvRU=s40-c)

### Kyle Edwards

unread,

Nov 10, 2021, 1:17:59 PM11/10/21

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

to Chromium Extensions, wOxxOm, Kyle Edwards, Simeon Vincent, Chromium Extensions, Will Decker, William Griffin

Thanks all, we're working on reproducing the issue in our beta channel so we can capture a bug report.  
  
@simeon feel free to tap me for more context, you can contact me on this thread or reach me at ky...@brighthire.ai.

  

@w0xx0m I _think_ I follow, and am working with our internal beta users to capture the output from getRegistrations(). Please check my understanding:  

1.  Extension service worker update fails
2.  Open a "normal extension page" - our extension doesn't have a popup, or a post-update notification page. We'll use chrome-extension://opnlcljcbpodfkedodibhbnegdkhappp/manifest.json
3.  Open dev inspector on the extension page
4.  Run \`await navigator.serviceWorker.getRegistrations()\`  
    
5.  Expand the array and take a screenshot (I've had no luck with console log / json stringify on this object)

  

Thanks again for your help.

  

Cheers,  
Kyle



![wOxxOm's profile photo](//lh3.googleusercontent.com/a-/ALV-UjX4hF_IK5jhOzipxM-zPHfxUcqF61e2IbXJZW-yVpKo17jLulo=s40-c)

### wOxxOm

unread,

Nov 10, 2021, 1:22:06 PM11/10/21

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

to Chromium Extensions, Kyle Edwards, wOxxOm, Simeon Vincent, Chromium Extensions, Will Decker, William Griffin

Yeah, this will work. Ask them to expand the entries in the array and probably show them a gif how this all should work and look like.



Message has been deleted

![Vladimir Yankovich's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVB6U_gnIMMqwINFLR4iXuAhPFsKnle9OLyFoSwDNJo3DsfOACmpQ=s40-c)

### Vladimir Yankovich

unread,

Nov 16, 2021, 3:11:08 PM11/16/21

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

to Chromium Extensions, vladimira...@gmail.com, wOxxOm, Kyle Edwards, Simeon Vincent, Chromium Extensions, Will Decker, William Griffin

We faced a similar problem. Colleagues, tell me, did anyone find a solution? I am interested in how to restart SW from any tab, I have access to all hosts.  
  

On Friday, November 12, 2021 at 3:19:53 PM UTC+3 vladimira...@gmail.com wrote:  

> help me figure out the site [etherscan.io](http://etherscan.io) I am the owner , it is unclear how to withdraw funds from the exchange , I ask for help , you will receive a percentage of the profit if you figure it out  
>   
> 
> четверг, 11 ноября 2021 г. в 00:22:06 UTC+3, wOxxOm:  



![Валера Киселев's profile photo](//lh3.googleusercontent.com/a-/ALV-UjV7G5TTbG4RAbBqCqaTBNl9y0Z7skDdg_cU0LcazguTxO_UiA=s40-c)

### Валера Киселев

unread,

Nov 17, 2021, 4:06:14 AM11/17/21

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

to Chromium Extensions, yankovic...@gmail.com, vladimira...@gmail.com, wOxxOm, Kyle Edwards, Simeon Vincent, Chromium Extensions, Will Decker, William Griffin

When i refresh dev extension or stop and run prod extension some time service worker die at all. When i close and open browser worker doesn't run and any listeners inside worker doesn't run it too. It tried register worker manually. Fore example:  

  

override.html 

<!DOCTYPE html> <html lang="en"> <head>...<head> <body> ... <script defer src="override.js"></script> <body> <html>  

  

// override.js 

navigator.serviceWorker.getRegistrations().then((res) => { 

  for (let worker of res) { 

  console.log(worker) 

  if (worker.active.scriptURL.includes('background.js')) { 

  return 

 } } 

  

 navigator.serviceWorker .register(chrome.runtime.getURL('background.js')) 

 .then((registration) => { 

  console.log('Service worker success:', registration) 

 })

.catch((error) => { 

  console.log('Error service:', error) 

 }) 

})  

  

This solution partially helped me but it does not matter because i have to register worker on different tabs. May be somebody know decision. I will pleasure.  

среда, 17 ноября 2021 г. в 02:11:08 UTC+3, yankovic...@gmail.com:  



![Валера Киселев's profile photo](//lh3.googleusercontent.com/a-/ALV-UjV7G5TTbG4RAbBqCqaTBNl9y0Z7skDdg_cU0LcazguTxO_UiA=s40-c)

### Валера Киселев

unread,

Nov 17, 2021, 7:11:02 AM11/17/21

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

to Chromium Extensions, Валера Киселев, yankovic...@gmail.com, vladimira...@gmail.com, wOxxOm, Kyle Edwards, Simeon Vincent, Chromium Extensions, Will Decker, William Griffin

I created an issue, I hope the Chromium team will find a solution - [https://bugs.chromium.org/p/chromium/issues/detail?id=1271154](https://bugs.chromium.org/p/chromium/issues/detail?id=1271154)  

среда, 17 ноября 2021 г. в 15:06:14 UTC+3, Валера Киселев:  



![Kyle Edwards's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXyoWSuzJwAUw6yXaZe1H9zhEOTFQ0hr0QmaEe3gbJygMXvvRU=s40-c)

### Kyle Edwards

unread,

Nov 17, 2021, 3:08:22 PM11/17/21

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

to Chromium Extensions, wOxxOm, Kyle Edwards, Simeon Vincent, Chromium Extensions, Will Decker, William Griffin

**Update** \- we've reproduced the update issue in beta by releasing an update with no changes.  
  
I was one of two beta users (out of 12) who experienced the issue - I was able to collect the debug output suggested by @w0xx0m (the other user's output was the same as mine):

  

No service worker registrations when visiting an extension page (manifest.json)  
![Screen Shot 2021-11-16 at 2.21.24 PM.png](https://groups.google.com/a/chromium.org/group/chromium-extensions/attach/d0d1290cabb82/Screen%20Shot%202021-11-16%20at%202.21.24%20PM.png?part=0.2&view=1)  

No inspector is launched when clicking "service worker":

![Screen Shot 2021-11-16 at 2.47.13 PM.png](https://groups.google.com/a/chromium.org/group/chromium-extensions/attach/d0d1290cabb82/Screen%20Shot%202021-11-16%20at%202.47.13%20PM.png?part=0.1&view=1)  

  

**Observations**

We track users' current extension version by external message polling from our main application (extension responds with \`chrome.runtime.getManifest().version\`)  What's interesting is, every user with the issue is on the latest version - meaning an updated service worker received/responded to at least on message. **This is new info:** What I've been describing as an "update error" (since we tend to hear several reports of the issue after an update) might be more accurately described as a "service worker crash" or "service worker init issue" - because in a small number of cases it's silently unregistered after successfully updating.

I understand the timeline as follows:

1.  Update published
2.  Browser receives update
3.  Chrome triggers \`chrome.runtime.onUpdateAvailable\`, which calls: \`chrome.runtime.reload()\` (documented [here](https://developer.chrome.com/docs/extensions/reference/runtime/#event-onUpdateAvailable), here's [our code](https://gist.github.com/kltdwrds/adc956705147d32aada0e967c0a92bce#file-background-js-L212-L216))
4.  Extension updated (new service worker registered?)
5.  New service worker handles external message, loads manifest, responds with latest version number
6.  Something happens? Service worker kaput :( user reports issue
7.  \`navigator.serviceWorker.getRegistrations()\` returns an empty array, service worker inspector doesn't launch
8.  User must manually re-install, or wait for our next update to be pushed **very painful**  
    (we've also seen at least one case of fixing a broken service worker by flipping the enable / disable switch, but we recommend users re-install)

\- For further debugging, here is our beta [manifest.json](https://gist.github.com/kltdwrds/34e32591941c454f5d18ef6cf93d2d8e)

\- The exact same codebase is deployed to our [production extension](https://chrome.google.com/webstore/detail/brighthire/mbokiighkhdopgedihndpibkincpcgan)

\- Here's the service worker source: [https://gist.github.com/kltdwrds/adc956705147d32aada0e967c0a92bce](https://gist.github.com/kltdwrds/adc956705147d32aada0e967c0a92bce)  

  

Please let me know how I can help - we can't afford to continue using mv3 with this issue and we're even **evaluating a move back to mv2.** That's a move we would really like to avoid, given its [sunsetting](https://developer.chrome.com/docs/extensions/mv3/mv2-sunset/) soon.

  

Appreciate the continued support!  
Kyle



Message has been deleted

Message has been deleted

![Andreas Gruber's profile photo](//lh3.googleusercontent.com/a-/ALV-UjU3OW7nd2CZIj92FZfSSynRrE-4v3ezyTkZIZmPzjTWDzhEe34=s40-c)

### Andreas Gruber

unread,

Nov 18, 2021, 2:05:36 AM11/18/21

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

to Kyle Edwards, Chromium Extensions, wOxxOm, Simeon Vincent, Will Decker, William Griffin

I could reproduce the issue with our extension. It turns out that when you inspect chrome://serviceworker-internals/ we end up with TWO extension service workers and none of them works. The old one is ACTIVATED, but it does not work anymore because of chrome.runtime.reload() and the new one is INSTALLED and in WAITING WORKER state, but not activated.

Switching the extension off and on again, made it work again.  

  

![Screenshot from 2021-11-18 10-52-25.png](https://groups.google.com/a/chromium.org/group/chromium-extensions/attach/d30effa66eee2/Screenshot%20from%202021-11-18%2010-52-25.png?part=0.3&view=1)  

  

  

  





> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/44dad861-4098-4ab3-846c-75768a29ab73n%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/44dad861-4098-4ab3-846c-75768a29ab73n%40chromium.org?utm_medium=email&utm_source=footer).  

![Vladimir Yankovich's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVB6U_gnIMMqwINFLR4iXuAhPFsKnle9OLyFoSwDNJo3DsfOACmpQ=s40-c)

### Vladimir Yankovich

unread,

Nov 18, 2021, 3:29:26 AM11/18/21

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

to Chromium Extensions, Andreas Gruber, Chromium Extensions, wOxxOm, Simeon Vincent, Will Decker, William Griffin, Kyle Edwards

All of these cases look like serious bugs in production.  
  
@Simeon, help your early MV3 adopters :) Tell me, how can we speed up solving this problem? 



![Simeon Vincent's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVgVhafMl3AGttO1wqSVfFIgcOHdyISm0BTWi7tebqoy3H7C6Y=s40-c)

### Simeon Vincent

unread,

Nov 18, 2021, 10:21:45 AM11/18/21

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

to Vladimir Yankovich, Chromium Extensions, Andreas Gruber, wOxxOm, Will Decker, William Griffin, Kyle Edwards

Thank you all for sharing your observations and data gathering here. I'm passing along your most recent updates to the folks working on this part of the platform now.

  

Vladimir, if we can find a reliable set of steps to reproduce the issue, that would be ideal. Failing that, though, I suspect that the kind of data gathering Валера, Kyle, and Andreas have done in their most recent posts may help to the platform engineers understand and track down the issue. I'll follow up here if the extensions platform engineers have any other suggestions or requests.

  

Simeon - @dotproto

Chrome Extensions DevRel

  



![Cuyler Stuwe's profile photo](//lh3.googleusercontent.com/a-/ALV-UjV-mxEuckDxnVjYZL2U2eYbFJX8ZlUEHUbI61QNIv08B-d6aUBv=s40-c)

### Cuyler Stuwe

unread,

Nov 18, 2021, 10:32:39 AM11/18/21

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

to Simeon Vincent, Andreas Gruber, Chromium Extensions, Kyle Edwards, Vladimir Yankovich, Will Decker, William Griffin, wOxxOm

I’m just here to ask for an extension to the MV2 lock deadline, given that we’re only a couple months away from being forced to submit new extensions as MV3, and we can’t even guarantee basic things like being able to reliably update and run MV3 extensions for all users.

  





> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CAFY0HLOfMrC353Wz95sTjaAMJo1\_W1%3Dr6Ffo1YrqOOfAGdnUPA%40mail.gmail.com](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CAFY0HLOfMrC353Wz95sTjaAMJo1_W1%3Dr6Ffo1YrqOOfAGdnUPA%40mail.gmail.com?utm_medium=email&utm_source=footer).  

![Vladimir Yankovich's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVB6U_gnIMMqwINFLR4iXuAhPFsKnle9OLyFoSwDNJo3DsfOACmpQ=s40-c)

### Vladimir Yankovich

unread,

Nov 18, 2021, 10:39:27 AM11/18/21

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

to Chromium Extensions, Simeon Vincent, Chromium Extensions, Andreas Gruber, wOxxOm, Will Decker, William Griffin, Kyle Edwards, Vladimir Yankovich

In fact, it's very simple. 

  

1\. Install any MV3 extension with service worker (SW) in developer mode. 

2\. Make sure SW running through the console by running  
//navigator.serviceWorker

    .getRegistrations()

    .then((res) => console.log(res))

3\. refresh the extension several times with the button (look screenshot) 

4\. Verify that the serviceWorker is broken by running 

//navigator.serviceWorker in the console

    .getRegistrations()

    .then((res) => console.log(res))

5\. If SW is alive, repeat steps 3 and 4. Sooner or later (sooner rather sooner :) it will die, although it should be registered 100% of the time.  

  

  

![Extensions - Google Chrome 2021-11-18 21.32.52.png](https://groups.google.com/a/chromium.org/group/chromium-extensions/attach/d4cfa82cf058f/Extensions%20-%20Google%20Chrome%202021-11-18%2021.32.52.png?part=0.1&view=1)



![Vladimir Yankovich's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVB6U_gnIMMqwINFLR4iXuAhPFsKnle9OLyFoSwDNJo3DsfOACmpQ=s40-c)

### Vladimir Yankovich

unread,

Nov 18, 2021, 10:48:00 AM11/18/21

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

to Chromium Extensions, Vladimir Yankovich, Simeon Vincent, Chromium Extensions, Andreas Gruber, wOxxOm, Will Decker, William Griffin, Kyle Edwards

@**Cuyler Stuwe**, On the one hand I agree with you. On the other hand, postponing the end of MV2 support can relax the Chrome development team and personally for me it will be bad news :) That is why I am in favor of making an effort together to make MV3 fully ready as soon as possible.



![Andreas Gruber's profile photo](//lh3.googleusercontent.com/a-/ALV-UjU3OW7nd2CZIj92FZfSSynRrE-4v3ezyTkZIZmPzjTWDzhEe34=s40-c)

### Andreas Gruber

unread,

Nov 18, 2021, 11:39:08 AM11/18/21

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

to Vladimir Yankovich, Chromium Extensions, Simeon Vincent, wOxxOm, Will Decker, William Griffin, Kyle Edwards

We could resolve the WAITING WORKER issue, by telling all content scripts to remove the iframe (part of the extension) that we have injected and to remove all listeners. After that we call runtime.reload() in the extension service worker and it seems that the old service worker is de-registered, and the new one gets registered.



Message has been deleted

![Валера Киселев's profile photo](//lh3.googleusercontent.com/a-/ALV-UjV7G5TTbG4RAbBqCqaTBNl9y0Z7skDdg_cU0LcazguTxO_UiA=s40-c)

### Валера Киселев

unread,

Nov 18, 2021, 12:38:23 PM11/18/21

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

to Chromium Extensions, Andreas Gruber, Chromium Extensions, Simeon Vincent, wOxxOm, Will Decker, William Griffin, Kyle Edwards, yankovic...@gmail.com

Source code of this sample you find there [https://github.com/kiselyou/extension-mv3-demo](https://github.com/kiselyou/extension-mv3-demo)

Video to reproduce: [https://take.ms/9ewbP](https://take.ms/9ewbP)

  

  

![Andreas Gruber's profile photo](//lh3.googleusercontent.com/a-/ALV-UjU3OW7nd2CZIj92FZfSSynRrE-4v3ezyTkZIZmPzjTWDzhEe34=s40-c)

### Andreas Gruber

unread,

Nov 19, 2021, 10:11:42 AM11/19/21

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

to Валера Киселев, Chromium Extensions, Simeon Vincent, wOxxOm, Will Decker, William Griffin, Kyle Edwards, yankovic...@gmail.com

Can anyone confirm if `chrome.runtime.onUpdateAvailable gets called in MV3? I put a console.log statement inside the function, but I can never see it being logged.`



![Miguel Espinoza's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUsAVRO7GoPqHpeNseRbTq2oKSeTgLs0OHcwq-iR9S6YufwyA=s40-c)

### Miguel Espinoza

unread,

Nov 19, 2021, 11:21:36 AM11/19/21

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

to Chromium Extensions, Andreas Gruber, Chromium Extensions, Simeon Vincent, wOxxOm, Will Decker, William Griffin, Kyle Edwards, yankovic...@gmail.com, v.a.ki...@gmail.com

Hi all, I just got a chance to catch up with this long thread. I reported the issue back in Aug, but never got traction. Glad to see there's finally some traction.  
  
I can provide **steps to reproduce** with code and video (I hope this helps the extension team):

-   bug report link: [https://bugs.chromium.org/p/chromium/issues/detail?id=1242225](https://bugs.chromium.org/p/chromium/issues/detail?id=1242225)  
    
-   Github repo with steps to repro: [https://github.com/miguelespinoza/-v3-service-worker-update](https://github.com/miguelespinoza/-v3-service-worker-update)
-   Loom Videos:
    -   Walkthrough how to repro: [https://www.loom.com/share/e5b12be75c64483f82a9f148e1026b63](https://www.loom.com/share/e5b12be75c64483f82a9f148e1026b63)
    -   Walkthrough of the codebase: [https://www.loom.com/share/4c99022583d04d699dadf8764eb3ecca](https://www.loom.com/share/4c99022583d04d699dadf8764eb3ecca)

**A short summary:**

I identified this issue before my launch, so decided to downgrade to MV2. I'm hoping this issue could be addressed soon to revert to MV3.  
  
For my extension, this issue was caused by loading iFrames, I'm not familiar with the relationship between iFrames and service-workers, but this combination (reproed in the video) causes servicer-worker to break.  
  
\----  
  
I hope this provides the information necessary to fix the issue, I'm happy to test new builds of Chrome to verify once this issue has been fixed



![Vladimir Yankovich's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVB6U_gnIMMqwINFLR4iXuAhPFsKnle9OLyFoSwDNJo3DsfOACmpQ=s40-c)

### Vladimir Yankovich

unread,

Nov 19, 2021, 11:30:30 AM11/19/21

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

to Chromium Extensions, mig...@ensopi.com, Andreas Gruber, Chromium Extensions, Simeon Vincent, wOxxOm, Will Decker, William Griffin, Kyle Edwards, Vladimir Yankovich, v.a.ki...@gmail.com

Oh dear, it seems that the problem described by Valera and the problem described by Miguel are two different problems. I don't know who is responsible for MV3 development priorities, but it seems that these bugs must have the highest priority. 



![Kyle Edwards's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXyoWSuzJwAUw6yXaZe1H9zhEOTFQ0hr0QmaEe3gbJygMXvvRU=s40-c)

### Kyle Edwards

unread,

Nov 19, 2021, 2:35:08 PM11/19/21

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

to Chromium Extensions, yankovic...@gmail.com, mig...@ensopi.com, Andreas Gruber, Chromium Extensions, Simeon Vincent, wOxxOm, Will Decker, William Griffin, Kyle Edwards, v.a.ki...@gmail.com

Agree with yankovic...@gmail.com - these look like two **different but related** service worker issues.  I can confirm that our specific issue is easily reproduced in @v.a.ki...@gmail.com's video: [https://take.ms/9ewbP](https://take.ms/9ewbP)  
  
+1 @mig...@ensopi.com - I'm also happy to help test chrome dev builds.   
  
Any timeline estimate for fix would be helpful when evaluating our alternatives - ie. MV2 downgrade or releasing a new MV2 for our users in the time being.  
  
Kyle



![Simeon Vincent's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVgVhafMl3AGttO1wqSVfFIgcOHdyISm0BTWi7tebqoy3H7C6Y=s40-c)

### Simeon Vincent

unread,

Nov 22, 2021, 10:20:06 AM11/22/21

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

to Kyle Edwards, Chromium Extensions, yankovic...@gmail.com, mig...@ensopi.com, Andreas Gruber, wOxxOm, Will Decker, William Griffin, v.a.ki...@gmail.com

> Any timeline estimate for fix would be helpful when evaluating our alternatives - ie. MV2 downgrade or releasing a new MV2 for our users in the time being. - Kyle

  
No timeline on a fix as of yet, but I'm actively discussing both issues raised here with the team. 

   

Simeon - @dotproto

Chrome Extensions DevRel

  



![Andreas Gruber's profile photo](//lh3.googleusercontent.com/a-/ALV-UjU3OW7nd2CZIj92FZfSSynRrE-4v3ezyTkZIZmPzjTWDzhEe34=s40-c)

### Andreas Gruber

unread,

Nov 22, 2021, 10:33:03 AM11/22/21

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

to Simeon Vincent, Kyle Edwards, Chromium Extensions, yankovic...@gmail.com, mig...@ensopi.com, wOxxOm, Will Decker, William Griffin, v.a.ki...@gmail.com

In our case it really seems to be the iframes that we inject into some web pages. When we then add event listeners for the Service Worker 

\* install

\* activate

and for the Extension 

\* chrome.runtime.onInstalled

  

We get the following order (when no iframe is injected):

1\. SW install

2. chrome.runtime.onInstalled

3\. SW activate

which makes sense.

  

When an iframe is still active, we only get a chrome.runtime.onInstalled event, while the service worker from the previous extension version stays active and does not update!

When the iframes are removed, the service worker will eventually update, sometimes resulting in the case that no service worker is registered at all and the extension is completely unresponsive. 

Clicking the inspect view on the service worker does not work, since there is none.

  

  

  

  



![Ceof1's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVnHc5rqPjDMwPHWJ3bPN3oMQ7GAVbT9V4raHmC3VtnEl3q0A=s40-c)

### Ceof1

unread,

Nov 22, 2021, 2:01:02 PM11/22/21

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

to Chromium Extensions, Simeon Vincent, Chromium Extensions, yankovic...@gmail.com, mig...@ensopi.com, Andreas Gruber, wOxxOm, Will Decker, William Griffin, v.a.ki...@gmail.com, Kyle Edwards

Thanks Simeon. 

  

Regarding your earlier post

\>I was already planning to follow up with a couple engineers to discuss the extension service worker lifecycle and

\>update flow later this week.

  

Not wanting to distract from this high priority issue, but there are also these two other open issues, 

\- Issue 1152255 (open since November 2020) [https://bugs.chromium.org/p/chromium/issues/detail?id=1152255](https://bugs.chromium.org/p/chromium/issues/detail?id=1152255)

\- Issue 1189678 (open since March 2021)  [https://bugs.chromium.org/p/chromium/issues/detail?id=1189678](https://bugs.chromium.org/p/chromium/issues/detail?id=1189678)

  

that affects an extension developed by my team and going by the discussion threads on both, extensions developed by other teams, which also appear to be Service Worker Lifecycle related.

  

If there is a discussion amongst the engineers on Service Worker Life cycle, could these be discussed also? 

  

Thanks in advance.



![Ceof1's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVnHc5rqPjDMwPHWJ3bPN3oMQ7GAVbT9V4raHmC3VtnEl3q0A=s40-c)

### Ceof1

unread,

Dec 2, 2021, 3:51:51 AM12/2/21

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

to Chromium Extensions, Ceof1, Simeon Vincent, Chromium Extensions, yankovic...@gmail.com, mig...@ensopi.com, Andreas Gruber, wOxxOm, Will Decker, William Griffin, v.a.ki...@gmail.com, Kyle Edwards

Hi @Simeon

  

Regarding my question below, my team has an Mv2 extension which we've published to the Chrome Web Store. We are doing our planning for 2022. The Mv3 upgrade of that extension is being planned for next year.

When we attempted to upgrade to Mv3 earlier this year we found we were blocked by this issue    [https://bugs.chromium.org/p/chromium/issues/detail?id=1189678](https://bugs.chromium.org/p/chromium/issues/detail?id=1189678)

which is an Extension Service Worker issue.

We haven't seen an update from Chromium team on the issue since September, the update was that it was been worked on.

My team is growing increasingly concerned about this, particularly given the reminder email we received from the Chrome Web Store, reminding us of the timeline for the phasing out of Mv2 extensions.  We'd appreciate feedback on the issue reported by [https://bugs.chromium.org/p/chromium/issues/detail?id=1189678](https://bugs.chromium.org/p/chromium/issues/detail?id=1189678) , so that we can factor it into our planning

  

Thanks in advance.



![Vladimir Yankovich's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVB6U_gnIMMqwINFLR4iXuAhPFsKnle9OLyFoSwDNJo3DsfOACmpQ=s40-c)

### Vladimir Yankovich

unread,

Dec 2, 2021, 4:06:53 AM12/2/21

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

to Chromium Extensions, Ceof1, Simeon Vincent, Chromium Extensions, Vladimir Yankovich, mig...@ensopi.com, Andreas Gruber, wOxxOm, Will Decker, William Griffin, v.a.ki...@gmail.com, Kyle Edwards

Santa give us an actual roadmap for Christmas with specific timelines and priorities for the development of the Google Chrome extension platform. God, this is a technology project, not a creative improvisation. Why so much obscurity and uncertainty? 

  

Yes, we're still shocked that you took away our background page. But let's start small, with transparency and responsiveness. I think that's the most important thing we, the community of Chrome extension developers, are lacking right now.

  

God, this silence in the Chromium bugtracker is exhausting. Just respond to our posts more than once a month and preferably with specific answers and deadlines, not by adding new silent people to CC :)



![Pratyush Raj's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUtKEmtBNdFW_rF7iFwrLk0bhYG7mGi7ocMao0g-xAW7QeSzypiaw=s40-c)

### Pratyush Raj

unread,

Dec 19, 2021, 2:00:45 AM12/19/21

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

to Chromium Extensions, yankovic...@gmail.com, Ceof1, Simeon Vincent, Chromium Extensions, mig...@ensopi.com, Andreas Gruber, wOxxOm, Will Decker, William Griffin, v.a.ki...@gmail.com, Kyle Edwards

Have been seeing this problem but not only after updating but also when it is installed for few days and randomly happens to some of our users.  
  
I am not able to reproduce it constantly, but mainly happens when laptop wake from sleep and chrome was open or system is in low memory.  
  
Our users have been complaining again and again about it. This has made our extension worthless.



![Simeon Vincent's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVgVhafMl3AGttO1wqSVfFIgcOHdyISm0BTWi7tebqoy3H7C6Y=s40-c)

### Simeon Vincent

unread,

Dec 23, 2021, 12:37:55 PM12/23/21

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

to Pratyush Raj, Chromium Extensions, yankovic...@gmail.com, Ceof1, mig...@ensopi.com, Andreas Gruber, wOxxOm, Will Decker, William Griffin, v.a.ki...@gmail.com, Kyle Edwards

> I am not able to reproduce it constantly, but mainly happens when laptop wake from sleep and chrome was open or system is in low memory.

  

If possible, please provide some additional data in order to help us understand how to reproduce the problem.

-   What operating system are you using? Please include name and the build/version number.  
    
-   Does the length of the sleep matter? If so, how long does the device need to be asleep?
-   Have you noticed any other trends in the user reports you've received?

  

Simeon - @dotproto

Chrome Extensions DevRel

  



![Vladimir Yankovich's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVB6U_gnIMMqwINFLR4iXuAhPFsKnle9OLyFoSwDNJo3DsfOACmpQ=s40-c)

### Vladimir Yankovich

unread,

Dec 23, 2021, 12:42:58 PM12/23/21

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

to Chromium Extensions, Simeon Vincent, Chromium Extensions, Vladimir Yankovich, Ceof1, mig...@ensopi.com, Andreas Gruber, wOxxOm, Will Decker, William Griffin, v.a.ki...@gmail.com, Kyle Edwards, raj.or....@gmail.com

Simeon, could you share with the developer community the current status of this issue?  
  
In my opinion, we are dealing with a critical bug in the stable version of the platform. The problem has been known for more than 2 months. At the same time, I only know that we all together accumulate information about the reproduction of the error. And what about fixing it? 



![Simeon Vincent's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVgVhafMl3AGttO1wqSVfFIgcOHdyISm0BTWi7tebqoy3H7C6Y=s40-c)

### Simeon Vincent

unread,

Dec 23, 2021, 1:58:09 PM12/23/21

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

to Vladimir Yankovich, Chromium Extensions, Ceof1, mig...@ensopi.com, Andreas Gruber, wOxxOm, Will Decker, William Griffin, v.a.ki...@gmail.com, Kyle Edwards, raj.or....@gmail.com

Vladimir, there are several issues being discussed in this thread, so I'm not exactly sure which one you're referring to. For the moment I'm going to assume you mean [crbug.com/1271154](http://crbug.com/1271154), "MV3 service worker broken after auto-update and manual refresh".

  

In short, I caught up with the eng team to discuss extension service worker startup issues last week and an engineer is investigating [1271154](http://crbug.com/1271154) now. We do not have an ETA on a fix, but this is a priority issue for us.

  

Simeon - @dotproto

Chrome Extensions DevRel

  



![Vladimir Yankovich's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVB6U_gnIMMqwINFLR4iXuAhPFsKnle9OLyFoSwDNJo3DsfOACmpQ=s40-c)

### Vladimir Yankovich

unread,

Dec 23, 2021, 2:01:02 PM12/23/21

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

to Chromium Extensions, Simeon Vincent, Chromium Extensions, Ceof1, mig...@ensopi.com, Andreas Gruber, wOxxOm, Will Decker, William Griffin, v.a.ki...@gmail.com, Kyle Edwards, raj.or....@gmail.com, Vladimir Yankovich

Simeon, thank you very much, that's exactly what I wanted to hear: the task at hand, you share our position that this is a critical error. 

  

Have a good holiday, colleagues! May all the bugs remain in the past year :) 



![Shu's profile photo](//lh3.googleusercontent.com/a-/ALV-UjU-PpJxsD88HiD5ea6wJJYhCtR2IPasomI_8wWCdP9C00KrD6Kb=s40-c)

### Shu

unread,

Dec 30, 2021, 11:40:18 AM12/30/21

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

to Chromium Extensions, yankovic...@gmail.com, Simeon Vincent, Chromium Extensions, Ceof1, mig...@ensopi.com, Andreas Gruber, wOxxOm, Will Decker, William Griffin, v.a.ki...@gmail.com, Kyle Edwards, raj.or....@gmail.com

Hello,

What should I advise to users, maybe there is something else they can do. If they update the script, sometimes it fails and SW doesn't work, re-install doesn't help (as they say), only if I insist and they reinstall the browsers it is fixed then. I hate this problem and lost many customers for this reason. i can't reproduce this and have few reports like this per day (from over 30 000 customers)  

  

If I press the Script Icon in the Top corner of google chrome, to open up the script window it does#t open the script.

Nothing is happening then.

It’s google chrome Version 96.0.4664.110 (Offizieller Build) (x86\_64) on Mac Catalina 10.15.7  



![Cuyler Stuwe's profile photo](//lh3.googleusercontent.com/a-/ALV-UjV-mxEuckDxnVjYZL2U2eYbFJX8ZlUEHUbI61QNIv08B-d6aUBv=s40-c)

### Cuyler Stuwe

unread,

Dec 30, 2021, 1:19:04 PM12/30/21

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

to Shu, Andreas Gruber, Ceof1, Chromium Extensions, Kyle Edwards, Simeon Vincent, Will Decker, William Griffin, mig...@ensopi.com, raj.or....@gmail.com, v.a.ki...@gmail.com, wOxxOm, yankovic...@gmail.com

I would recommend blaming Google for their hurried rollout of a broken MV3. It’s genuinely their fault, there’s nothing you can really do about it, and this is the only way you can really hold them accountable to the general public.

  





> \--  
> You received this message because you are subscribed to the Google Groups "Chromium Extensions" group.  
> To unsubscribe from this group and stop receiving emails from it, send an email to chromium-extens...@chromium.org.  

> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/356b3e74-e2c1-4752-991a-f3333eaa0bd4n%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/356b3e74-e2c1-4752-991a-f3333eaa0bd4n%40chromium.org?utm_medium=email&utm_source=footer).  

![Cuyler Stuwe's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXKZwJAQCTSRxaJDJBEQWgmTSUI_vtXYkVnh2XxF11hiemPPA=s40-c)

### Cuyler Stuwe

unread,

Dec 30, 2021, 1:24:06 PM12/30/21

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

to Cuyler Stuwe, Andreas Gruber, Ceof1, Chromium Extensions, Kyle Edwards, Shu, Simeon Vincent, Will Decker, William Griffin, mig...@ensopi.com, raj.or....@gmail.com, v.a.ki...@gmail.com, wOxxOm, yankovic...@gmail.com

Reassure them that this is ostensibly a temporary problem and refer them to this thread and/or any relevant ticket trackers, etc. Whatever you can do to limit the bleeding.

  





> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CA%2BYuxdfrJLsfA46ALx5hOx4jdgr2a7UmfP4X5eXow2etbF%3DMFA%40mail.gmail.com](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CA%2BYuxdfrJLsfA46ALx5hOx4jdgr2a7UmfP4X5eXow2etbF%3DMFA%40mail.gmail.com?utm_medium=email&utm_source=footer).  

![Pratyush Raj's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUtKEmtBNdFW_rF7iFwrLk0bhYG7mGi7ocMao0g-xAW7QeSzypiaw=s40-c)

### Pratyush Raj

unread,

Dec 30, 2021, 1:34:19 PM12/30/21

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

to Chromium Extensions, cuyler...@gmail.com, Andreas Gruber, Ceof1, Chromium Extensions, Kyle Edwards, Shu, Simeon Vincent, Will Decker, William Griffin, mig...@ensopi.com, Pratyush Raj, v.a.ki...@gmail.com, wOxxOm, yankovic...@gmail.com, salem...@gmail.com

What i have done currently is, detect if service worker is working or not and then put a reload button, because content script and popup seems to work.



![Jackie Han's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVyibOhAcFDqxwg5hGQd1FJxNMy39y8Yn4REn2IKVVH4q8SbzApFw=s40-c)

### Jackie Han

unread,

Feb 1, 2022, 9:44:05 PM2/1/22

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

to Chromium Extensions, cuyler...@gmail.com, Andreas Gruber, Ceof1, Kyle Edwards, Shu, Simeon Vincent, Will Decker, William Griffin, mig...@ensopi.com, Pratyush Raj, v.a.ki...@gmail.com, wOxxOm, yankovic...@gmail.com, salem...@gmail.com

Some users say that the extension's service worker doesn't work when restart browser or reboot computer.

  

To make SW work again, they need to do one of these operations:

1\. disable and re-enable the extension manually in chrome://extensions/

2. disable and re-enable the "Allow in Incognito" setting in chrome://extensions/?id=_extenion\_id_

3\. clear Chrome user profile's Service Worker directory, then start browser. e.g. Google\\Chrome\\User Data\\Default\\Service Worker on Windows or username/Library/Application Support/Google/Chrome/Profile 1/Service Worker on Mac.

  

  





> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/a01a2492-fb5a-430d-8d82-ceebfdd396cfn%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/a01a2492-fb5a-430d-8d82-ceebfdd396cfn%40chromium.org?utm_medium=email&utm_source=footer).  

Message has been deleted

![Shu's profile photo](//lh3.googleusercontent.com/a-/ALV-UjU-PpJxsD88HiD5ea6wJJYhCtR2IPasomI_8wWCdP9C00KrD6Kb=s40-c)

### Shu

unread,

Feb 9, 2022, 9:48:40 PM2/9/22

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

to Chromium Extensions, vladimir...@gmail.com, Chromium Extensions, cuyler...@gmail.com, Andreas Gruber, Ceof1, Kyle Edwards, Shu, Simeon Vincent, Will Decker, William Griffin, mig...@ensopi.com, raj.or....@gmail.com, v.a.ki...@gmail.com, wOxxOm, yankovic...@gmail.com, salem...@gmail.com, Jackie Han

I found a way how to "kill" service worker and block it forever...

  

If I run an extension that after some time uses chrome.runtime.sendMessage

but I disable the extension meanwhile, I get the error:

Uncaught Error: Extension context invalidated.

  

Well, now if I re-enable the extension it will not work, restart browser doesn't help, extension is dead. If I check service worker I see the error:

Uncaught (in promise) Error: Could not establish connection. Receiving end does not exist.

  

And that's all, the only way is to remove the extension and reinstall it again. I think this can happen in other cases, it shouldn't block forever the extension....  
  

On Saturday, 5 February 2022 at 18:33:55 UTC+4 vladimir...@gmail.com wrote:  

> Hello, I had an accident, my mother died, now I live with relatives without money, I need the help of my developers, because I was the one who appointed the administrator of the group and I am the owner of this group, write to me urgently I need support, у меня случилось несчастье, умерла мама, теперь живу у родственников нет денег, мне нужна помощь моих разработчиков, ведь именно я назначал администратора группы и я являюсь владельцем этой группы, напишите мне обязательно срочно нужна поддержка 
> 
>   
> 
> ср, 2 февр. 2022 г., 8:44 Jackie Han <han.g...@gmail.com\>:  



> > You received this message because you are subscribed to a topic in the Google Groups "Chromium Extensions" group.  
> > To unsubscribe from this topic, visit [https://groups.google.com/a/chromium.org/d/topic/chromium-extensions/POU6sW-I39M/unsubscribe](https://groups.google.com/a/chromium.org/d/topic/chromium-extensions/POU6sW-I39M/unsubscribe).  
> > To unsubscribe from this group and all its topics, send an email to chromium-extens...@chromium.org.  
> > To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CAAgdh1KW5UudcQWfFPnno8EgWMvCUHSaFw-J0W%2BmRgwx7NvS-w%40mail.gmail.com](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CAAgdh1KW5UudcQWfFPnno8EgWMvCUHSaFw-J0W%2BmRgwx7NvS-w%40mail.gmail.com?utm_medium=email&utm_source=footer).  

![Kyle Edwards's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXyoWSuzJwAUw6yXaZe1H9zhEOTFQ0hr0QmaEe3gbJygMXvvRU=s40-c)

### Kyle Edwards

unread,

Feb 10, 2022, 9:24:57 AM2/10/22

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

to Chromium Extensions, Shu, vladimir...@gmail.com, Chromium Extensions, cuyler...@gmail.com, Andreas Gruber, Ceof1, Kyle Edwards, Simeon Vincent, Will Decker, William Griffin, mig...@ensopi.com, raj.or....@gmail.com, v.a.ki...@gmail.com, wOxxOm, yankovic...@gmail.com, salem...@gmail.com, Jackie Han

We built a (hopefully temporary) workaround that's working really well for our users.  It's a content script + iframe that polls for a healthy extension worker, and displays a banner linking to the extension install page when the service worker is broken.  

  

[https://gist.github.com/kltdwrds/961f418a2d1cc31b6325ee1dac301a13](https://gist.github.com/kltdwrds/961f418a2d1cc31b6325ee1dac301a13)

  

Note:   
\- Does not work in incognito mode, or when user has 3rd party cookies blocked (you'll get a very terse error about service worker registration)

\- The reinstall banner CSS could be improved - when it's shown on certain pages, it can cause minor rendering issues with the host page

  

YMMV :)  
  
Cheers,  
Kyle



![Cuyler Stuwe's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXKZwJAQCTSRxaJDJBEQWgmTSUI_vtXYkVnh2XxF11hiemPPA=s40-c)

### Cuyler Stuwe

unread,

Feb 10, 2022, 9:39:15 AM2/10/22

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

to Kyle Edwards, Andreas Gruber, Ceof1, Chromium Extensions, Jackie Han, Shu, Simeon Vincent, Will Decker, William Griffin, mig...@ensopi.com, raj.or....@gmail.com, salem...@gmail.com, v.a.ki...@gmail.com, vladimir...@gmail.com, wOxxOm, yankovic...@gmail.com

It’s both hilarious and sad that we still have to do things like this over a month after no longer being able to submit extensions on the stable MV2 platform.

  

Embarrassing for Google, for sure. Makes them look incompetent. Definitely would turn me off if I was picking between working at their company or a different FAANG-type corp.

  

Here’s to hoping your workaround becomes useless soon. 🥂



![Miguel Espinoza's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUsAVRO7GoPqHpeNseRbTq2oKSeTgLs0OHcwq-iR9S6YufwyA=s40-c)

### Miguel Espinoza

unread,

Feb 17, 2022, 6:08:56 AM2/17/22

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

to Chromium Extensions, cuyler...@gmail.com, Andreas Gruber, Ceof1, Chromium Extensions, Jackie Han, Shu, Simeon Vincent, Will Decker, William Griffin, Miguel Espinoza, raj.or....@gmail.com, salem...@gmail.com, v.a.ki...@gmail.com, vladimir...@gmail.com, wOxxOm, yankovic...@gmail.com, Kyle Edwards

oh boy! I was hopeful this thread would gain some traction but now we're having to depend on workarounds.  
any update from the Google/Chromium team would be awesome.  
  
fwiw, the bug ticket that was picked by the team to investigate [1271154](https://bugs.chromium.org/p/chromium/issues/detail?id=1271154) has some updates, but it doesn't look like there have been updates from the Chromium team.  
  
Maybe if we put our efforts into triaging that bug ticket we could get some momentum. I see Yankovic has been providing input. Maybe you could give us an update on what's been happening in that bug ticket, thanks!



![Jono Warren's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVN0jBva6cWxPjs6J_Tf9idzIkI2eu9vHBSmAg9ja4fBhXpxDp4=s40-c)

### Jono Warren

unread,

Mar 8, 2022, 10:10:39 AM3/8/22

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

to Chromium Extensions, mig...@ensopi.com, cuyler...@gmail.com, Andreas Gruber, Ceof1, Chromium Extensions, Jackie Han, Shu, Simeon Vincent, Will Decker, William Griffin, raj.or....@gmail.com, salem...@gmail.com, v.a.ki...@gmail.com, vladimir...@gmail.com, wOxxOm, yankovic...@gmail.com, Kyle Edwards

Hiya, one of our Chromium engineers had a look under the hood at what was going on and found this is caused by a race condition when an extension updates, which explains why this appears to happen intermittently to users. 

When an extension is updated, the old service worker is unregistered and the new one registered. The race begins when the unregistration asynchronously schedules the purging of data which the new service worker later relies on. In the happy case, the data is purged before the registration of the new one begins and fresh data is generated for the service worker. But in the unhappy case the scheduled purge happens after the registration has just set fresh data, so when the service worker attempts to access it, it is not there and it fails to start. We’ve added more technical details of our investigation to the bug report. 

Based on this, it appears the bug potentially affects all users of MV3 extensions, regardless of OS, it’s simply a roll of the dice whether a user gets a broken service worker during an update. 

We're working on a patch which we'll hopefully be able to upstream once we're confident it works. However, we don’t have committer status, so we’ll need the support of the Chromium team to integrate this.  

If others who are facing this issue are able to [add a star to the bug report](https://bugs.chromium.org/p/chromium/issues/detail?id=1271154), hopefully that will nudge it up the priority for the team to look into. 



![yuleini 27's profile photo](//lh3.googleusercontent.com/a-/ALV-UjWNQmKCt1h6UTj6hqOpAGaJgmwyZV68tuJHCA7pnAmlTgpcYWxg=s40-c)

### yuleini 27

unread,

Mar 27, 2022, 11:17:42 AM3/27/22

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

to Jono Warren, Chromium Extensions, mig...@ensopi.com, cuyler...@gmail.com, Andreas Gruber, Ceof1, Jackie Han, Shu, Simeon Vincent, Will Decker, William Griffin, raj.or....@gmail.com, salem...@gmail.com, v.a.ki...@gmail.com, vladimir...@gmail.com, wOxxOm, yankovic...@gmail.com, Kyle Edwards

Hello, I read your message and I don't know the truth, but I would like to ask you a big favor, could you give me 1300 dollars? Plisssss I really need them if you don't mind if you have a lot of money can you give me that amount? I have PayPal: julein...@gmail.com the account name does not match my gmail name plissssss

  





> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/f48c18b7-0611-4c35-b280-2e07a809cc1fn%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/f48c18b7-0611-4c35-b280-2e07a809cc1fn%40chromium.org?utm_medium=email&utm_source=footer).  

![Kyle Edwards's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXyoWSuzJwAUw6yXaZe1H9zhEOTFQ0hr0QmaEe3gbJygMXvvRU=s40-c)

### Kyle Edwards

unread,

Aug 10, 2022, 10:53:51 AM8/10/22

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

to Chromium Extensions, Jono Warren, mig...@ensopi.com, cuyler...@gmail.com, and...@paperpile.com, Ceof1, Chromium Extensions, Jackie Han, Shu, Simeon Vincent, Will Decker, William Griffin, raj.or....@gmail.com, salem...@gmail.com, v.a.ki...@gmail.com, vladimir...@gmail.com, wOxxOm, yankovic...@gmail.com, Kyle Edwards

Our MV3 users are still experiencing service worker issues after updates are released.  It seems like there is a patch worked on [here](https://bugs.chromium.org/p/chromium/issues/detail?id=1271154), and was potentially released in chrome v102, but our latest extension release came with the "normal" amount of users reporting extension issues after the update -- we confirmed these users were on chrome v102.  
  
Who else is still experiencing this issue?  Does the chromium team know that the patch was not successful?  MV2 support timeline sunsets all MV2 updates in a few months, and developers can't publish new MV2 extensions to the webstore as of Jan 2022.  



![Gnanaprakash Rathinam's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVBwdgyhhjnuCkjFjTXTs44Vz-lc-hBCcpmt__78BHqP460EpKT-A=s40-c)

### Gnanaprakash Rathinam

unread,

Sep 19, 2022, 5:12:13 AM9/19/22

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

to Chromium Extensions, ky...@brighthire.ai, Jono Warren, mig...@ensopi.com, cuyler...@gmail.com, and...@paperpile.com, Ceof1, Chromium Extensions, Jackie Han, Shu, Simeon Vincent, Will Decker, William Griffin, raj.or....@gmail.com, salem...@gmail.com, v.a.ki...@gmail.com, vladimir...@gmail.com, wOxxOm, yankovic...@gmail.com

  
Any update on this issue would help us . Thank you 



![Guy S's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUNpl6AKBdhaIoSKKlKmfRFG2sGCydbhDklMEdG7g4CcYP_DKw=s40-c)

### Guy S

unread,

Jan 25, 2023, 12:27:18 AM1/25/23

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

to Chromium Extensions, g...@socialfrontier.com, ky...@brighthire.ai, Jono Warren, mig...@ensopi.com, cuyler...@gmail.com, and...@paperpile.com, Ceof1, Chromium Extensions, Jackie Han, Shu, Simeon Vincent, wi...@brighthire.ai, William Griffin, raj.or....@gmail.com, salem...@gmail.com, v.a.ki...@gmail.com, vladimir...@gmail.com, wOxxOm, yankovic...@gmail.com

Hey all,

  

We encounter the same issue when migrating our ext to MV3, after an update from the chrome web store - the service worker stops responding.

  

Do you know if anyone found a workaround? 

  

Cheers,

Guy.



![Laura Garay's profile photo](//lh3.googleusercontent.com/a-/ALV-UjW6856x0jIvTSksfv8-5aXKESz7DGu81T0Ggw7d9poqteDvKFl7lg=s40-c)

### Laura Garay

unread,

Jan 25, 2023, 10:55:37 AM1/25/23

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

to Chromium Extensions, Guy S, g...@socialfrontier.com, ky...@brighthire.ai, Jono Warren, mig...@ensopi.com, cuyler...@gmail.com, and...@paperpile.com, Ceof1, Chromium Extensions, Jackie Han, Shu, Simeon Vincent, wi...@brighthire.ai, William Griffin, raj.or....@gmail.com, salem...@gmail.com, v.a.ki...@gmail.com, vladimir...@gmail.com, wOxxOm, yankovic...@gmail.com

Good morning, I would like you to please help me to make my Lovense Extension work, since it says that it is from a "manifest\_version" version: 2, please help me with this, thanks.



![Michael Gardner's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXZik8Z6jsnb5JBZU7YXzC_mJI0_HMnu61zeHHURHXaVcBhGh4=s40-c)

### Michael Gardner

unread,

Mar 2, 2023, 5:24:07 AM3/2/23

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

to Chromium Extensions, Laura Garay, Guy S, g...@socialfrontier.com, ky...@brighthire.ai, Jono Warren, mig...@ensopi.com, cuyler...@gmail.com, and...@paperpile.com, Ceof1, Chromium Extensions, Jackie Han, Shu, Simeon Vincent, wi...@brighthire.ai, William Griffin, raj.or....@gmail.com, salem...@gmail.com, v.a.ki...@gmail.com, vladimir...@gmail.com, wOxxOm, yankovic...@gmail.com

Good morning everyone!   
  
We have a browser extension with around 3000 users and constantly experiencing the issue (in the logs I see easily 30-60 error logs daily) and almost every day users are sending us emails that they encounter the issue. We created a guide for them on how to fix the issue (e.g. reload the extension, or reinstall it), but in general it is a very frustrating experience for the users.   
  
If we can help by providing more details / error logs, please let us know how we can contribute to fix the issue.   
  
Thanks everyone! 



![Ashish D's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXB8WdO8NvAoqaPbhI-18Lyd5GMzu6slygR0oNhpmgsIIM6rO8=s40-c)

### Ashish D

unread,

May 14, 2024, 12:22:56 PM5/14/24

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

to Chromium Extensions, Michael Gardner, Laura Garay, Guy S, g...@socialfrontier.com, ky...@brighthire.ai, Jono Warren, mig...@ensopi.com, cuyler...@gmail.com, and...@paperpile.com, Ceof1, Chromium Extensions, Jackie Han, Shu, Simeon Vincent, William Griffin, raj.or....@gmail.com, salem...@gmail.com, v.a.ki...@gmail.com, vladimir...@gmail.com, wOxxOm, yankovic...@gmail.com

Hello, we had migrated our extension from v2 to v3 in Jan 2023 and ran into issue similar to the one here. Does anyone know if this issue has been resolved? Thank you for your kind help.  

  

Ashish  



![Albert Gonzalez's profile photo](//lh3.googleusercontent.com/a-/ALV-UjU0v-pNGyJa1enIa99UiWOWfiL-iCN6AUIpNhwbeCUDeMe4amI=s40-c)

### Albert Gonzalez

unread,

May 24, 2024, 6:42:49 AM5/24/24

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

to Chromium Extensions, Ashish D, Michael Gardner, Laura Garay, Guy S, g...@socialfrontier.com, ky...@brighthire.ai, Jono Warren, mig...@ensopi.com, cuyler...@gmail.com, and...@paperpile.com, Ceof1, Chromium Extensions, Jackie Han, Shu, Simeon Vincent, William Griffin, raj.or....@gmail.com, salem...@gmail.com, v.a.ki...@gmail.com, vladimir...@gmail.com, wOxxOm, yankovic...@gmail.com

Hi everyone,

  

Same here. We have updated our extension to V3 this week and now we are seeing in our logs that the Service Worker is not working properly for some users (and they use Chrome 125). We tried to migrate in 2022 and we rolled back to V2 because of this issue. Please fix it (or delay the migration to V3...)!

  

Thank you very much.  
  



![Oliver Dunk's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUzUEflsvjipGd7cvZEsFUHskmlfPymb4qDCb2t3fhdt4oaM5iB=s40-c)

### Oliver Dunk

unread,

May 24, 2024, 7:01:00 AM5/24/24

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

to Albert Gonzalez, Chromium Extensions, Ashish D, Michael Gardner, Laura Garay, Guy S, g...@socialfrontier.com, ky...@brighthire.ai, Jono Warren, mig...@ensopi.com, cuyler...@gmail.com, and...@paperpile.com, Ceof1, Jackie Han, Shu, Simeon Vincent, William Griffin, raj.or....@gmail.com, salem...@gmail.com, v.a.ki...@gmail.com, vladimir...@gmail.com, wOxxOm, yankovic...@gmail.com

Hi all,

  

For those experiencing issues, is anyone still having trouble in Chrome 126? We have fixed several issues in the past and one more recently. That would be great to check because it's possible the most recent fix resolved any remaining issues.

  

We're not seeing this across extensions in general, so if you're not seeing issues you shouldn't need to worry about this -  but of course we don't want it to be happening to anyone and I'm very curious to figure out more about some of the reports here.

Oliver Dunk | DevRel, Chrome Extensions | [https://developer.chrome.com/](https://developer.chrome.com/) | London, GB

  

  





> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/717992ca-168e-4c6d-aace-56cc1e18e6e9n%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/717992ca-168e-4c6d-aace-56cc1e18e6e9n%40chromium.org?utm_medium=email&utm_source=footer).  

![Albert Gonzalez's profile photo](//lh3.googleusercontent.com/a-/ALV-UjU0v-pNGyJa1enIa99UiWOWfiL-iCN6AUIpNhwbeCUDeMe4amI=s40-c)

### Albert Gonzalez

unread,

Jun 20, 2024, 12:09:30 AM6/20/24

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

to Chromium Extensions, Oliver Dunk, Chromium Extensions, Ashish D, Michael Gardner, Laura Garay, Guy S, g...@socialfrontier.com, ky...@brighthire.ai, Jono Warren, mig...@ensopi.com, cuyler...@gmail.com, and...@paperpile.com, Ceof1, Jackie Han, Shu, Simeon Vincent, William Griffin, raj.or....@gmail.com, salem...@gmail.com, v.a.ki...@gmail.com, vladimir...@gmail.com, wOxxOm, yankovic...@gmail.com, Albert Gonzalez

Hi again,

  

thank you for your reply, Oliver. Yes, it is still happening in Chrome 126. I can't say if the SW brokes after auto update, but it is not reliable at all. For example, some of our clients reported that our extension did not boot up sometimes. The cause is that we check host permissions in the SW, but in these cases the SW is dead and does not respond, causing the content script waiting forever for this. Also, we have logs of "No SW" in our system that indicates that the SW is not always available.

  

Best regards!



![Patrick Bakke's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXr6LI6OgDFpt_Y5CGfA1iVwkoZzCpCNBU6shEySO9aa7DdQTsy=s40-c)

### Patrick Bakke

unread,

Mar 27, 2025, 12:53:05 PM3/27/25

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

to Chromium Extensions, Albert Gonzalez, Oliver Dunk, Chromium Extensions, Ashish D, Michael Gardner, Laura Garay, Guy S, g...@socialfrontier.com, ky...@brighthire.ai, Jono Warren, mig...@ensopi.com, cuyler...@gmail.com, and...@paperpile.com, Ceof1, Jackie Han, Shu, Simeon Vincent, William Griffin, raj.or....@gmail.com, salem...@gmail.com, v.a.ki...@gmail.com, vladimir...@gmail.com, wOxxOm, yankovic...@gmail.com

We're are continuing to see this impact a small number of our users in latest versions of Chrome (133.x). 

I.e. for a small number of our users, the service worker does not restart after upgrade events. 

Based on our data, _approximately_ 1/10000 upgrade events fail with this behavior (pretty rough estimate). 

  

Extension: Superhuman, id: dcgcnpooblobhncpnddnhoendgbnglpn.

  

Our only known remediation is asking these users to toggle the extension off/on or fully restart chrome. 

Obviously, this is clumsy and disruptive. A programatic solution would be preferred. 

  

Is there any information about a fix or workaround?   



![Oliver Dunk's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUzUEflsvjipGd7cvZEsFUHskmlfPymb4qDCb2t3fhdt4oaM5iB=s40-c)

### Oliver Dunk

unread,

May 19, 2025, 5:02:03 AM5/19/25

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

to Patrick Bakke, Chromium Extensions, Albert Gonzalez, Ashish D, Michael Gardner, Laura Garay, Guy S, g...@socialfrontier.com, ky...@brighthire.ai, Jono Warren, mig...@ensopi.com, cuyler...@gmail.com, and...@paperpile.com, Ceof1, Jackie Han, Shu, Simeon Vincent, William Griffin, raj.or....@gmail.com, salem...@gmail.com, v.a.ki...@gmail.com, vladimir...@gmail.com, wOxxOm, yankovic...@gmail.com

Hi Patrick,

  

The issue ([https://issues.chromium.org/issues/40805401](https://issues.chromium.org/issues/40805401)) was reassigned recently and I'm hopeful we might see some progress there soon.

  

I'm sorry this has taken so long, and it is definitely still on our radar. I will keep following up with the team to try and get some movement there.

Oliver Dunk | DevRel, Chrome Extensions | [https://developer.chrome.com/](https://developer.chrome.com/) | London, GB

  



![Mark Stacey's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVXI3AFetHvycpR615BYzdgny2Zhx_wEIPMp49BeywWYVIz7g=s40-c)

### Mark Stacey

unread,

Aug 22, 2025, 6:49:08 AM8/22/25

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

to Chromium Extensions, Oliver Dunk, Chromium Extensions, Albert Gonzalez, Ashish D, Michael Gardner, Laura Garay, Guy S, g...@socialfrontier.com, ky...@brighthire.ai, Jono Warren, mig...@ensopi.com, cuyler...@gmail.com, and...@paperpile.com, Ceof1, Jackie Han, Shu, Simeon Vincent, William Griffin, raj.or....@gmail.com, salem...@gmail.com, v.a.ki...@gmail.com, vladimir...@gmail.com, wOxxOm, yankovic...@gmail.com, Patrick Bakke

Our team continues to see reports of the extension becoming inoperable after using the manual "Update" button. We've had hundreds of reports of this in the past year from users, and dozens of reports of this happening to people on our team.

  

We also recently tried to rollout a "forced auto-update" feature as described in the original post in this thread, and had to disable it because of reports of this same bug affecting that process as well (i.e. after a \`chrome.runtime.reload()\` call when an update is available, \`Port\` objects would never receive messages from other extension processes).  

  

We've shared further details in this issue: [https://issues.chromium.org/issues/40805401#comment147](https://issues.chromium.org/issues/40805401#comment147)

  

  



![Rui Conti's profile photo](//lh3.googleusercontent.com/a-/ALV-UjU8lW4Pm-LsGSJpAJF_6pkT5m2KD41E0bdTOLPwkLtMusVRlTVf=s40-c)

### Rui Conti

unread,

Aug 26, 2025, 12:10:25 AM8/26/25

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

to Mark Stacey, Chromium Extensions, Oliver Dunk, Albert Gonzalez, Ashish D, Michael Gardner, Laura Garay, Guy S, g...@socialfrontier.com, ky...@brighthire.ai, Jono Warren, mig...@ensopi.com, cuyler...@gmail.com, and...@paperpile.com, Ceof1, Jackie Han, Shu, Simeon Vincent, William Griffin, raj.or....@gmail.com, salem...@gmail.com, v.a.ki...@gmail.com, vladimir...@gmail.com, wOxxOm, yankovic...@gmail.com, Patrick Bakke

Unsure if related to the issues mentioned in this thread, but since April/May we’ve begun receiving reports of extensions in a “stale state”\[0\] after an “update”\[1\] happens. Unfortunately, we have been unable to reproduce the issue. We’ve gone to the lengths of simulating an upstream server (as in, CWS’ update servers) in an attempt to recreate the conditions in which production extensions are updated, but we couldn’t reproduce the issue consistently (even though the project was worthwhile as we can now reliably test implementations on top of onUpgradeAvailable).

  

  

\[0\]: By stale state, I mean a state in which the Service Worker does not receive \_any\_ chrome. events — tabs, webNavigation, webRequests — nada; not from listeners registered at startup and neither from listeners registered adhoc, in devtools when debugging. The Service Worker reports itself as “active”, and we can see it as such on internals page, as well as introspecting its state on globalThis.

  

  





> To view this discussion visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/b7ae07f9-eff6-4c8f-9b17-ab7cc357c845n%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/b7ae07f9-eff6-4c8f-9b17-ab7cc357c845n%40chromium.org?utm_medium=email&utm_source=footer).  

Reply all

Reply to author

Forward



0 new messages


