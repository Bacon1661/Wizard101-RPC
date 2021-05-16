const fs = require("fs");
const path = require("path");
const readline = require("readline");
const https = require("https");
const { exec } = require("child_process");
const readLastLines = require("read-last-lines");
const DiscordRPC = require("discord-rpc");
const zones = require(path.join(__dirname, "./zones.json"));
const settings = require(path.join(__dirname, "./settings.json"));
const package = require(path.join(__dirname, "./package.json"));
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});
let rpc;

console.log("           _                  _ __  ___  __                        \n          (_)                | /_ |/ _ \\/_ |                       \n __      ___ ______ _ _ __ __| || | | | || |______ _ __ _ __   ___ \n \\ \\ /\\ / / |_  / _` | \'__/ _` || | | | || |______| \'__| \'_ \\ / __|\n  \\ V  V /| |/ / (_| | | | (_| || | |_| || |      | |  | |_) | (__ \n   \\_/\\_/ |_/___\\__,_|_|  \\__,_||_|\\___/ |_|      |_|  | .__/ \\___|\n                                                       | |         \n  ");
console.log("https://github.com/Bacon1661/wizard101-rpc\n");

function setPresence() {
	let oldLineCount, zone, world, health, activity, currentTime;
	(async () => { oldLineCount = await countLines(); })();

	fs.watchFile(settings.path, { interval: 100 }, async (_curr, _prev) => {
		let currentLineCount = await countLines();
		readLastLines.read(settings.path, currentLineCount - oldLineCount).then(async (logChunk) => {
			//	Get zone
			const zoneRegex = new RegExp(/zone = (.+),|CHARACTER LIST/gm);
			let tempZone = logChunk.match(zoneRegex);

			if(tempZone) {
				tempZone = zoneRegex.exec(tempZone[tempZone.length - 1]);
				zone = tempZone[1] || tempZone[0];

				world = /= (.+?)\/(.+)/.exec(tempZone);
				world = world && zones.zoneNames[world[1]] ? world[1] : "WizardCity";
			}

			//	Get health
			const healthRegex = new RegExp(/Updating health globe \(new health: (\d+), new health max: (\d+)\)\r\n(?!(.+)called for a player that is not this client's!)/gm); //	/Updating health globe \(new health: (\d+), new health max: (\d+)\)\n(?!(.+)called for a player that is not this client's!)/gm
			let tempHealth = logChunk.match(healthRegex);

			if(tempHealth) {
				health = healthRegex.exec(tempHealth[tempHealth.length - 1]);
				health = health[2] < health[1] ? [health[1], health[1]] : [health[1], health[2]];
			}

			//	Check if the game has been quit
			if(logChunk.match(/GameClient::HandleQuit\(\)|Logout due to Away From Keyboard/) && activity && settings.startup !== "none") {
				rpc.destroy();
				process.exit();
			}
		}).catch((err) => { console.log(err); });
		oldLineCount = currentLineCount;

		if((!activity && zone) || activity && (activity.details !== zones[zone] || health && activity.state !== `Health: ${health[0]}/${health[1]}`)) {
			if(!activity || activity.details !== zones[zone]) currentTime = new Date();
			if(zone === "CHARACTER LIST") health = null;
			activity = {
				details: zones[zone],
				state: zone === "CHARACTER LIST" ? undefined : `Health: ${health ? `${health[0]}/${health[1]}` : "unknown"}`,
				startTimestamp: currentTime,
				largeImageKey: world.toLowerCase(),
				largeImageText: zones.zoneNames[world],
				instance: false
			};
			rpc.setActivity(activity);
		}
	});
}

function countLines() {
	return new Promise((resolve, reject) => {
		let lineCount = 0;
		fs.createReadStream(settings.path).on("data", (buffer) => {
			let index = -1;
			lineCount--;
			do {
				index = buffer.indexOf(10, index + 1);
				lineCount++;
			} while(index !== -1);
		}).on("end", () => resolve(lineCount)).on("error", reject);
	});
}

(function updates() {
	console.log("Checking for updates...");
	getJSON("https://raw.githubusercontent.com/Bacon1661/wizard101-rpc/master/package.json");

	function getJSON(url, runConf) {
		https.get(url, (res) => {
			let body = "";

			res.on("data", (data) => body += data);

			res.on("end", async () => {
				try {
					let file;
					file = JSON.parse(body);
					if(runConf) {
						console.log("Updating zones.json...");
						if(file.zoneNames) await fs.writeFile(path.join(__dirname, "./zones.json"), JSON.stringify(file, null, 4), () => { /* do nothing */ });
						configureSettings();
					} else {
						if(file.version !== package.version) console.log(`Version ${file.version} is available! Go here to download it: https://github.com/Bacon1661/wizard101-rpc/releases\n`);
						getJSON("https://raw.githubusercontent.com/Bacon1661/wizard101-rpc/master/zones.json", true);
					}
				} catch(err) {
					console.error(`Error accessing the GitHub repository: ${err.message}`);
					if(runConf) return configureSettings();
					getJSON("https://raw.githubusercontent.com/Bacon1661/wizard101-rpc/master/zones.json", true);
				}
			});
		}).on("error", (err) => {
			console.error(`Error accessing the GitHub repository: ${err.message}`);
			if(runConf) return configureSettings();
			getJSON("https://raw.githubusercontent.com/Bacon1661/wizard101-rpc/master/zones.json", true);
		});
	}
}());

async function configureSettings() {
	const defaultPath = "C:\\ProgramData\\KingsIsle Entertainment\\Wizard101\\Bin\\WizardClient.log";
	const defaultSteamPath = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Wizard101\\Bin\\WizardClient.log";

	if(!settings.path || !fs.existsSync(settings.path)) {
		settings.path === null;
		const defaultValidPath = fs.existsSync(defaultPath) ? defaultPath : fs.existsSync(defaultSteamPath) ? defaultSteamPath : null;
		if(defaultValidPath) {
			settings.path = defaultValidPath;
			await fs.writeFile(path.join(__dirname, "./settings.json"), JSON.stringify(settings), () => { /* do nothing */ });
			console.log(`Fetching data for RPC from ${defaultValidPath.slice(0, defaultValidPath.length - 21)}\n`);
		}
	}

	//	handle command inputs
	if(!settings.startup) {
		console.log("No startup settings detected, using the 'quick' startup setting!\nIn the future, run this program instead and Wizard101-RPC will quick launch Wizard101 for you.\n\nYou can change this by using the 'startup' command.\nUsage: startup <quick|normal|none>\nExample Usage:\nstartup quick - Set Wizard101-RPC to quick launch (skip patching, instant login) Wizard101 on startup.\nstartup normal - Set Wizard101-RPC to launch Wizard101 normally on startup.\nstartup none - Set Wizard101-RPC to not launch Wizard101 on startup.\n");
		settings.startup = "quick";
		await fs.writeFile(path.join(__dirname, "./settings.json"), JSON.stringify(settings), () => { /* do nothing */ });
	}
	if(!settings.path) console.log("Could not find Wizard101 at a default path! Please enter a valid path to continue.\nExample path (does not have to be steam): D:\\Steam\\steamapps\\common\\Wizard101");

	rl.on("line", async (input) => {
		if(!settings.path) await pathCommand(null, input);
		if(!rpc && settings.path) return connectDiscord();

		let args = input.split(/\s+/g);
		if(!args[0] || typeof args[0] !== "string") return;
		args[0] = args[0].toLowerCase();
		if(args[0] === "path") pathCommand(args);
		if(args[0] === "startup") startupCommand(args);
	});

	async function pathCommand(args, init) {
		if(args && !args[1]) return console.log("\nChange the path of where Wizard101-RPC will read information from if valid.\nUsage: path <path>\nExample Usage: path D:\\Steam\\steamapps\\common\\Wizard101");
		if(!fs.existsSync(`${init || args[1]}\\Bin\\WizardClient.log`)) return console.log(init ? `\nCould not find Wizard101 at the path "${init || args[1]}".\nA valid path will need to be supplied to the Wizard101 folder before Wizard101-RPC can run properly. Make sure you've ran the game at least once. Please try again.\nExample path (does not have to be steam): D:\\Steam\\steamapps\\common\\Wizard101` : `\nCould not find Wizard101 at the path "${init || args[1]}".\nUsage: path <path>\nExample usage: path D:\\Steam\\steamapps\\common\\Wizard101`);

		settings.path = `${init || args[1]}\\Bin\\WizardClient.log`;
		await fs.writeFile(path.join(__dirname, "./settings.json"), JSON.stringify(settings), () => { /* do nothing */ });
		console.log(`\nNew path set to "${init || args[1]}". If a path was already set, Wizard101-RPC won't read from the new path until its has been restarted.`);
	}

	async function startupCommand(args) {
		if(!args[1]) return console.log("\nSets how Wizard101-RPC will start Wizard101, if at all.\nUsage: startup <quick|normal|none>\n\nExample Usage:\nstartup quick - Set Wizard101-RPC to quick launch Wizard101 on startup.\nstartup normal - Set Wizard101-RPC to launch Wizard101 normally on startup.\nstartup none - Set Wizard101-RPC to not launch Wizard101 on startup.");
		args[1] = args[1].toLowerCase();

		if(args[1] === "quick" || args[1] === "normal" || args[1] === "none") {
			settings.startup = args[1];
			await fs.writeFile(path.join(__dirname, "./settings.json"), JSON.stringify(settings), () => { /* do nothing */ });
			console.log(`\nStartup settings set to '${args[1]}'.`);
		} else {
			console.log(`\nInvalid argument '${args[1]}'. Please use 'quick', 'normal', or 'none'.`);
		}
	}
	if(settings.path) connectDiscord();
}

let reconnect;
function connectDiscord() {
	console.log("\nConnecting to your Discord app...");
	rl.pause();

	rpc = new DiscordRPC.Client({ transport: "ipc" });

	rpc.once("ready", () => {
		console.log("Successfully connected to Discord!\nWizard101-RPC is ready! Information will be shown on your Discord profile when the game starts, or when the zone changes.");
		clearInterval(reconnect);
		setPresence();
		rl.resume();

		//	Launch wiz
		if(settings.startup === "none") return;
		process.chdir(settings.path.slice(0, settings.path.length - (settings.startup === "quick" ? 17 : 21)));
		settings.startup === "quick" ? exec("WizardGraphicalClient.exe -L 165.193.63.4 12000", (err) => console.log(`\nQuick launched Wizard101!\nIf you encounter an issue, try running Wizard101 normally.\n${err ? err : ""}`)) : settings.startup === "normal" ? exec("Wizard101.exe", _err /* an error will always be made, even when successful*/ => console.log("\nLaunched Wizard101!")) : null;
	});

	rpc.login({ clientId: "799404226081849345" }).then(() => {
		clearInterval(reconnect);
	}).catch((err) => {
		console.log(`${err}\nMake sure Discord is running. You might need to restart Discord (Ctrl+R on Discord).`);
		if(!reconnect && !rpc.user) {
			reconnect = setInterval(connectDiscord, 10050);
			connectDiscord();
		}
	});
}
