---
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/4txWvDW55hU
captured_at: '2026-04-17'
capture_method: script-rendered
source_type: forum
source_id: google-group
title_at_capture: 'PSA: Messaging API Changes for Chromium Extension Developers'
author: null
evidence_class: b
topics: []
wayback_url: >-
  https://web.archive.org/web/20260417024931/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/4txWvDW55hU
related_docs: []
notes: Fill in during curation.
thread_url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/4txWvDW55hU
post_count: null
accepted_answer: null
---

# PSA: Messaging API Changes for Chromium Extension Developers

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

# PSA: Messaging API Changes for Chromium Extension Developers

2,841 views

Skip to first unread message



![Justin Lulejian's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUv8JV94G-QChFsYOz_DOWfSUOmHl5suzZocnFZZwAx4t6faw=s40-c)

### Justin Lulejian

unread,

Nov 5, 2025, 3:04:43 PM11/5/25

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

Dear Chromium Extension Developers,

We're excited to announce several related upcoming changes in Chrome 144. These are currently available in the latest Canary. The change should reach Stable on January 13th, 2026.

TL;DR

-   Launching the browser namespace by default, as an optional alternative to chrome
    
-   Supporting Promise returns in runtime.onMessage listeners
    
-   Changes to the messaging APIs, designed to better align with [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) (polyfill)
    

These improvements aim to make extension development more consistent and predictable across different browsers. They also enable the browser namespace we [announced earlier](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/gK1Sd57p4go/m/lgP9_dhZBQAJ), which will launch with these changes.  
  
We strongly encourage you to test these new features to see if your extension(s) require any messaging adjustments since the polyfill [will become a noop](https://github.com/mozilla/webextension-polyfill/blob/ff0f24b2e3d816c76330ff931f7cc042c622c123/src/browser-polyfill.js#L13) when these changes take effect.

  

**Supporting Promise returns from runtime.OnMessage listeners**

We are implementing [support for returning promises directly from runtime.OnMessage](https://issues.chromium.org/u/1/issues/40753031) listeners. With this and promise support now available for other APIs, we hope most extension developers will no longer need the polyfill.

// content\_script.js

let response = await chrome.runtime.sendMessage('test');

console.assert(response === 'promise resolved');

// background.js

function onMessageListener(message, sender, sendResponse) {

  return new Promise((resolve) \=> {

    resolve('promise resolved');

  }

}

chrome.runtime.onMessage.addListener(onMessageListener);

  

**runtime.OnMessage Behavior Alignment with Polyfill**

In addition to promise support, we are making [adjustments to how runtime.OnMessage() behaves](https://issues.chromium.org/issues/439644930) with error scenarios to more closely match the polyfill.

  

**Listeners that throw errors before responding** 

The first listener to throw an error will cause the sender’s promise to reject. 

// content\_script.js

chrome.runtime.sendMessage('test').reject((reject) => {

  console.assert(reject.message === 'error!');

});

// background.js

function onMessageListener(message, sender, sendResponse) {

  throw new Error('error!');

}

chrome.runtime.onMessage.addListener(onMessageListener);

function onMessageListener(message, sender, sendResponse) {

  sendResponse('response');

}

chrome.runtime.onMessage.addListener(onMessageListener);

Listener ordering still matters: 

// content\_script.js

let response = await chrome.runtime.sendMessage('test');

console.assert(response === 'response');

// background.js

function onMessageListener(message, sender, sendResponse) {

  sendResponse('response');

}

chrome.runtime.onMessage.addListener(onMessageListener);

function onMessageListener(message, sender, sendResponse) {

  throw new Error('error!');

}

chrome.runtime.onMessage.addListener(onMessageListener);

  
We’ve also made improvements to handling unserializable responses. See the next section for more details as it is a slightly different implementation.

  

**Subtle differences from the polyfill and runtime.onMessage (MDN)**

While we aim to closely match the polyfill and runtime.onMessage on MDN, there will still be some subtle differences. This section outlines all known differences to help you smoothly transition away from using the polyfill if it's no longer needed. If you find any significant additional ones please let us know!

  

**Returned promises that reject with anything other than an Error\-type (undefined, etc.)**

They’ll receive a generic static error message, rather than the .message property from the thrown object which the polyfill would return.

// content\_script.js  
// Chromium

chrome.runtime.sendMessage('test').reject((reject\_reason) => {

  console.assert(  
    reject.message === 'A runtime.onMessage listener\\'s promise rejected without an ' +

      'Error');

});

// background.js

function onMessageListener(message, sender, sendResponse) {

  return new Promise((unusedResolve, reject) \=> {

    reject(undefined);

  });

}

chrome.runtime.onMessage.addListener(onMessageListener);

  

**Listeners that respond with unserializable responses**

This now rejects the sender’s promise like the polyfill does, but it does it immediately and with a specific error rather than waiting until the worker stops.

// content\_script.js

chrome.runtime.sendMessage('test').reject((reject\_reason) => {

  console.assert(reject.message === 'Error: Could not serialize message.!');

});

// background.js

function onMessageListener(message, sender, sendResponse) {

  // Functions aren't currently serializable but we're [working on it](https://crbug.com/40321352).

  sendResponse(() => {});  // a TypeError is thrown here

}

chrome.runtime.onMessage.addListener(onMessageListener);

**  
async functions passed to runtime.OnMessage**

async functions always return promises, so the browser treats them as if a promise was returned from the listener, even if it never responds or calls sendResponse. This is similar to how runtime.onMessage() [as described on MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage) handles async functions as [sending an asynchronous response using a Promise](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage#sending_an_asynchronous_response_using_a_promise). However, our response return values differ slightly:

// content\_script.js

let response \= await chrome.runtime.sendMessage('test');

console.assert(response \=== true);  // MDN

console.assert(response \=== null);  // Chromium

// background.js

async function onMessageListener(message, sender) {

  // Do some things, but without sendResponse

}

chrome.runtime.onMessage.addListener(onMessageListener);

**  
multiple async functions passed to runtime.OnMessage**

runtime.onMessage() MDN documentation describes that passing an async function to a listener [will prevent any other listeners (async or not) from responding to the sender’s message](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage#listener). Chromium does not have this restriction. Multiple async or non-async functions can be added as runtime.onMessage() listeners. The first listener to respond (synchronously or asynchronously) will have its response sent back to the message sender.

// content\_script.js

let response \= await chrome.runtime.sendMessage('test');

console.assert(response \=== 'slower response');  // MDN

console.assert(response \=== 'faster response');  // Chromium

// [background.js](http://background.js)

async function onMessageSlowerRespondingListener() {

  return new Promise((resolve) \=> {

    setTimeout(resolve, 1000, 'slower response');

  });

}

chrome.runtime.onMessage.addListener(slowerAsyncFunctionResponse);

async function onMessageFasterRespondingListener(message, sender) {

  return 'faster response';

}

chrome.runtime.onMessage.addListener(onMessageListener);

We hope that this change will make it easier to develop extensions across multiple browsers.

If you have any questions, please feel free to reach out to us.

Thank you,

Justin, on behalf of the Chromium Extensions Team

  

![Juraj M.'s profile photo](//lh3.googleusercontent.com/a-/ALV-UjXKHuWEKU4q8ActChuM5deyPeltTU3ZdWm5Mn2Y0zBAbcSb5Cz6=s40-c)

### Juraj M.

unread,

Nov 6, 2025, 1:05:11 AM11/6/25

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

to Chromium Extensions, Justin Lulejian, Oliver Dunk

**Amazing news, and you even implemented racing between replies from multiple listeners, that's crazy!**

Although I'm not exactly sure how that works, since the "async" function always returns a promise, does this mean the first non-undefined reply wins the race?

  

Actually, checking it now with some experiments, it may not work as expected :), the first async handler will still consume all messages.

  

Let's try some experiments, let's say we have this code in the background script:

browser.runtime.onMessage.addListener(async (message, sender) => {  
  switch (message.type) {  
    case 'a': return 1;  
    case 'b': return new Promise(r => setTimeout(() => r(2), 1e3));  
  }  
});  
browser.runtime.onMessage.addListener(async (message, sender) => {  
  switch (message.type) {  
    case 'c': return 3;  
    case 'd': return new Promise(r => setTimeout(() => r(4), 1e3));  
  }  
});

  

Now, let's send it 4 messages:  

await browser.runtime.sendMessage({type: 'a'}) // returns 1  
await browser.runtime.sendMessage({type: 'b'}) // returns null  
await browser.runtime.sendMessage({type: 'c'}) // returns null  
await browser.runtime.sendMessage({type: 'd'}) // returns null

  

This is exactly what I would expect - the "b" is null because the second handler already replies with Promise<undefined>, the "c" is null because the first handler replies with Promise<undefined> and same for the "d".

Also, why does it return null and not undefined? The reply is from the handler is obviously "undefined", not "null".

  

Anyway, if you want to make this work as expected, you still need to remove the async handlers:

browser.runtime.onMessage.addListener((message, sender) => {  
  switch (message.type) {  
    case 'a': return Promise.resolve(1);  
    case 'b': return new Promise(r => setTimeout(() => r(2), 1e3));  
  }  
});  
browser.runtime.onMessage.addListener((message, sender) => {  
  switch (message.type) {  
    case 'c': return Promise.resolve(3);  
    case 'd': return new Promise(r => setTimeout(() => r(4), 1e3));

    case 'e': return Promise.resolve(undefined);

  }  
});

  

Then you'll get:

await browser.runtime.sendMessage({type: 'a'}) // returns 1  
await browser.runtime.sendMessage({type: 'b'}) // returns 2  
await browser.runtime.sendMessage({type: 'c'}) // returns 3  
await browser.runtime.sendMessage({type: 'd'}) // returns 4

await browser.runtime.sendMessage({type: 'e'}) // returns null   

  

Which is almost correct, except for the "e" which should return "undefined".

Actually, checking the old version with the polyfill active, it also returns null. But I think that's still incorrect, for example Firefox will return undefined.

  

In any case, testing my extensions in Chrome 144 now, it seems to work OK!

**Thanks a lot for making this happen! :)**

  

PS:

Talk about messaging... any chance to add support for sending Blobs? :)  
It's one of the last compatibility issues I'm facing when implement extensions for Firefox/Chrome.



![PhistucK's profile photo](//lh3.googleusercontent.com/a-/ALV-UjVDqTacU4xthRS6oqajLHQXP36A8wTWyPPfqLFDlJYXXPHcVZry=s40-c)

### PhistucK

unread,

Nov 6, 2025, 11:05:16 AM11/6/25

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

to Justin Lulejian, Chromium Extensions, Oliver Dunk

\> // content\_script.js

\> chrome.runtime.sendMessage('test').**reject**((reject) => {

\>   console.assert(reject.message === 'error!');

\> });

\> // content\_script.js

\> chrome.runtime.sendMessage('test').**reject**((reject\_reason) => {

\>   console.assert(reject.message === 'Error: Could not serialize message.!');

\> });

  

Did you mean .catch(...)?

  

☆**PhistucK**

  

  





> \--  
> You received this message because you are subscribed to the Google Groups "Chromium Extensions" group.  
> To unsubscribe from this group and stop receiving emails from it, send an email to chromium-extens...@chromium.org.  
> To view this discussion visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/506b499d-c278-4408-9955-3cab48c73352n%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/506b499d-c278-4408-9955-3cab48c73352n%40chromium.org?utm_medium=email&utm_source=footer).  

![Alexander Shutau's profile photo](//lh3.googleusercontent.com/a-/ALV-UjXzUQ4gQRxYASmxrLdXT0J8VbB-xOc7ZLz4vSjRsLDj3XdHBFtQ=s40-c)

### Alexander Shutau

unread,

Nov 6, 2025, 12:30:57 PM11/6/25

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

to Chromium Extensions, PhistucK, Chromium Extensions, Oliver Dunk, Justin Lulejian

Since Chrome 144, when chrome.runtime.onMessage has multiple listeners, one with a Promise and another with sendResponse and return true, the response received will be null.

I've submitted a bug report [https://issues.chromium.org/issues/458410308](https://issues.chromium.org/issues/458410308)



![DreamBuilder Team's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUPG3I-ZHDrxSwxlEFJgdABOfFFFozpnUKXirQFh0vPbFf-53w=s40-c)

### DreamBuilder Team

unread,

Nov 7, 2025, 9:15:36 AM11/7/25

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

to Chromium Extensions, Alexander Shutau, PhistucK, Chromium Extensions, Oliver Dunk, Justin Lulejian

Good point @ Alexander, confirmed on my side - if code uses aproach below if fails with null response.

Sounds like sendResponse is not supported in new architecture.



![Max Nikulin's profile photo](//lh3.googleusercontent.com/a-/ALV-UjWwxCyS1FvvXSl_DKO-XejSjSIuNLO3jkEogbqxunAnddy3eMl1=s40-c)

### Max Nikulin

unread,

Nov 10, 2025, 8:58:56 AM11/10/25

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

to chromium-...@chromium.org

On 06/11/2025 16:05, Juraj M. wrote:  
\> \*Amazing news, and you even implemented racing between replies from  
\> multiple listeners, that's crazy!\*  

\> Although I'm not exactly sure how that works, since the "async" function  
\> always returns a promise, does this mean the first non-undefined reply  
\> wins the race?  
  

After rereading the original post I have figured out that it is unclear  
for me which way you inferred that Promise resolved to undefined should  
be treated in some special way (besides a subtle point, see below)? Race  
that discards undefined may be fragile. (Almost certainly it may be  
implemented as a wrapper though.)  

  
\> Also, why does it return null and not undefined? The reply is from the  
\> handler is obviously "undefined", not "null".  

\[...\]  
\>     case 'e': return Promise.resolve(undefined);\[...\]> await browser.runtime.sendMessage({type: 'e'}) // returns null  

\>  
\> Which is almost correct, except for the "e" which should return "undefined".  
\> Actually, checking the old version with the polyfill active, it also  
\> returns null. But I think that's still incorrect, for example Firefox  
\> will return undefined.  

\[...\]> PS:  

\> Talk about messaging... any chance to add support for sending Blobs? :)  
  

I think, the difference is that Firefox uses structured clone while  
Chromium relies on JSON serialization. It seems, it may be changed soon:  
  
<[https://issues.chromium.org/40321352](https://issues.chromium.org/40321352)\>  
Extension messaging uses base::Value (JSON) serialization but could use  
WebSerializedScriptValue (structured cloning)  
  
There is no undefined in JSON, so it is impossible to distinguish null  
and undefined in promise returned by sendMessage\`. However Promise  
resolved to undefined should be a special case since  
  
JSON.parse(JSON.stringify(undefined))  
  
throws an exception.  

![Juraj M.'s profile photo](//lh3.googleusercontent.com/a-/ALV-UjXKHuWEKU4q8ActChuM5deyPeltTU3ZdWm5Mn2Y0zBAbcSb5Cz6=s40-c)

### Juraj M.

unread,

Nov 10, 2025, 9:54:40 AM11/10/25

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

to Chromium Extensions, Max Nikulin

Thank you Max for the explanation about the null/undefined, that makes perfect sense now! :)  
  
About my first paragraph, I was just super confused (without checking your examples) how could you race two async handlers when one of them always wins with "undefined" while the other one tries to do something actually async, but will always reply second.  

I hope you understand what I'm trying to say :).

  

My examples with the switch case is a simplified real world example - something I use in all of my extensions in multiple files.  
I have many handlers, and each is handling a specific set of messages.  

But if I made them all async, then the first handler would still consume all messages, because it would reply with "undefined" when it didn't handled the message.

  

So when writing new docs, you should definitely mention that :)



![Justin Lulejian's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUv8JV94G-QChFsYOz_DOWfSUOmHl5suzZocnFZZwAx4t6faw=s40-c)

### Justin Lulejian

unread,

Nov 10, 2025, 2:06:25 PM11/10/25

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

to Chromium Extensions, Juraj M., Max Nikulin, Oliver Dunk

Hi all,

Thank you for all the observations and feedback; it's been very helpful!

@PhistucK: Yes, that was my mistake. Thank you for .catch()-ing that!

@Juraj + Alexander + DreamBuilder Team:  
  
Multiple \`async\` function listeners (as well as synchronous and other asynchronous responses) are supported and they should race to respond to the sender. I responded to [Alexander's bug report](https://crbug.com/458410308), which I believe explains the issue and why you're seeing this behavior. The key thing to keep in mind is that \`async\` functions always return a \`Promise\`, even if one doesn't explicitly return a value (which implicitly resolves the Promise to undefined).

AFAICT we're aligned with the Firefox behavior (minus the undefined -> null conversion that happens), so this is working as intended. I'll be documenting this with a specific example in the messaging docs to make this clearer for other developers. However, if after taking a look at my response in the bug report it seems like I'm misunderstanding the issue, please let me know!

Max is correct that the undefined -> null conversion is related to Chromium's JSON.stringify serialization of the messages. I'm currently [working on finishing up the structured cloning implementation](https://issues.chromium.org/40321352). Once that's done, \`undefined\` will be sent back to the message sender unmodified. It should also support Blobs, so I'm glad to hear that will be helpful.



![Max Nikulin's profile photo](//lh3.googleusercontent.com/a-/ALV-UjWwxCyS1FvvXSl_DKO-XejSjSIuNLO3jkEogbqxunAnddy3eMl1=s40-c)

### Max Nikulin

unread,

Nov 11, 2025, 7:53:59 AM11/11/25

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

to chromium-...@chromium.org

On 11/11/2025 05:06, Justin Lulejian wrote:  
\> Multiple \`async\` function listeners (as well as synchronous and other  
\> asynchronous responses) are supported and they should race to respond to  
\> the sender. I responded to Alexander's bug report  

\> <[https://crbug.com/458410308](https://crbug.com/458410308)\>,> which I believe explains the issue and why you're  

\> seeing this behavior. The key thing to keep in mind is that \`async\`  
\> functions always return a \`Promise\`, even if one doesn't explicitly  
\> return a value (which implicitly resolves the Promise to undefined).  
  

For the provided example your comment explains behavior. On the other hand  
  
chrome.runtime.onMessage.addListener(async (message) => {  
await new Promise(resolve => {  
setTimeout(resolve);  
});  
});  
  
looks a bit strange for me. Listener body is close to no-op. I would  
expect either non-zero argument of \`setTimeout\` or, perhaps, even  
\`return\` before \`await\`.  
  
I have not had a look into commits. I hope, you added tests that race  
between returned promise and \`true\` + \`sendSesponse\` is fair, so both  
competitors may win depending on relative delay in listeners. Reading  
Alexander's message I expected that this scenario is broken without any  
relation to \`undefined\` as return value of \`async\` listener.  

  
\> Max is correct that the undefined -> null conversion is related  
\> to Chromium's JSON.stringify serialization of the messages. I'm  
\> currently working on finishing up the structured cloning implementation  

\> <[https://issues.chromium.org/40321352](https://issues.chromium.org/40321352)\>. Once that's done, \`undefined\`  

\> will be sent back to the message sender unmodified. It should also  
\> support Blobs, so I'm glad to hear that will be helpful.  
  

It is great. My primary interest is propagation of exceptions from  
content scripts to scripting \`InjectionResult\` \`error\` field. My  
understanding is that structured clone is the key point.  
  
<[https://issues.chromium.org/40205757](https://issues.chromium.org/40205757)\>/<[https://crbug.com/1271527](https://crbug.com/1271527)\>  
"Propagate errors from scripting.executeScript to InjectionResult"  

  
\> On Monday, November 10, 2025 at 12:54:40 PM UTC-5 Juraj M. wrote:  
\> My examples with the switch case is a simplified real world example  
\> - something I use in all of my extensions in multiple files.  
\> I have many handlers, and each is handling a specific set of messages.  
\> But if I made them all async, then the first handler would still  
\> consume all messages, because it would reply with "undefined" when  
\> it didn't handled the message.  
  

My guess is that simple race allows to implement last resort timeout for  
the case when actual listener hangs for some reason  
  
browser.runtime.onMessage.addListener(  
async () => new Promise((\_resolve, reject) =>  
setTimeout(() => reject(new Error("Timeout")))));  
  
I suspect, it was just low hanging fruit to implement. In real life  
cases you anyway wish to create an \`AbortController\` and to pass its  
signal as a part of context to listener. It should allow to abandon  
further async steps when early ones take too much time. So usefulness of  
race between handlers is limited.  
  
If you need conditional dispatching and multiple async listeners then  
you may write a wrapper to ignore some value returned from async  
function. I would consider some \`Symbol("NotMine")\` however instead of  
\`undefined\` to notify dispatcher that specific listener is not going to  
handle the message. Then promises resolved to \`undefined\` may be treated  
as programming errors and reported as warnings. I do not think, this  
kind of logic should be a part of extensions API.  
  

![Max Nikulin's profile photo](//lh3.googleusercontent.com/a-/ALV-UjWwxCyS1FvvXSl_DKO-XejSjSIuNLO3jkEogbqxunAnddy3eMl1=s40-c)

### Max Nikulin

unread,

Nov 11, 2025, 8:02:18 AM11/11/25

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

to chromium-...@chromium.org

On 11/11/2025 05:06, Justin Lulejian wrote:  

\> @PhistucK: Yes, that was my mistake. Thank you for .catch()-ing that!  
  

I decided, that \`reject\` was result of using LLM without careful  
proof-reading.  
  
Perhaps, I missed something, but the following in the original message  
looks like confusion of return argument of \`onMessage\` handler and the  
value returned from \`sendMessage\`:  

  
\> // content\_script.js  
\> let response = await chrome.runtime.sendMessage('test');  
\> console.assert(response === true); // MDN  
\> console.assert(response === null); // Chromium  
  

At least Firefox does not return true as promise value for async  
handlers without explicit \`return\`.  

![Juraj M.'s profile photo](//lh3.googleusercontent.com/a-/ALV-UjXKHuWEKU4q8ActChuM5deyPeltTU3ZdWm5Mn2Y0zBAbcSb5Cz6=s40-c)

### Juraj M.

unread,

Nov 11, 2025, 11:37:30 PM11/11/25

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

to Chromium Extensions, Max Nikulin

@Justin, yes the behavior is nicely aligned with Firefox / webextension-polyfill, and all of my extensions seems to work fine.

And I'm super happy to hear that Blob sending coming too! This will be a good time to finally ditch Chrome 109 support and finally clean-up my codebase. Thanks a lot!

  

But there is one more thing... and it's about that bug: [https://issues.chromium.org/issues/458410308](https://issues.chromium.org/issues/458410308)

I thought the new "reply with Promise" behavior will be activated only for people using the "browser" namespace - to avoid breaking existing extensions that uses async handlers.

I'm not affected by this but I can imagine a lot of extensions will be.



![Justin Lulejian's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUv8JV94G-QChFsYOz_DOWfSUOmHl5suzZocnFZZwAx4t6faw=s40-c)

### Justin Lulejian

unread,

Nov 12, 2025, 12:32:36 PM11/12/25

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

to Chromium Extensions, Juraj M., Max Nikulin

@Juraj:  
  
Thank you for confirming the behavior alignment, I appreciate it!  
  
Regarding the browser namespace restriction you [mentioned](https://g-issues.chromium.org/issues/40753031#comment31), supporting two distinct messaging behaviors unfortunately wasn't feasible at this time.  
  
@Max:  
  
IIUC your comment on returned promise + sendResponse/return true correctly,  you can see our end-to-end test cases [here](https://crsrc.org/c/extensions/test/data/api_test/messaging/) (each folder is a test extension). I think the testing you might be thinking of would be in the "on\_message\_return\_.\*\_then\_.\*" folders. Our tests confirm they race correctly, but please let me know if I'm misunderstanding or if you see an edge case we've missed.



![Max Nikulin's profile photo](//lh3.googleusercontent.com/a-/ALV-UjWwxCyS1FvvXSl_DKO-XejSjSIuNLO3jkEogbqxunAnddy3eMl1=s40-c)

### Max Nikulin

unread,

Nov 14, 2025, 8:09:52 AM11/14/25

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

to chromium-...@chromium.org

On 13/11/2025 03:32, Justin Lulejian wrote:  
\> Regarding the browser namespace restriction you mentioned  

\> <[https://issues.chromium.org/issues/40753031#comment31](https://issues.chromium.org/issues/40753031#comment31)\>,  

\> supporting two distinct  
\> messaging behaviors unfortunately wasn't feasible at this time.  
  

Firefox have to maintain distinct API objects for better compatibility  
with Chrome.  

  
\> IIUC your comment on returned promise + sendResponse/return true  
\> correctly,  you can see our end-to-end test cases here  

\> <[https://crsrc.org/c/extensions/test/data/api\_test/messaging/](https://crsrc.org/c/extensions/test/data/api_test/messaging/)\>  

\> (each folder is a  
\> test extension). I think the testing you might be thinking of would be  
\> in the "on\_message\_return\_.\*\_then\_.\*" folders.  
  

Thant you for the link. \`on\_message\_return\_true\_then\_promise\` and its  
counterparts cover cases I had in mind.  

  
\> On Wednesday, November 12, 2025 at 2:37:30 AM UTC-5 Juraj M. wrote:  
\> I thought the new "reply with Promise" behavior will be activated  
\> only for people using the "browser" namespace - to avoid breaking  
\> existing extensions that uses async handlers.  
\> I'm not affected by this but I can imagine a lot of extensions will be.  
  

<[https://github.com/darkreader/darkreader/commit/54f02c470d](https://github.com/darkreader/darkreader/commit/54f02c470d)\>  
"Make document message listener sync function"  
  
At first I did not realize why Dark reader was mentioned in the bug report.  

![Justin Lulejian's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUv8JV94G-QChFsYOz_DOWfSUOmHl5suzZocnFZZwAx4t6faw=s40-c)

### Justin Lulejian

unread,

Jan 6, 2026, 2:54:06 PMJan 6

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

to Chromium Extensions, Max Nikulin

This change was also meant to implicitly apply to runtime.onMessageExternal as well, but a bug caused that to not happen. It has been fixed and will reach stable with version 145 (which should reach stable around Feb 10, 2026).



![Justin Lulejian's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUv8JV94G-QChFsYOz_DOWfSUOmHl5suzZocnFZZwAx4t6faw=s40-c)

### Justin Lulejian

unread,

Jan 19, 2026, 8:46:59 AMJan 19

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

to Chromium Extensions, Justin Lulejian, Max Nikulin

Hi everyone,  
  
Just a quick update that we are holding off on the \`browser\` namespace and messaging API changes.  
  
We discovered late in the release process that the namespace change missed \`devtools\` APIs, and the Promise support and webextension-polyfill alignment were causing some issues that we’d like to address.  
  
**We have reverted these changes on all channels and versions.  
**  
If users are on version 144 and 145, they may still see these features active. They can restart their browser to pick up the configuration change; this will disable the features and return the browser to its previous state.  
  
We are aiming to rerelease these changes with 146 (145 is already in beta and we’d like to monitor more to be sure the issues are addressed) but will keep this thread updated if that changes. Thanks for your patience!

  
  
Justin, on behalf of the Chromium Extensions Team



![Jack Lipchik's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUGFneAHHLJ5JSpwRzRtlYZHfB8M0p72ahrUZoSVOKUvVTeJg=s40-c)

### Jack Lipchik

unread,

Jan 19, 2026, 9:38:06 AMJan 19

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

to Chromium Extensions, Justin Lulejian, Max Nikulin

Howdy,  
  
What is the recommended way to detect if these changes to the available namespace and Messaging API are in place or not in the currently installed and running version of Chrome?  
  
On 1/16/26, we distributed a patch that checks if the currently installed and running version of Chrome is "lower than 144" to determine if message handlers in a configured runtime.onMessage.addListener should return a promise or not. The rollback called out here in this PSA update, breaks that logic and results in our extensions being plagued by message handling crossed wires again.  
  
We want to push out a version agnostic patch so that browsers running with the pre-Promise Messaging API implementation continue to function when Chrome releases the patched version where Promises can be returned from message handlers as a response to an incoming message.  
  
Internally, we have discussed using the presence of the "browser" namespace to determine what response handling logic should execute instead of a version specific solution that has proven faulty. As we dont know when Chrome is going to truly roll out this new method of returning Promises from message handlers fully, we want to be sure our patch holds.  
  
Any and all guidance is greatly appreciated.  
  
Best,

  

Jack  
  



![Oliver Dunk's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUzUEflsvjipGd7cvZEsFUHskmlfPymb4qDCb2t3fhdt4oaM5iB=s40-c)

### Oliver Dunk

unread,

Jan 19, 2026, 9:46:11 AMJan 19

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

to Jack Lipchik, Chromium Extensions, Justin Lulejian, Max Nikulin

Hi Jack,

  

If you want to maximise compatibility, I would always use the callback based \`sendResponse()\` function for now. As much as we want developers to be able to adopt this change, that is definitely the most widely supported approach.

  

Checking for the \`browser\` global is probably the next best option. Technically, the browser namespace and messaging changes are two separate features. However, we intend to roll them out together and never enable one without the other.

  

I do want to apologise for the churn here. We really didn't intend to need to revert this but it seemed like the best option given breakage to existing extensions.

Oliver Dunk | DevRel, Chrome Extensions | [https://developer.chrome.com/](https://developer.chrome.com/) | London, GB

  

  





> \--  

> You received this message because you are subscribed to the Google Groups "Chromium Extensions" group.  
> To unsubscribe from this group and stop receiving emails from it, send an email to chromium-extens...@chromium.org.  

> To view this discussion visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/6835bba6-9061-43a8-b2fc-05fb763b2b92n%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/6835bba6-9061-43a8-b2fc-05fb763b2b92n%40chromium.org?utm_medium=email&utm_source=footer).  

![Justin Lulejian's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUv8JV94G-QChFsYOz_DOWfSUOmHl5suzZocnFZZwAx4t6faw=s40-c)

### Justin Lulejian

unread,

Feb 19, 2026, 1:52:22 PMFeb 19

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

to Chromium Extensions, Oliver Dunk, Chromium Extensions, Justin Lulejian, Max Nikulin, Jack Lipchik

Hi everyone,

The browser namespace and messaging API changes have begun a gradual re-release. This change has reached Chrome 146 (and newer versions) in the Canary and Dev channels, and will be in Beta very soon.

Please note that these are only enabled for a subset of users within those channels to help us catch potential issues early. This means users on version 146 may or may not have the features enabled, which could result in different behavior for your extension. You can detect if these changes are effective by checking if \`browser\` is already defined in the script context when your scripts start running.

To avoid relying on the new promise return behavior and maintain consistent asynchronous responses, developers can use return true; and respond asynchronously, instead of returning a Promise. Note that while this workaround addresses the promise return support change, all other changes in this re-release (such as the browser namespace introduction and listeners throwing errors behavior) are mandatory.

An exception is a temporary automatic opt-out for all these changes for extensions that utilize the DevTools API (specifically, those with a ["devtools\_page" manifest key defined](https://developer.chrome.com/docs/extensions/reference/manifest#:~:text=see%20Internationalization.-,%22devtools_page%22,-Defines%20pages%20that)). Our initial release identified a reliance on promise support provided by [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) from extension APIs within the DevTools API context. In particular, the polyfill does not run when \`browser\` is defined but we do not yet support promises for this API. Therefore, this re-release is temporarily configured not to affect any extension's script context if that associated extension defines the [devtools\_page](https://developer.chrome.com/docs/extensions/reference/manifest#:~:text=see%20Internationalization.-,%22devtools_page%22,-Defines%20pages%20that) manifest key.

Thanks again for your patience.

Justin, on behalf of the Chromium Extensions Team





> > To unsubscribe from this group and stop receiving emails from it, send an email to chromium-extensions+unsub...@chromium.org.



![Dave Vandyke's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUk9ORhuDUW86HiDq1Z5kLkojWSs9GXb-RhTZxlczZi6X8vdbE=s40-c)

### Dave Vandyke

unread,

Feb 23, 2026, 3:16:07 AMFeb 23

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

to Chromium Extensions, Justin Lulejian, Oliver Dunk, Chromium Extensions, Max Nikulin, Jack Lipchik

Hey Justin, I would like to test the extension I work on against these latest changes. How can I do that, is there a way to force myself into the correct cohort/group for the gradual rollout? Thanks, Dave









> > > To unsubscribe from this group and stop receiving emails from it, send an email to chromium-extensions+unsubscribe...@chromium.org.



![Justin Lulejian's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUv8JV94G-QChFsYOz_DOWfSUOmHl5suzZocnFZZwAx4t6faw=s40-c)

### Justin Lulejian

unread,

Feb 23, 2026, 9:19:09 AMFeb 23

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

to Chromium Extensions, Dave Vandyke, Justin Lulejian, Oliver Dunk, Chromium Extensions, Max Nikulin, Jack Lipchik

Hi Dave!   
  
To test out the changes, launch chrome (146.0.7671.0 and newer) with the feature flag enabled like so:  
  
\`/path/to/chrome --enable-features=ExtensionBrowserNamespaceAndPolyfillSupport\`  
  
That should force it on and allow for testing.



![woxxom's profile photo](//lh3.googleusercontent.com/a-/ALV-UjX4hF_IK5jhOzipxM-zPHfxUcqF61e2IbXJZW-yVpKo17jLulo=s40-c)

### woxxom

unread,

Feb 23, 2026, 11:18:59 PMFeb 23

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

to Chromium Extensions, Justin Lulejian, Dave Vandyke, Oliver Dunk, Chromium Extensions, Max Nikulin, Jack Lipchik

\> You can detect if these changes are effective by checking if \`browser\` is already defined in the script context when your scripts start running

  

There's a caveat: <html id=browser> in the page will create a global \`browser\` variable for this DOM element, which might easily happen in a random webpage, so the correct method would be to check for window.browser?.runtime?.sendMessage or ({}).toString.call(window.browser) === '\[object Object\]'



Message has been deleted

![Dave Vandyke's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUkEYQMOF9MX5uKvJbsEVc9LY3vIpv_w0T_pJP-2YkMLPWD7QPE=s40-c)

### Dave Vandyke

unread,

Feb 24, 2026, 9:09:58 AMFeb 24

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

to Chromium Extensions, Justin Lulejian, Dave Vandyke, Oliver Dunk, Chromium Extensions, Max Nikulin, Jack Lipchik

Thanks Justin, \`--enable-features=ExtensionBrowserNamespaceAndPolyfillSupport\` worked for me and I was able to do some testing this morning 👍.

  

Cheers, Dave



![Don Schmitt's profile photo](//lh3.googleusercontent.com/a-/ALV-UjWFI7h8ylWzGGtS3-bUeWM9r2ITYjrkJ5CLsNR0iCORgz_FEhzWdw=s40-c)

### Don Schmitt

unread,

Mar 2, 2026, 8:02:58 AMMar 2

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

to Justin Lulejian, Chromium Extensions, Max Nikulin

We have had a significant number of customers report a regression in Chrome 145 that appears to be resolved in the Chrome 146 beta. We are working to reproduce the issue, but it seems highly likely that it was caused by this change.  
  
To be clear, as someone pointed out earlier, will these changes apply only to the browser namespace? Making changes of this nature to the current API, which is already in use, would surely cause regressions across a wide range of extensions.  
  
Best regards,  
\--  
Don Schmitt

  

  

  





> \--  

> You received this message because you are subscribed to the Google Groups "Chromium Extensions" group.  

> To unsubscribe from this group and stop receiving emails from it, send an email to chromium-extens...@chromium.org.  
> To view this discussion visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/58931005-72d7-427a-aaf7-afb78a98a27dn%40chromium.org](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/58931005-72d7-427a-aaf7-afb78a98a27dn%40chromium.org?utm_medium=email&utm_source=footer).  

![Oliver Dunk's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUzUEflsvjipGd7cvZEsFUHskmlfPymb4qDCb2t3fhdt4oaM5iB=s40-c)

### Oliver Dunk

unread,

Mar 2, 2026, 8:09:59 AMMar 2

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

to Don Schmitt, Justin Lulejian, Chromium Extensions, Max Nikulin

Hi Don,

  

This change applies to both the \`chrome\` and \`browser\` namespaces.

  

In most cases, we don't expect that to be a problem:

-   If you were previously using \`chrome\` and using \`sendResponse\`, that will continue to work.
-   If you were using webextension-polyfill and \`browser\` and returning a promise, the polyfill will become a noop when \`browser\` is available, but this will continue to work as we now support promises.

The only case where this could cause issues is if you were using \`chrome\`, relying on \`sendResponse\`, but **_also_** returning a promise from the same message handler. For example:

  

\`\`\`

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

    setTimeout(() => sendResponse("foo"), 1000);

    return Promise.resolve("bar");

});

\`\`\`

  

The promise may now win and your \`sendResponse\` call will not work.

  

Chrome 146 (for some users) contains this change whereas Chrome 145 does not, so it doesn't make sense that the behavior would be improved in the new version.

  

If you're able to figure out more details about what is going on I'd love to know.

Oliver Dunk | DevRel, Chrome Extensions | [https://developer.chrome.com/](https://developer.chrome.com/) | London, GB

  





> To view this discussion visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CAM7AMpKVSkanxB\_b1kPSZyN6DHq\_HTd885icgPFvjp8pBp7w4A%40mail.gmail.com](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CAM7AMpKVSkanxB_b1kPSZyN6DHq_HTd885icgPFvjp8pBp7w4A%40mail.gmail.com?utm_medium=email&utm_source=footer).  

![Oliver Dunk's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUzUEflsvjipGd7cvZEsFUHskmlfPymb4qDCb2t3fhdt4oaM5iB=s40-c)

### Oliver Dunk

unread,

Mar 2, 2026, 8:40:38 AMMar 2

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

to Don Schmitt, Don Schmitt, Justin Lulejian, Chromium Extensions, Max Nikulin

The change is already live in Chrome 146 Canary and Dev. We are in the process of slowly rolling it out to more users on Chrome 146 in the beta and eventually stable channels.

Oliver Dunk | DevRel, Chrome Extensions | [https://developer.chrome.com/](https://developer.chrome.com/) | London, GB

  

  

On Mon, Mar 2, 2026 at 4:38 PM Don Schmitt <do...@blackfishsoftware.com\> wrote:  

> Okay, thanks much for the prompt reply. We are not using sendResponse or the polyfill. I'm actually not sure if these customers were on Chrome 144 or 145, but moving to Chrome 146 fixed the regression for all of them. So...this change seems the most likely cause for the regression.
> 
>   
> 
> We will continue to try to reproduce the problem. When do you expect to try pushing this change again?
> 
>   
> 
>   
> 
>   
> 
>   





> > To view this discussion visit [https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CAOsQqBmoBEUppX1L2grpRZwPTDypU\_JO8nXoJ7xC8wnJrGyn3Q%40mail.gmail.com](https://groups.google.com/a/chromium.org/d/msgid/chromium-extensions/CAOsQqBmoBEUppX1L2grpRZwPTDypU_JO8nXoJ7xC8wnJrGyn3Q%40mail.gmail.com?utm_medium=email&utm_source=footer).  

![Juraj M.'s profile photo](//lh3.googleusercontent.com/a-/ALV-UjXKHuWEKU4q8ActChuM5deyPeltTU3ZdWm5Mn2Y0zBAbcSb5Cz6=s40-c)

### Juraj M.

unread,

Mar 2, 2026, 10:28:20 AMMar 2

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

to Chromium Extensions, Oliver Dunk, Don Schmitt, Justin Lulejian, Chromium Extensions, Max Nikulin, Don Schmitt

I would like to remind one more time :), that \`async\` message handler will always return a Promise.

So if you are using one, it may consume messages meant for other handlers...



![Oliver Dunk's profile photo](//lh3.googleusercontent.com/a-/ALV-UjUzUEflsvjipGd7cvZEsFUHskmlfPymb4qDCb2t3fhdt4oaM5iB=s40-c)

### Oliver Dunk

unread,

Mar 4, 2026, 4:09:58 AMMar 4

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

to Don Schmitt, Don Schmitt, Justin Lulejian, Chromium Extensions, Max Nikulin

It's not live for all users in any channel yet. Definitely use the switch!

Oliver Dunk | DevRel, Chrome Extensions | [https://developer.chrome.com/](https://developer.chrome.com/) | London, GB

  

  

On Mon, Mar 2, 2026 at 4:48 PM Don Schmitt <do...@blackfishsoftware.com\> wrote:  

> Okay, I'll have these customers test it against those versions. Is it live for all users in Canary and Dev or is it enabled for only a percentage, requiring us to use the command-line switch to activate it?



Reply all

Reply to author

Forward



0 new messages


