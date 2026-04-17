---
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/k5upFLVnPqE
captured_at: '2026-04-16'
capture_method: script-rendered
source_type: forum
source_id: google-group
title_at_capture: MV3, (inactive) service workers, and alarms
author: null
evidence_class: b
topics:
  - service-worker
  - manifest-v3
  - lifecycle
  - keepalive
wayback_url: >-
  https://web.archive.org/web/20260416224054/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/k5upFLVnPqE
related_docs: []
notes: Fill in during curation.
thread_url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/k5upFLVnPqE
post_count: null
accepted_answer: null
---

# MV3, (inactive) service workers, and alarms

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

# MV3, (inactive) service workers, and alarms

655 views

Skip to first unread message



![BoD's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUpMCwB3GDbbyHA7UAL6HOODVO0SZMOPW4NMBbIw8zMlGRgnE46Gw=s40-c)

### BoD

unread,

Sep 19, 2024, 2:30:27 AM9/19/24

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

Hi!

  

I'm the author of an extension that wants to periodically synchronize bookmarks with a remote document once an hour.

  

To do this I'm simply initiating an alarm ([https://developer.chrome.com/docs/extensions/reference/api/alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms)).

  

This worked for years, when my extension was using Manifest v2.

  

To continue maintaining my extension, I migrated to Manifest v3, and to service workers.

  

After doing this, it appears my alarm is no longer working.

  

I notice that in the Extensions manager, my service worker goes "inactive". (To make things worse, this doesn't happens as long as the dev tools window, showing the logs, is open, so while developing the extension I didn't realize there was an issue).

  

After some googling I am starting to have the impression that maybe this use case is simply no longer supported? (e.g. [https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension](https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension))

  

So in a nutshell here's my question: is it possible to have an extension do some work periodically in the background with Manifest v3?

  

Thanks a lot!

![Oliver Dunk's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUzUEflsvjipGd7cvZEsFUHskmlfPymb4qDCb2t3fhdt4oaM5iB=s40-c)

### Oliver Dunk

unread,

Sep 19, 2024, 2:36:05 AM9/19/24

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

to BoD, Chromium Extensions

Hi,

  

Scheduling a repeating alarm is definitely supported in Manifest V3 and should work similarly to Manifest V2. Would you be able to share the relevant code, or the source code for your extension, so we can take a look?

  

Alarm persistence following browser restarts isn't currently guaranteed so you do need to make sure you are checking the alarm each time the service worker starts up: [https://developer.chrome.com/docs/extensions/reference/api/alarms#persistence](https://developer.chrome.com/docs/extensions/reference/api/alarms#persistence)  

  

Regarding the Stack Overflow post you shared, that is about a "persistent" service, or one that never goes idle. This isn't supported but alarms run even if the service worker is idle and needs to be woken up - so that shouldn't be a problem.

  

Thanks,  

Oliver Dunk | DevRel, Chrome Extensions | [https://developer.chrome.com/](https://developer.chrome.com/) | London, GB

  

  





> \--  
> You received this message because you are subscribed to the Google Groups "Chromium Extensions" group.  
> To unsubscribe from this group and stop receiving emails from it, send an email to chromium-extens...@chromium.org.  
> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/a006e5e0-9a16-4ed0-bdf5-f1cc446d7679n%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/a006e5e0-9a16-4ed0-bdf5-f1cc446d7679n%40chromium.org?utm_medium=email&utm_source=footer).  

![BoD's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUpMCwB3GDbbyHA7UAL6HOODVO0SZMOPW4NMBbIw8zMlGRgnE46Gw=s40-c)

### BoD

unread,

Sep 19, 2024, 2:44:11 AM9/19/24

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

Thanks a lot for replying.

It's great to hear that at least this should work and is still supported!

That means the issue lies in my code. It's not in a state that I can share here right now but what I'll do is a very simple minimal extension that starts an alarm and if that works I'll try to understand the difference with my project. I'll come back to this thread if something doesn't work.

Cheers!



![Vibhash Chandra's profile photo](//lh3.googleusercontent.com/a-/ALV-UjV_VDSkXrdDat6PkLABaVwqwitUyRNLcZh-jQQo8Q1C7RygwA5b9g=s40-c)

### Vibhash Chandra

unread,

Sep 19, 2024, 2:45:29 AM9/19/24

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

to Oliver Dunk, BoD, Chromium Extensions

What should be the minimum duration for alarm?

  

Regards,

Vibhash.

  





> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CAOsQqBnJWy0VdpWRH\_1PFAEasjC5-aW7fG3qEPSUByz-jXK9OQ%40mail.gmail.com](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CAOsQqBnJWy0VdpWRH_1PFAEasjC5-aW7fG3qEPSUByz-jXK9OQ%40mail.gmail.com?utm_medium=email&utm_source=footer).  

![Oliver Dunk's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUzUEflsvjipGd7cvZEsFUHskmlfPymb4qDCb2t3fhdt4oaM5iB=s40-c)

### Oliver Dunk

unread,

Sep 19, 2024, 2:47:37 AM9/19/24

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

to Vibhash Chandra, BoD, Chromium Extensions

From Chrome 120, the minimum alarm duration is 30 seconds: [https://developer.chrome.com/docs/extensions/whats-new#chrome\_120\_minimum\_alarm\_granularity\_reduced\_to\_30\_seconds](https://developer.chrome.com/docs/extensions/whats-new#chrome_120_minimum_alarm_granularity_reduced_to_30_seconds)

  

If you need anything higher frequency, you should be able to use setInterval. You will just need to make sure you are doing something to keep the service worker alive, such as calling an extension API which extends the service worker's lifetime.

  

Oliver Dunk | DevRel, Chrome Extensions | [https://developer.chrome.com/](https://developer.chrome.com/) | London, GB



![Roberto Oneto's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUiT6-8HCNniIBXKD_35J-ThXQfhNx31x5qEER2k_Wd4M_c0Y4=s40-c)

### Roberto Oneto

unread,

Sep 19, 2024, 6:27:53 AM9/19/24

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

to Chromium Extensions, Oliver Dunk, BoD, Chromium Extensions, Vibhash Chandra

Hi,

about the persistence of the alarms and suggestions on the official documentation page I wondered something.  
If I wanted to keep track of some important alarms and replicate them on another device what would be the best way to proceed?  
  
Let's say that I am working on an interface to view, create and modify events of a calendar (such as Google Calendar)  
Let's say that the user choose to be notified with a web notification when an event fires.  
The extension creates an alarm with a name equal or similar to the name of the calendar event id, then sets the start time of the event and stores the alarm json structure in the synchronized storage.  
  
Now passing to another device (or compatible browser) I would like the newly created alarm to be cloned as that one on the first device.  
Surely when I open the browser and the service worker is activated I could read the sync storage and therefore align the alarms.  
In this way I can trust that the notification will also be created on this latter device at the right moment.  
  
Let's say now that  
1) On the first device, I make a change to the event that is reflected on the correlated alarm and so the sync storage.  
2) On the second device the SW does not reactivate because it is already active.  
  
In order not to break the event-alam-notification chain on the 2nd device what should I do?  
I can certainly implement a cyclical request (pooling) to control the changes.  
However, I wondered: "**Can I take advantage of the chrome.storage.onchanged.Addlistenner event to intercept the modification of the storage made on the other device?**"  
Does this type of event has the potential to triggear to changes on other connected devices or is it limited to the changes of the device \\ browser in which the extension is installed?  
  
Thank you  
  



![Oliver Dunk's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUzUEflsvjipGd7cvZEsFUHskmlfPymb4qDCb2t3fhdt4oaM5iB=s40-c)

### Oliver Dunk

unread,

Sep 19, 2024, 6:59:46 AM9/19/24

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

to Roberto Oneto, Chromium Extensions, BoD, Vibhash Chandra

Hi Roberto,

  

If you add an onChanged listener specifically for the sync storage area, that should fire across all devices when updated data is synced :)

  

Thanks,

Oliver Dunk | DevRel, Chrome Extensions | [https://developer.chrome.com/](https://developer.chrome.com/) | London, GB

  



Message has been deleted

![Roberto Oneto's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUiT6-8HCNniIBXKD_35J-ThXQfhNx31x5qEER2k_Wd4M_c0Y4=s40-c)

### Roberto Oneto

unread,

Sep 19, 2024, 7:31:41 AM9/19/24

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

to Chromium Extensions, Oliver Dunk, Chromium Extensions, BoD, Vibhash Chandra, Roberto Oneto

Thanks Oliver,

it's a good news.

Among other things I don't think it's very easy to verify with a packaged extension.



![Roberto Oneto's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUiT6-8HCNniIBXKD_35J-ThXQfhNx31x5qEER2k_Wd4M_c0Y4=s40-c)

### Roberto Oneto

unread,

Sep 19, 2024, 8:02:24 AM9/19/24

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

to Chromium Extensions, Roberto Oneto, Oliver Dunk, Chromium Extensions, BoD

Maybe someone has already asked for it in the community.  
It would be nice to extend alams API so that the creation and deletion of alarms are synchronized among devices.  
Something like chrome.sync.alarms.create ('name', {props})  
or chrome.alarms.create ('name', {props}, {mode: sync}).

  

Could there be side effects?  
  



![Oliver Dunk's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUzUEflsvjipGd7cvZEsFUHskmlfPymb4qDCb2t3fhdt4oaM5iB=s40-c)

### Oliver Dunk

unread,

Sep 19, 2024, 8:12:26 AM9/19/24

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

to Roberto Oneto, Chromium Extensions, BoD

I think that's the first time I've seen that suggestion :)

  

On the surface, it seems possible and I can't think of any hard blockers.

  

There may be some difficulties with higher resolution alarms - e.g, do we fire it on multiple devices and what if you delete the alarm on one device but it doesn't have time to sync before it fires on another? etc.

Oliver Dunk | DevRel, Chrome Extensions | [https://developer.chrome.com/](https://developer.chrome.com/) | London, GB

  



![BoD's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUpMCwB3GDbbyHA7UAL6HOODVO0SZMOPW4NMBbIw8zMlGRgnE46Gw=s40-c)

### BoD

unread,

Sep 27, 2024, 8:00:52 AM9/27/24

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

  
Hey Oliver,  I finally found the time to try a very minimalist extension that simply tries to schedule an alarm every minute, which makes a call to a server I own (this is a way for me to have some form of logging).

  

When I inspect the extension, I see that my alarm get scheduled (the first time), and that it is already scheduled (the following times). However, by looking at my server's log, I can see that my callback is only called AS LONG as the extension is being inspected, or the popup is open.

  

In other words, \`chrome.alarms.get("myAlarm")\` returns an alarm, but my listener doesn't seem to be called when the service worked goes "inactive". 

  

What am I doing wrong? The code can be found here: [https://github.com/BoD/chrome-extension-alarm/tree/master/extension](https://github.com/BoD/chrome-extension-alarm/tree/master/extension)

  

Thanks!

  

\-- 

BoD



![Oliver Dunk's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUzUEflsvjipGd7cvZEsFUHskmlfPymb4qDCb2t3fhdt4oaM5iB=s40-c)

### Oliver Dunk

unread,

Sep 27, 2024, 8:05:24 AM9/27/24

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

to BoD, Chromium Extensions

Hi,

  

Thanks so much for sharing that! It's really helpful.

  

Could you try moving the \`chrome.alarms.onAlarm.addListener\` call out of the main function and to the top-level of the script? Currently, you're registering it asynchronous, as this means you are likely to miss events when the service worker starts up. We have some more information on that [here](https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers#register-listeners).

  

Let me know if that helps.

  

Thanks,

Oliver Dunk | DevRel, Chrome Extensions | [https://developer.chrome.com/](https://developer.chrome.com/) | London, GB

  





> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/7d0eadf0-f236-4b33-9151-610fd2f9bc17n%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/7d0eadf0-f236-4b33-9151-610fd2f9bc17n%40chromium.org?utm_medium=email&utm_source=footer).  

![BoD's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUpMCwB3GDbbyHA7UAL6HOODVO0SZMOPW4NMBbIw8zMlGRgnE46Gw=s40-c)

### BoD

unread,

Sep 27, 2024, 8:34:05 AM9/27/24

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

Thanks a lot! I've made the change and it seems to have fixed the issue!

  

I've pushed the change to the repo, for future reference.

  

Cheers,

  

\-- 

BoD  
  



Reply all

Reply to author

Forward



0 new messages


