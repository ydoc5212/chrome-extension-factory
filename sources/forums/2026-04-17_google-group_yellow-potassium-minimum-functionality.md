---
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/GdtnseYh5Ng
captured_at: '2026-04-17'
capture_method: script-rendered
source_type: forum
source_id: google-group
title_at_capture: 'Re: Extension rejected with Violation ID Purple Potassium'
author: null
evidence_class: b
topics: []
wayback_url: >-
  https://web.archive.org/web/20260417024903/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/GdtnseYh5Ng
related_docs: []
notes: Fill in during curation.
thread_url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/GdtnseYh5Ng
post_count: null
accepted_answer: null
---

# Re: Extension rejected with Violation ID Purple Potassium

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

# Re: Extension rejected with Violation ID Purple Potassium

2,099 views

Skip to first unread message



Message has been deleted

![Roberto Oneto's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUiT6-8HCNniIBXKD_35J-ThXQfhNx31x5qEER2k_Wd4M_c0Y4=s40-c)

### Roberto Oneto

unread,

Apr 9, 2021, 12:36:50 AM4/9/21

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

to Chromium Extensions, xiji...@gmail.com

What is "Purple Potassium"?

A new Pokemon game?  
  

Il giorno venerdì 9 aprile 2021 alle 04:06:02 UTC+2 xiji...@gmail.com ha scritto:  

> Hi, my extension dose use some  APIs and need  related  permissions, but it was rejected with flowing reason. Is there anyting I need to do?
> 
>   
> 
> Use of Permissions:
> 
>   
> 
> Violation reference ID: Purple Potassium
> 
> Violation: Requesting but not using the following permission(s):
> 
>     contextMenus
> 
>     tabs
> 
>     storage

![Xijian Yan's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXVWL-dFvtWrfoeOiaaVGAkhtCs_elzkZc8ukT2N-Wa_UYxkmgL=s40-c)

### Xijian Yan

unread,

Apr 9, 2021, 12:56:30 AM4/9/21

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

to Chromium Extensions, rob...@gmail.com, Xijian Yan

Not a game, it's a notification ID

[https://developer.chrome.com/docs/webstore/troubleshooting/#excessive-permissions](https://developer.chrome.com/docs/webstore/troubleshooting/#excessive-permissions)  
  



![Roberto Oneto's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUiT6-8HCNniIBXKD_35J-ThXQfhNx31x5qEER2k_Wd4M_c0Y4=s40-c)

### Roberto Oneto

unread,

Apr 9, 2021, 1:58:20 AM4/9/21

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

to Chromium Extensions, xiji...@gmail.com, Roberto Oneto

It was a joke :-)

Have you just checked if you are really using these permission?

If I remember correctly, "localStorage" doesn't need the storage permission unlike chome.storage.local.

Also try replacing "tabs" with "activeTab" and check if the extension still works.

For "contextMenu" there is no doubt; if you use a context menu you have to grant that permission in manfifest.

I hope somehow I have given you some good advice



![Xijian Yan's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXVWL-dFvtWrfoeOiaaVGAkhtCs_elzkZc8ukT2N-Wa_UYxkmgL=s40-c)

### Xijian Yan

unread,

Apr 9, 2021, 4:10:50 AM4/9/21

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

to Chromium Extensions, rob...@gmail.com, Xijian Yan

Thanks for your advice.  I did do some tests, and I am sure that my extension needs **contextMenus** and **storage** permissions, without them it will fail to load.

-   **contextMenus**: chrome.contextMenus.creat, echrome.contextMenus.update, chrome.contextMenus.removeAll  
    
-   **storage**:  chrome.storage.local.get, chrome.storage.local.set, chrome.storage.onChanged.addListener

And about the **tabs**  permission, I am not really sure. Without the **tabs** permission, my extension loads successfully, but some functions do not work well. It seems that it can't get the **tab.url** from the callback of **chrome.tabs.get**. 

  

I think I was misled by the email, the email does not seem to point out the permission which is really unnecessary.

I would do more search and tests, and thanks for your advice again. : )



![Xijian Yan's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXVWL-dFvtWrfoeOiaaVGAkhtCs_elzkZc8ukT2N-Wa_UYxkmgL=s40-c)

### Xijian Yan

unread,

Apr 9, 2021, 4:19:05 AM4/9/21

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

to Chromium Extensions, Xijian Yan, rob...@gmail.com

But the document says "**However, if you require access to the [url](https://developer.chrome.com/docs/extensions/reference/tabs/#property-Tab-url), [pendingUrl](https://developer.chrome.com/docs/extensions/reference/tabs/#property-Tab-pendingUrl), [title](https://developer.chrome.com/docs/extensions/reference/tabs/#property-Tab-title), or [favIconUrl](https://developer.chrome.com/docs/extensions/reference/tabs/#property-Tab-favIconUrl) properties of [tabs.Tab](https://developer.chrome.com/docs/extensions/reference/tabs/#type-Tab), you must declare the "tabs" permission in the manifest**". Maybe I should mention the APIs I use in my extension when I submit my extension.



![Roberto Oneto's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUiT6-8HCNniIBXKD_35J-ThXQfhNx31x5qEER2k_Wd4M_c0Y4=s40-c)

### Roberto Oneto

unread,

Apr 9, 2021, 4:54:25 AM4/9/21

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

to Chromium Extensions, xiji...@gmail.com, Roberto Oneto

It then appears that you are right across the board.  

If you access properties such as the **url** then it is also legitimate to request permission: "tabs".

It would seem that there is nothing left for you to do but submit a specific request indicating the same reasons you described to the support team.

Or try resubmitting the extension indicating (if you have not already done so), in the relevant text areas, the reasons why you need each of these permissions.  



![Владимир Янкович's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVB6U_gnIMMqwINFLR4iXuAhPFsKnle9OLyFoSwDNJo3DsfOACmpQ=s40-c)

### Владимир Янкович

unread,

Apr 9, 2021, 10:28:54 AM4/9/21

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

to Chromium Extensions, rob...@gmail.com, xiji...@gmail.com

The fact that your extension stops working without some kind of permission is not proof that you need any permission. If the moderator thinks that your functions could be implemented differently, this is enough to reject you. So make sure not only that you need this permission now, but also that you cannot get around this permission without it.  
  

пятница, 9 апреля 2021 г. в 14:54:25 UTC+3, rob...@gmail.com:  



![Xijian Yan's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXVWL-dFvtWrfoeOiaaVGAkhtCs_elzkZc8ukT2N-Wa_UYxkmgL=s40-c)

### Xijian Yan

unread,

Apr 20, 2021, 7:04:02 PM4/20/21

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

to Chromium Extensions, yankovic...@gmail.com, rob...@gmail.com, Xijian Yan

Hi all, it turns out that I made a stupid mistake: I uploaded an item that contains a packed extension but not the source code. I resubmitted a correct item and it got approved. Thanks for all your replies. : )



![Chromium Extensions's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVdptysOxgA9k6EfvED8bhiTrk8KXsYnTF50gOvv3Tbx8Bdzdmxqw=s40-c)

### Chromium Extensions

unread,

Sep 19, 2023, 12:14:26 AM9/19/23

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

to Chromium Extensions, Xijian Yan, yankovic...@gmail.com, rob...@gmail.com

What you do in source code



![Xijian Yan's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXVWL-dFvtWrfoeOiaaVGAkhtCs_elzkZc8ukT2N-Wa_UYxkmgL=s40-c)

### Xijian Yan

unread,

Sep 19, 2023, 12:31:54 AM9/19/23

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

to Chromium Extensions, Chromium Extensions, Xijian Yan

It was my mistake. I uploaded the binary package of my extension instead of the source code.  😂



![Chromium Extensions's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVdptysOxgA9k6EfvED8bhiTrk8KXsYnTF50gOvv3Tbx8Bdzdmxqw=s40-c)

### Chromium Extensions

unread,

Sep 19, 2023, 12:36:43 AM9/19/23

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

to Chromium Extensions, Chromium Extensions, Xijian Yan, yankovic...@gmail.com, rob...@gmail.com

Bro i have 3 rejections   
1) Yellow Potassium   
2) Purple Potassium   
3) Yellow Maenssium  
  
Please help me to live my crome extension 



![Patrick Kettner's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXAeZ7BcG6G83JtXobsIZw66NZtI4QR3PAkQFUOIGFQG17Oj1Q=s40-c)

### Patrick Kettner

unread,

Sep 19, 2023, 7:46:22 PM9/19/23

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

to Chromium Extensions, Chromium Extensions, Xijian Yan, yankovic...@gmail.com, rob...@gmail.com

[Yellow Potassium](https://developer.chrome.com/docs/webstore/troubleshooting/#minimum-functionality) is given when you lack minimum functionality, [Purple Potassium](https://developer.chrome.com/docs/webstore/troubleshooting/#excessive-permissions) is given when you request what is perceived as excessive permissions, and [Yellow Magnesium](https://developer.chrome.com/docs/webstore/troubleshooting/#does-not-work) is given when the extension is not working. 

  

You would want to contact One Stop Support ([https://support.google.com/chrome\_webstore/contact/one\_stop\_support](https://support.google.com/chrome_webstore/contact/one_stop_support)) for questions on how to fix your specific extension.

  

  





> \--  
> You received this message because you are subscribed to the Google Groups "Chromium Extensions" group.  
> To unsubscribe from this group and stop receiving emails from it, send an email to chromium-extens...@chromium.org.  
> To view this discussion on the web visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/89104d72-113a-4ddc-84eb-db415a95e50an%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/89104d72-113a-4ddc-84eb-db415a95e50an%40chromium.org?utm_medium=email&utm_source=footer).  

Reply all

Reply to author

Forward



0 new messages


