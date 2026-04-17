---
url: https://palant.info/2025/01/13/chrome-web-store-is-a-mess/
captured_at: '2026-04-16'
capture_method: script
source_type: blog
source_id: palant
title_at_capture: Chrome Web Store is a mess | Almost Secure
author: Wladimir Palant
evidence_class: c
topics:
  - cws-review
  - policy-enforcement
  - moderation
wayback_url: https://web.archive.org/web/20260416224406/https://palant.info/2025/01/13/chrome-web-store-is-a-mess/
related_docs: []
notes: Fill in during curation.
---

# Chrome Web Store is a mess | Almost Secure

## Signal extracted

<!-- Fill in during curation. The one insight this post has that's hard to get elsewhere. -->

---

Let’s make one thing clear first: I’m not singling out Google’s handling of problematic and malicious browser extensions because it is worse than Microsoft’s for example. No, Microsoft is probably even worse but I never bothered finding out. That’s because Microsoft Edge doesn’t matter, its market share is too small. Google Chrome on the other hand is used by around 90% of the users world-wide, and one would expect Google to take their responsibility to protect its users very seriously, right? After all, browser extensions are one selling point of Google Chrome, so certainly Google would make sure they are safe?

![Screenshot of the Chrome download page. A subtitle “Extend your experience” is visible with the text “From shopping and entertainment to productivity, find extensions to improve your experience in the Chrome Web Store.” Next to it a screenshot of the Chrome browser and some symbols on top of it representing various extensions.](https://palant.info/2025/01/13/chrome-web-store-is-a-mess/chrome_website.png)

Unfortunately, my experience reporting numerous malicious or otherwise problematic browser extensions speaks otherwise. Google appears to take the “least effort required” approach towards moderating Chrome Web Store. Their attempts to automate all things moderation do little to deter malicious actors, all while creating considerable issues for authors of legitimate add-ons. Even when reports reach Google’s human moderation team, the actions taken are inconsistent, and Google generally shies away from taking decisive actions against established businesses.

As a result, for a decade my recommendation for Chrome users has been to stay away from Chrome Web Store if possible. Whenever extensions are absolutely necessary, it should be known who is developing them, why, and how the development is being funded. Just installing some extension from Chrome Web Store, including those recommended by Google or “featured,” is very likely to result in your browsing data being sold or worse.

Google employees will certainly disagree with me. Sadly, much of it is organizational blindness. I am certain that you meant it well and that you did many innovative things to make it work. But looking at it from the outside, it’s the result that matters. And for the end users the result is a huge (and rather dangerous) mess.

#### Contents

-   [Some recent examples](#some-recent-examples)
-   [The reporting process](#the-reporting-process)
-   [Chrome Web Store and their spam issue](#chrome-web-store-and-their-spam-issue)
-   [Can extension reviews be trusted?](#can-extension-reviews-be-trusted)
-   [The “featured” extensions](#the-featured-extensions)
-   [How did Google get into this mess?](#how-did-google-get-into-this-mess)
-   [What could Google do?](#what-could-google-do)

## [](#some-recent-examples)Some recent examples

Five years ago I discovered that Avast browser extensions were spying on their users. Mozilla and Opera disabled the extension listings immediately after I reported it to them. Google on the other hand took two weeks where they supposedly discussed their policies internally. The result of that discussion was eventually [their “no surprises” policy](https://developer.chrome.com/docs/webstore/program-policies):

> Building and maintaining user trust in the Chrome Web Store is paramount, which means we set a high bar for developer transparency. All functionalities of extensions should be clearly disclosed to the user, with no surprises. This means we will remove extensions which appear to deceive or mislead users, enable dishonest behavior, or utilize clickbaity functionality to artificially grow their distribution.

So when dishonest behavior from extensions is reported today, Google should act immediately and decisively, right? Let’s take a look at two examples that came up in the past few months.

In October I [wrote about the refoorest extension deceiving its users](https://palant.info/2024/10/01/lies-damned-lies-and-impact-hero-refoorest-allcolibri/). I could conclusively prove that Colibri Hero, the company behind refoorest, deceives their users on the number of trees they supposedly plant, incentivizing users into installing with empty promises. In fact, there is strong indication that the company never even donated for planting trees beyond a rather modest one-time donation.

Google got my report and dealt with it. What kind of action did they take? That’s a very good question that Google won’t answer. But refoorest is still available from Chrome Web Store, it is still “featured” and it still advertises the very same completely made up numbers of trees they supposedly planted. Google even advertises for the extension, listing it in the “Editors’ Picks extensions” collection, probably the reason why it gained some users since my report. So much about being honest. For comparison: refoorest used to be available from Firefox Add-ons as well but was already removed when I started my investigation. Opera removed the extension from their add-on store within hours of my report.

But maybe that issue wasn’t serious enough? After all, there is no harm done to users if the company is simply pocketing the money they claim to spend on a good cause. So also in October I [wrote about the Karma extension spying on users](https://palant.info/2024/10/30/the-karma-connection-in-chrome-web-store/). Users are not being notified about their browsing data being collected and sold, except for a note buried in their privacy policy. Certainly, that’s identical to the Avast case mentioned before and the extension needs to be taken down to protect users?

![Screenshot of a query string parameters listing. The values listed include current\_url (a Yahoo address with an email address in the query string), tab\_id, user\_id, distinct\_id, local\_time.](https://palant.info/2025/01/13/chrome-web-store-is-a-mess/spying.png)

Again, Google got my report and dealt with it. And again I fail to see any result of their action. The Karma extension remains available on Chrome Web Store unchanged, it will still notify their server about every web page you visit (see screenshot above). The users still aren’t informed about this. Yet their Chrome Web Store page continues to claim “This developer declares that your data is not being sold to third parties, outside of the approved use cases,” a statement contradicted by their privacy policy. The extension appears to have lost its “Featured” badge at some point but now it is back.

_Note_: Of course Karma isn’t the only data broker that Google tolerates in Chrome Web Store. I published a guest article today by a researcher who didn’t want to disclose their identity, [explaining their experience with BIScience Ltd., a company misleading millions of extension users to collect and sell their browsing data](https://palant.info/2025/01/13/biscience-collecting-browsing-history-under-false-pretenses/). This post also explains how Google’s “approved use cases” effectively allow pretty much any abuse of users’ data.

Mind you, neither refoorest nor Karma were alone but rather recruited or bought other browser extensions as well. These other browser extensions were turned outright malicious, with stealth functionality to perform [affiliate fraud](https://www.investopedia.com/terms/a/affiliate-fraud.asp) and/or collect users’ browsing history. Google’s reaction was very inconsistent here. While most extensions affiliated with Karma were removed from Chrome Web Store, the extension with the highest user numbers (and performing affiliate fraud without telling their users) was allowed to remain for some reason.

With refoorest, most affiliate extensions were removed or stopped using their Impact Hero SDK. Yet when I checked more than two months after my report two extensions from my original list still appeared to include that hidden affiliate fraud functionality and I found seven new ones that Google apparently didn’t notice.

## [](#the-reporting-process)The reporting process

Now you may be wondering: if I reported these issues, why do I have to guess what Google did in response to my reports? Actually, keeping me in the dark is Google’s official policy:

![Screenshot of an email: Hello Developer, Thank you again for reporting these items. Our team is looking into the items  and will take action accordingly. Please refer to the  possible enforcement (hyperlinked) actions and note that we are unable to comment on the status of individual items. Thank you for your contributions to the extensions ecosystem. Sincerely, Chrome Web Store Developer Support](https://palant.info/2025/01/13/chrome-web-store-is-a-mess/policy.png)

This is by the way the response I received in November after pointing out the inconsistent treatment of the extensions. A month later the state of affairs was still that some malicious extensions got removed while other extensions with identical functionality were available for users to install, and I have no idea why that is. I’ve heard before that Google employees aren’t allowed to discuss enforcement actions, and your guess is as good as mine as to whom this policy is supposed to protect.

Supposedly, the idea of not commenting on policy enforcement actions is hiding the internal decision making from bad actors, so that they don’t know how to game the process. If that’s the theory however, it isn’t working. In this particular case the bad actors got some feedback, be it through their extensions being removed or due to the adjustments demanded by Google. It’s only me, the reporter of these issues, who needs to be guessing.

But, and this is a positive development, I’ve received a confirmation that both these reports are being worked on. This is more than I usually get from Google which is: silence. And typically also no visible reaction either, at least until a report starts circulating in media publications forcing Google to act on it.

But let’s take a step back and ask ourselves: how does one report Chrome Web Store policy violations? Given how much Google emphasizes their policies, there should be an obvious way?

In fact, there is a [support document](https://support.google.com/chrome_webstore/answer/7508032?hl=en) on reporting issues. And when I started asking around, even Google employees would direct me to it.

> If you find something in the Chrome Web Store that violates the Chrome Web Store Terms of Service, or trademark or copyright infringement, let us know.

Sounds good, right? Except that the first option says:

> At the bottom left of the window, click Flag Issue.

Ok, that’s clearly the _old_ Chrome Web Store. But we understand of course that they mean the “Flag concern” link which is nowhere near the bottom. And it gives us the following selection:

![Screenshot of a web form offering a choice from the following options: Did not like the content, Not trustworthy, Not what I was looking for, Felt hostile, Content was disturbing, Felt suspicious](https://palant.info/2025/01/13/chrome-web-store-is-a-mess/flagging.png)

This doesn’t really seem like the place to report policy violations. Even “Felt suspicious” isn’t right for an issue you can prove. And, unsurprisingly, after choosing this option Google just responds with:

> Your abuse report has been submitted successfully.

No way to provide any details. No asking for my contact details in case they have questions. No context whatsoever, merely “felt suspicious.” This is probably fed to some algorithm somewhere which might result in… what actually? Judging by malicious extensions where users have been vocally complaining, often for years: nothing whatsoever. This isn’t the way.

Well, there is another option listed in the document:

> If you think an item in the Chrome Web Store violates a copyright or trademark, fill out this form.

Yes, Google seems to care about copyright and trademark violations, but a policy violation isn’t that. If we try the form nevertheless it gives us a promising selection:

![Screenshot of a web form titled “Select the reason you wish to report content.” The available options are: Policy (Non-legal) Reasons to Report Content, Legal Reasons to Report Content](https://palant.info/2025/01/13/chrome-web-store-is-a-mess/report_form.png)

Finally! Yes, policy reasons are exactly what we are after, let’s click that. And there comes another choice:

![Screenshot of a web form titled “Select the reason you wish to report content.” The only available option is: Child sexual abuse material](https://palant.info/2025/01/13/chrome-web-store-is-a-mess/report_form2.png)

That’s really the only option offered. And I have questions. At the very least those are: in what jurisdiction is child sexual abuse material a non-legal reason to report content? And: since when is that the only policy that Chrome Web Store has?

We can go back and try “Legal Reasons to Report Content” of course but the options available are really legal issues: intellectual properties, court orders or violations of hate speech law. This is another dead end.

It took me a lot of asking around to learn that the real (and well-hidden) way to report Chrome Web Store policy violations is [Chrome Web Store One Stop Support](https://support.google.com/chrome_webstore/contact/one_stop_support?hl=en). I mean: I get it that Google must be getting lots of non-sense reports. And they probably want to limit that flood somehow. But making legitimate reports almost impossible can’t really be the way.

In 2019 Google launched the Developer Data Protection Reward Program (DDPRP) meant to address privacy violations in Chrome extensions. Its participation conditions were rather narrow for my taste, pretty much no issue would qualify for the program. But at least it was a reliable way to report issues which might even get forwarded internally. Unfortunately, Google discontinued this program in August 2024.

It’s not that I am very convinced of DDPRP’s performance. I’ve used that program twice. First time I reported [Keepa’s data exfiltration](https://palant.info/2021/08/02/data-exfiltration-in-keepa-price-tracker/). DDPRP paid me an award for the report but, from what I could tell, allowed the extension to continue unchanged. The second report was about the [malicious PDF Toolbox extension](https://palant.info/2023/05/16/malicious-code-in-pdf-toolbox-extension/). The report was deemed out of scope for the program but forwarded internally. The extension was then removed quickly, but that might have been due to the media coverage. The benefit of the program was really: it was a documented way of reaching a human being at Google that would look at a problematic extension.

## [](#chrome-web-store-and-their-spam-issue)Chrome Web Store and their spam issue

In theory, there should be no spam on Chrome Web Store. [The policy](https://developer.chrome.com/docs/webstore/program-policies/spam-and-abuse) is quite clear on that:

> We don’t allow any developer, related developer accounts, or their affiliates to submit multiple extensions that provide duplicate experiences or functionality on the Chrome Web Store.

Unfortunately, this policy’s enforcement is lax at best. Back in June 2023 I wrote about a [malicious cluster of Chrome extensions](https://palant.info/2023/06/08/another-cluster-of-potentially-malicious-chrome-extensions/). I listed 108 extensions belonging to this cluster, pointing out their spamming in particular:

> Well, 13 almost identical video downloaders, 9 almost identical volume boosters, 9 almost identical translation extensions, 5 almost identical screen recorders are definitely not providing value.

I’ve also documented the outright malicious extensions in this cluster, pointing out that other extensions are likely to turn malicious as well once they have sufficient users. And how did Google respond? The malicious extensions have been removed, yes. But other than that, 96 extensions from my original list remained active in January 2025, and there were of course more extensions that my original report didn’t list. For whatever reason, Google chose not to enforce their anti-spam policy against them.

And that’s merely one example. My [most recent blog post](https://palant.info/2025/01/08/how-extensions-trick-cws-search/) documented 920 extensions using tricks to spam Chrome Web Store, most of them belonging to a few large extension clusters. As it turned out, Google was [made aware of this particular trick a year before my blog post](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/JMtfgiagcgY/m/TNMERoXWAwAJ) already. And again, for some reason Google chose not to act.

## [](#can-extension-reviews-be-trusted)Can extension reviews be trusted?

So when you search for extensions in Chrome Web Store, many results will likely come from one of the spam clusters. But the choice to install a particular extension is typically based on reviews. Can at least these reviews be trusted? Concerning moderation of reviews [Google says](https://support.google.com/chrome_webstore/answer/12225786):

> Google doesn’t verify the authenticity of reviews and ratings, but reviews that violate our terms of service will be removed.

And the important part in the terms of service is:

> Your reviews should reflect the experience you’ve had with the content or service you’re reviewing. Do not post fake or inaccurate reviews, the same review multiple times, reviews for the same content from multiple accounts, reviews to mislead other users or manipulate the rating, or reviews on behalf of others. Do not misrepresent your identity or your affiliation to the content you’re reviewing.

Now you may be wondering how well these rules are being enforced. The obviously [fake review on the Karma extension](https://palant.info/2024/10/30/the-karma-connection-in-chrome-web-store/#who-is-behind-this) is still there, three months after being posted. Not that it matters, with their continuous stream of incoming five star reviews.

A month ago I reported an extension to Google that, despite having merely 10,000 users, received 19 five star reviews on a single day in September – and only a single (negative) review since then. I pointed out that it is a consistent pattern across all extensions of this account, e.g. another extension (merely 30 users) received 9 five star reviews on the same day. It really doesn’t get any more obvious than that. Yet all these reviews are still online.

![Screenshot of seven reviews, all giving five stars and all from September 19, 2024. Top review is by Sophia Franklin saying “solved all my proxy switching issues. fast reliable and free.” Next review is by Robert Antony saying “very  user-friendly and efficient for managing proxy profiles.” The other reviews all continue along the same lines.](https://palant.info/2025/01/13/chrome-web-store-is-a-mess/reviews.png)

And it isn’t only fake reviews. [The refoorest extension incentivizes reviews](https://palant.info/2024/10/01/lies-damned-lies-and-impact-hero-refoorest-allcolibri/#and-what-about-refoorest) which violates Google’s [anti-spam policy](https://developer.chrome.com/docs/webstore/program-policies/spam-and-abuse) (emphasis mine):

> Developers must not attempt to manipulate the placement of any extensions in the Chrome Web Store. This includes, but is not limited to, inflating product ratings, reviews, or install counts by illegitimate means, such as fraudulent or **incentivized downloads, reviews and ratings**.

It has been three months, and they are still allowed to continue. The extension gets a massive amount of overwhelmingly positive reviews, users get their fake trees, everybody is happy. Well, other than the people trying to make sense of these meaningless reviews.

With reviews being so easy to game, it looks like lots of extensions are doing it. Sometimes it shows as a clearly inflated review count, sometimes it’s the overwhelmingly positive or meaningless content. At this point, any user ratings with the average above 4 stars likely have been messed with.

## [](#the-featured-extensions)The “featured” extensions

But at least the “Featured” badge is meaningful, right? It certainly sounds like somebody at Google reviewed the extension and considered it worthy of carrying the badge. At least [Google’s announcement](https://blog.google/products/chrome/find-great-extensions-new-chrome-web-store-badges/) indeed suggests a manual review:

> Chrome team members manually evaluate each extension before it receives the badge, paying special attention to the following:
> 
> 1.  Adherence to Chrome Web Store’s best practices guidelines, including providing an enjoyable and intuitive experience, using the latest platform APIs and respecting the privacy of end-users.
> 2.  A store listing page that is clear and helpful for users, with quality images and a detailed description.

Yet looking through [920 spammy extensions I reported recently](https://palant.info/2025/01/08/how-extensions-trick-cws-search/#the-extensions-in-question), most of them carry the “Featured” badge. Yes, even the endless copies of video downloaders, volume boosters, AI assistants, translators and such. If there is an actual manual review of these extensions as Google claims, it cannot really be thorough.

To provide a more tangible example, Chrome Web Store currently has Blaze VPN, Safum VPN and Snap VPN extensions carry the “Featured” badge. These extensions (along with Ishaan VPN which has barely any users) belong to the PDF Toolbox cluster which produced malicious extensions in the past. A cursory code inspection reveals that all four are identical and in fact clones of Nucleus VPN which was removed from Chrome Web Store in 2021. And they also don’t even work, no connections succeed. The extension not working is something users of Nucleus VPN complained about already, a fact that the extension compensated with fake reviews.

So it looks like the main criteria for awarding the “Featured” badge are the things which can be easily verified automatically: user count, Manifest V3, claims to respect privacy (not even the privacy policy, merely that the right checkbox was checked), a Chrome Web Store listing with all the necessary promotional images. Given how many such extensions are plainly broken, the requirements on the user interface and generally extension quality don’t seem to be too high. And providing unique functionality definitely isn’t on the list of criteria.

In other words: if you are a Chrome user, the “Featured” badge is completely meaningless. It is no guarantee that the extension isn’t malicious, not even an indication. In fact, authors of malicious extensions will invest some extra effort to get this badge. That’s because the website algorithm seems to weigh the badge considerably towards the extension’s ranking.

## [](#how-did-google-get-into-this-mess)How did Google get into this mess?

Google Chrome first introduced browser extensions in 2011. At that point the dominant browser extensions ecosystem was Mozilla’s, having been around for 12 years already. Mozilla’s extensions suffered from a number of issues that Chrome developers noticed of course: essentially unrestricted privileges necessitated very thorough reviews before extensions could be published on Mozilla Add-ons website, due to high damage potential of the extensions (both intentional and unintentional). And since these reviews relied largely on volunteers, they often took a long time, with the publication delays being very frustrating to add-on developers.

_Disclaimer_: I was a reviewer on Mozilla Add-ons myself between 2015 and 2017.

Google Chrome was meant to address all these issues. It pioneered sandboxed extensions which allowed limiting extension privileges. And Chrome Web Store focused on automated reviews from the very start, relying on heuristics to detect problematic behavior in extensions, so that manual reviews would only be necessary occasionally and after the extension was already published. Eventually, market pressure forced Mozilla to adopt largely the same approaches.

Google’s over-reliance on automated tools caused issues from the very start, and it certainly didn’t get any better with the increased popularity of the browser. Mozilla accumulated a set of rules to make manual reviews possible, e.g. all code should be contained in the extension, so no downloading of extension code from web servers. Also, reviewers had to be provided with an unobfuscated and unminified version of the source code. Google didn’t consider any of this necessary for their automated review systems. So when automated review failed, manual review was often very hard or even impossible.

It’s only with the introduction of Manifest V3 now that [Chrome finally prohibits remote hosted code](https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code). And it took until 2018 to [prohibit code obfuscation](https://blog.chromium.org/2018/10/trustworthy-chrome-extensions-by-default.html), while Google’s reviewers still have to reverse minification for manual reviews. Mind you, we are talking about policies that were already long established at Mozilla when Google entered the market in 2011.

And extension sandboxing, while without doubt useful, didn’t really solve the issue of malicious extensions. I already [wrote about one issue](https://palant.info/2016/07/02/why-mozilla-shouldn-t-copy-chrome-s-permission-prompt-for-extensions/) back in 2016:

> The problem is: useful extensions will usually request this kind of “give me the keys to the kingdom” permission.

Essentially, this renders permission prompts useless. Users cannot possibly tell whether an extension has valid reasons to request extensive privileges. So legitimate extensions have to constantly deal with users who are confused about why the extension needs to “read and change all your data on all websites.” At the same time, users are trained to accept such prompts without thinking twice.

And then malicious add-ons come along, [requesting extensive privileges under a pretense](https://palant.info/2023/06/14/why-browser-extension-games-need-access-to-all-websites/). Monetization companies put out [guides for extension developers](https://github.com/milesrichardson/testing-extmon/blob/ff4492da1098da0ca2ae1853ae5aebca3659ad28/unpacked/hodiladlefdpcbemnbbcpclbmknkiaem/README.md#requirements-for-integration) on how they can request more privileges for their extensions while fending off complains from users and Google alike. There is a lot of this going on in Chrome Web Store, and Manifest V3 couldn’t change anything about it.

So what we have now is:

1.  Automated review tools that malicious actors willing to invest some effort can work around.
2.  Lots of extensions with the _potential_ for doing considerable damage, yet little way of telling which ones have good reasons for that and which ones abuse their privileges.
3.  Manual reviews being very expensive due to historical decisions.
4.  Massively inflated extension count due to unchecked spam.

Number 3 and 4 in particular seem to further trap Google in the “it needs to be automated” mindset. Yet adding more automated layers isn’t going to solve the issue when there are companies which can put a hundred employees on devising new tricks to avoid triggering detection. Yes, malicious extensions are big business.

## [](#what-could-google-do)What could Google do?

If Google were interested in making Chrome Web Store a safer place, I don’t think there is a way around investing considerable (manual) effort into cleaning up the place. Taking down a single extension won’t really hurt the malicious actors, they have hundreds of other extensions in the pipeline. Tracing the relationships between extensions on the other hand and taking down the entire cluster – that would change things.

As the saying goes, the best time to do this was a decade ago. The second best time is right now, when Chrome Web Store with its somewhat less than 150,000 extensions is certainly large but not yet large enough to make manual investigations impossible. Besides, there is probably little point in investigating abandoned extensions (latest release more than two years ago) which make up almost 60% of Chrome Web Store.

But so far Google’s actions have been entirely reactive, typically limited to extensions which already caused considerable damage. I don’t know whether they actually want to stay on top of this. From the business point of view there is probably little reason for that. After all, Google Chrome no longer has to compete for market share, having essentially won against the competition. Even with Chrome extensions not being usable, Chrome will likely stay the dominant browser.

In fact, Google has significant incentives to keep a particular class of extensions low, so one might even suspect intention behind allowing Chrome Web Store to be [flooded with shady and outright malicious ad blockers](https://palant.info/2023/06/05/introducing-pcvark-and-their-malicious-ad-blockers/#why-are-there-so-many-malicious-ad-blockers).

## Curator notes

<!-- Empty at capture time. -->
