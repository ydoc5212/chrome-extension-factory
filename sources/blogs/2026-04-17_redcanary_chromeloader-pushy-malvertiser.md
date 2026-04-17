---
url: https://redcanary.com/blog/threat-detection/chromeloader/
captured_at: '2026-04-17'
capture_method: script
source_type: blog
source_id: redcanary
title_at_capture: 'ChromeLoader: a pushy malvertiser'
author: Aedan Russell
evidence_class: c
topics:
  - security
  - malicious-extensions
  - malvertising
  - chromeloader
wayback_url: null
related_docs: []
notes: Fill in during curation.
---

# ChromeLoader: a pushy malvertiser

## Signal extracted

<!-- Fill in during curation. The one insight this post has that's hard to get elsewhere. -->

---

[ChromeLoader](https://redcanary.com/threat-detection-report/threats/chromeloader/) is a pervasive and persistent browser hijacker that modifies its victims’ browser settings and redirects user traffic to advertisement websites. This malware is introduced via an ISO file that baits users into executing it by posing as a cracked video game or pirated movie or TV show. It eventually manifests as a browser extension.

Like most suspicious browser extensions, ChromeLoader is a relatively benign threat that hijacks user search queries and redirects traffic to an advertising site. However, ChromeLoader uses [PowerShell](https://redcanary.com/threat-detection-report/techniques/powershell/) to inject itself into the browser and add a malicious extension to it, a technique we don’t see very often (and one that often goes undetected by other security tools). If applied to a higher-impact threat—such as a credential harvester or spyware—this PowerShell behavior could help malware gain an initial foothold and go undetected before performing more overtly malicious activity, like exfiltrating data from a user’s browser sessions.

We first encountered this threat after detecting encoded PowerShell commands referencing a scheduled task called “ChromeLoader”—and only later learned that we were catching ChromeLoader in the middle stage of its deployment.

## A note on existing research

In the process of writing this blog, we found two related articles that warrant a mention—and that are definitely worth reading:

**Choziosi Loader:** The folks at G-Data wrote a [great article](https://www.gdatasoftware.com/blog/2022/01/37236-qr-codes-on-twitter-deliver-malicious-chrome-extension) on a threat they call “Choziosi Loader” that validates a lot of our own ChromeLoader findings.

**The macOS variant:** Once we knew about G-Data’s Choziosi naming convention, we discovered another [excellent write-up](https://www.th3protocol.com/2022/Choziosi-Loader) by [Colin Cowie](https://twitter.com/th3_protoCOL) analyzing a macOS variant of ChromeLoader.

In this article, we share important elements of the ChromeLoader infection chain and security guidance that you can apply to detect and hunt for ChromeLoader activity in your environment. While some of the information in this blog overlaps with existing research published by G-Data and Colin Cowie, we’re sharing new insights and guidance that security teams can use to develop behavioral analytics to detect ChromeLoader.

## Initial access

ChromeLoader is delivered by an ISO file, typically masquerading as a torrent or cracked video game. It appears to spread through pay-per-install sites and social media platforms such as Twitter.

![ChromeLoader Twitter post](https://redcanary.com/wp-content/uploads/2022/05/image8-1-830x1024.png)

_Figure 1: Redacted screenshot of a Twitter post with scannable QR code leading to ChromeLoader’s initial download site_

Once downloaded and executed, the .ISO file is extracted and mounted as a drive on the victim’s machine. Within this ISO is an executable used to install ChromeLoader, along with what appears to be a .NET wrapper for the Windows Task Scheduler. This is how ChromeLoader maintains its persistence on the victim’s machine later in the intrusion chain.

![ChromeLoader files dropped](https://redcanary.com/wp-content/uploads/2022/05/image7-1.png)

_Figure 2: [VirusTotal](https://www.virustotal.com/gui/file/fa52844b5b7fcc0192d0822d0099ea52ed1497134a45a2f06670751ef5b33cd3/content) analysis on files dropped by malicious ISO_

## Execution and persistence

Executing `CS_Installer.exe` creates persistence through a scheduled task using the Service Host Process (`svchost.exe`). Notably, ChromeLoader does not call the Windows Task Scheduler (`schtasks.exe`) to add this scheduled task, as one might expect. Instead, we saw the installer executable load the Task Scheduler COM API, along with a cross-process injection into `svchost.exe` (which is used to launch ChromeLoader’s scheduled task).

![CS\_Installer.exe](https://redcanary.com/wp-content/uploads/2022/05/image4-1.png)

_Figure 3: Carbon Black console crossprocs and modloads of  `CS_Installer.exe`_

Figure 3 depicts the cross-process injection into `svchost.exe`. Cross-process injection is frequently used by legitimate applications but may be suspicious if the originating process is located on a virtual drive (like those that you’d expect an ISO file to mount on). It’s a good idea to keep an eye out for processes executing from file paths that don’t reference the default `C:\drive` and that initiate a cross-process handle into a process that is on the C:\\drive. This will not only offer visibility into ChromeLoader activity, but also into the many worms that originate from removable drives and inject into `C:\drive` processes, like `explorer.exe`, to propagate on a victim’s machine.

After the cross-process injection is complete, ChromeLoader’s scheduled task will execute through svchost, calling the [Command Interpreter](https://redcanary.com/threat-detection-report/techniques/command-scripting-interpreter/) (`cmd.exe`), which executes a Base64-encoded PowerShell command containing multiple declared variables. ChromeLoader uses the shortened `-encodedcommand` flag to encode its PowerShell command:

![Encoded PowerShell content ](https://redcanary.com/wp-content/uploads/2022/05/image5-1.png)

_Figure 4: Encoded PowerShell content spawned by ChromeLoader’s scheduled task_

Once decoded and beautified, the command looks like this:

![PowerShell CLI decode](https://redcanary.com/wp-content/uploads/2022/05/image1-1.png)

_Figure 5: PowerShell CLI decoded and beautified by reddit user “[Russianh4ck3r](https://www.reddit.com/r/antivirus/comments/rvvc0d/comment/hrfpekt/?utm_source=share&utm_medium=web2x&context=3)”_

In this command, PowerShell checks if the ChromeLoader extension is installed. If the specific file path is not found, it will pull down an archive file from a remote location using `wget` and load the contents as a Chrome extension. Once the extension is found, this PowerShell command will silently remove the ChromeLoader scheduled task using the `Unregister-ScheduledTask` function.

ChromeLoader then loads its extension into Chrome by using PowerShell to spawn Chrome with the `--load-extension` flag and references the file path of the downloaded extension.

![PowerShell spawning Chrome](https://redcanary.com/wp-content/uploads/2022/05/image6-1-1024x258.png)

_Figure 6: PowerShell spawning Chrome_

Once loaded in Chrome, the malicious extension can execute its true objective: redirecting victim search results through malvertising domains and redirecting away from the Chrome extensions page if the user attempts to remove the extension.

## macOS Variation

In late April, Colin Cowie published an analysis of the [macOS version](https://www.th3protocol.com/2022/Choziosi-Loader) of ChromeLoader, which is capable of loading malicious extensions into both the Chrome and Safari web browsers. After reading Colin’s blog, we retroactively analyzed some Red Canary threat detections that seemed to constitute partial execution of this variation from a published detection in late February. As illustrated below, ChromeLoader redirects an encoded command from a Bourne shell (`sh`) into a Bourne-again SHell (`bash`). The command itself searches for `Google Chrome` process using grep, then loads the malicious extension from `/private/var/tmp/` if the process is found.

![Decoded Bash command](https://redcanary.com/wp-content/uploads/2022/05/image2-1-1024x584.png)

_Figure 7: Decoded Bash command loading malicious extension into Chrome_

The macOS variation has the same initial access technique as the Windows variant, namely that it uses baited social media posts with QR codes or links that direct users to malicious pay-per-install download sites. Instead of originating as an ISO, the macOS variation originates in an Apple Disk Image (`DMG`) file format. And unlike the Windows variation, the DMG file contains an installer script that drops payloads for either Chrome or Safari, not a portable executable file. When executed by the end user, the installer script then initiates cURL to retrieve a ZIP file containing the malicious browser extension and unzips it within the `private/var/tmp` directory, finally executing Chrome with command-line options to load the malicious extension.

![Bash script decompressing browser extention](https://redcanary.com/wp-content/uploads/2022/05/image3-1.png)

_Figure 8: Bash script downloading and decompressing the ChromeLoader browser extension. Image courtesy of Colin Cowie._

To maintain persistence, the macOS variation of ChromeLoader will append a preference (`plist`) file to the `/Library/LaunchAgents` directory. This ensures that every time a user logs into a graphical session, ChromeLoader’s Bash script can continually run. Once installed, ChromeLoader performs the same activity as it does on Windows machines: redirecting web traffic through advertising sites.

## Detection

### **Detection opportunity 1**: PowerShell containing a shortened version of the `encodedCommand` flag in its command line

This pseudo detection logic looks for the execution of encoded PowerShell commands. Not all encoded PowerShell is malicious, but encoded commands are worth keeping an eye on.

process\_name == powershell.exe  
&&  
command\_line\_includes (-e, -en, -enc, \[going on sequentially until the full flag, `-encodedcommand`\])

_Note: Many applications will legitimately encode PowerShell and make use of these shortened flags. Some tuning may be required, depending on your environment. To refine this detection analytic, consider looking for multiple variables in the decoded PowerShell block paired with the use of a shortened `encodedCommand` flag stated above. Variables are declared in PowerShell using `$`._

decoded\_command\_line\_includes == $

### **Detection opportunity 2:** PowerShell spawning `chrome.exe` containing `load-extension` and `AppData\Local` within the command line

The detection analytic looks for instances of the Chrome browser executable spawning from PowerShell with a corresponding command line that includes `appdata\local` as a parameter.

parent\_process\_name == powershell.exe  
&&  
process\_name == chrome.exe  
&&  
command\_line\_includes (`AppData\Local`,`load-extension`)

### **Detection opportunity 3:** Shell process spawning process loading a Chrome extension within the command line

This analytic looks for `sh` or `bash` scripts running in macOS environments with command lines associated with the macOS variant of ChromeLoader.

parent\_process\_equals\_any (sh || bash)  
&&  
process\_name\_is\_osx?  
&&  
command\_line\_includes (`/tmp/` || `load-extension`|| `chrome`)

### **Detection opportunity 4:** Redirected Base64 encoded commands into a shell process

Like the encoded PowerShell detection analytics idea above, this detector looks for the execution of encoded `sh`, `bash`, or `zsh` commands on macOS endpoints.

command\_line\_includes (`echo`,`base64`)  
&&  
childproc\_equals\_any (sh,bash,zsh)

_Note: As is the case with PowerShell, there are many legitimate uses for encoding shell commands. Some tuning may be required, depending on your environment._

## Conclusion

We hope this blog helps you improve your defense-in-depth against ChromeLoader specifically—but also for any variety of other threats that leverage suspicious ISO/DMG files and PowerShell/Bash execution. As always, each environment is different and certain administrative or user workflows may trigger your new detection analytics. Please be sure to tune accordingly. Happy hunting!

## Curator notes

<!-- Empty at capture time. -->
