const fs = require("fs");
const path = require("path");
const readLastLines = require("read-last-lines");
const DiscordRPC = require("discord-rpc");
const rpc = new DiscordRPC.Client({ transport: "ipc" });
const logPath = "C:\\ProgramData\\KingsIsle Entertainment\\Wizard101\\Bin\\WizardClient.log";
const zones = require(path.join(__dirname, "./zones.json"));

console.log("           _                  _ __  ___  __                        \n          (_)                | /_ |/ _ \\/_ |                       \n __      ___ ______ _ _ __ __| || | | | || |______ _ __ _ __   ___ \n \\ \\ /\\ / / |_  / _` | \'__/ _` || | | | || |______| \'__| \'_ \\ / __|\n  \\ V  V /| |/ / (_| | | | (_| || | |_| || |      | |  | |_) | (__ \n   \\_/\\_/ |_/___\\__,_|_|  \\__,_||_|\\___/ |_|      |_|  | .__/ \\___|\n                                                       | |         \n  ");

let oldLineCount, zone, world, health, activity, currentTime;
(async () => { oldLineCount = await countLines(); })();

fs.watchFile(logPath, { interval: 100 }, async (_curr, _prev) => {
	let currentLineCount = await countLines();
	readLastLines.read(logPath, currentLineCount - oldLineCount).then(async (logChunk) => {
		//	Get zone
		try {
			const zoneRegex = new RegExp(/zone = (.+),|CHARACTER LIST/gm);
			let tempZone = logChunk.match(zoneRegex);
			if(tempZone) {
				tempZone = zoneRegex.exec(tempZone[tempZone.length - 1]);
				zone = tempZone[1] || tempZone[0];

				world = /= (.+?)\/(.+)/.exec(tempZone);
				world = world && zones.zoneNames[world[1]] ? world[1] : "WizardCity";
			}
		} catch(err) { console.log(err); }

		//	Get health
		const healthRegex = new RegExp(/WizClientGameEf (.+): Updating health globe \(new health: (\d+), new health max: (\d+)\)/gm);
		let tempHealth = logChunk.match(healthRegex);
		if(tempHealth) {
			health = healthRegex.exec(tempHealth[tempHealth.length - 1]);
			health = health[3] < health[2] ? [health[2], health[2]] : [health[2], health[3]];
		}
	}).catch((err) => { console.log(err); });
	oldLineCount = currentLineCount;

	if((!activity && zone) || activity && (activity.details !== zones[zone] || health && activity.state !== `Health: ${health[0]}/${health[1]}`)) {
		if(!activity || activity.details !== zones[zone]) currentTime = new Date();
		if(zone === "CHARACTER LIST") health = null;
		activity = {
			details: zones[zone],
			state: zone === "CHARACTER LIST" ? undefined : `Health: ${health ? `${health[0]}/${health[1]}` : "unkown"}`,
			startTimestamp: currentTime,
			largeImageKey: world.toLowerCase(),
			largeImageText: zones.zoneNames[world],
			instance: false
		};
		rpc.setActivity(activity);
		console.log("Activity set!");
	}
});

function countLines() {
	return new Promise((resolve, reject) => {
		let lineCount = 0;
		fs.createReadStream(logPath).on("data", (buffer) => {
			let index = -1;
			lineCount--;
			do {
				index = buffer.indexOf(10, index + 1);
				lineCount++;
			} while(index !== -1);
		}).on("end", () => {
			resolve(lineCount);
		}).on("error", reject);
	});
}

rpc.on("ready", () => { console.log("Successfully connected to Discord!"); });

rpc.login({ clientId: "799404226081849345" }).catch(console.error);
