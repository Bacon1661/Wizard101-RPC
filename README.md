# Wizard101 RPC
>The best way to show Wizard101 in-game stats on your Discord profile

If you're anything like me, you play a lot of wiz, and you use discord. The only issue is Kingsisle hasn't done much in terms of Discord integration, and previous solutions no longer work. Wizard101 RPC will read health and zone information from logs provided by Wizard101 and display them on your Discord profile.

![example screenshots](https://media.giphy.com/media/VwsBLJH7MKbgSP6meo/giphy.gif)

## Installation
~~A compiled version can be found on the releases page here.~~

~~Unfortunately, I don't have the money to sign anything, so you may get a message from windows on only the initial launch stating, "Windows protected your PC." If this happens, click "More info" and then "Run anyway". Always check files you don't trust with tools like [virustotal.com](https://www.virustotal.com/) and Windows Defender. I have submitted this app to Microsoft for malware analysis to hopefully resolve this.~~

Things todo before a binary is released:
- Update zones.json automatically
- Try a non-deprecated Discord RPC module. 

## Usage
After finding a valid path and having successfully connected to your Discord client, Wizard101 RPC will show information on your profile while running. Please note that you must have Discord installed. Only the standard version of Discord has been tested. Other versions are expected to work, but not guaranteed. 

Wizard101 RPC has the ability to run Wizard101 (even quick launch) on startup. This way you can run Wizard101 RPC instead and have rich presence automatically working. 

### Initial Startup
For Wizard101 RPC to work it must be able to read logs Wizard101 provides. Therefore, it must know where Wizard101 is installed. Two places will be checked initially:
- The default location `C:\ProgramData\KingsIsle Entertainment\Wizard101`
- The default Steam location `C:\Program Files (x86)\Steam\steamapps\common\Wizard101`

If a log file can't be found where expected from these locations, you will be prompted to enter a valid path before Wizard101 RPC will work. The entered path must lead to the Wizard101 folder, just as the default ones above. 

The startup setting will default to `quick`, meaning Wizard101 will quick launch when Wizard101 RPC starts.

### Commands
You can type in commands to change various settings. Type in the command name followed by an expected value. 

- #### `path <path to wizard101>`
   - Change the path of where Wizard101 RPC will read information from if valid
   - default: default location, if it exists
   - example: `path D:\Steam\steamapps\common\Wizard101`
- #### `startup <quick|normal|none>`
   - Sets how Wizard101 will launch when Wizard101 RPC is started
      - quick: quick launch (skip patching, instant login screen)
      - normal: normal launch
      - none: will not launch
   - default: quick
   - example: `startup none`

## Support
Feel free to DM me on Discord at Bacon#1661. If you prefer, or you believe you found a bug, you can open an issue instead. 

## Roadmap
As mentioned above in "Installation", there are priorities set before launch. Some other ideas to consider for the future in descending importance:
- MacOS and Linux support (If you use either of these and would like to help test please contact me)
- Additional commands to let users customize the app, such as if to close when the game closes, how often information is retrieved from the logs, customization of rich presence elements, etc..
- A GUI with Electron (not needed with a simple program like this, a lot of work, probably won't happen unless there's enough demand). 

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)