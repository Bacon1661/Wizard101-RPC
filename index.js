const fs = require("fs");
const path = require("path");
const readLastLine = require("read-last-line");
const logPath = "C:\\ProgramData\\KingsIsle Entertainment\\Wizard101\\Bin\\WizardClient.log";
const zones = require(path.join(__dirname, "./zones.json"));

console.log("           _                  _ __  ___  __                        \n          (_)                | /_ |/ _ \\/_ |                       \n __      ___ ______ _ _ __ __| || | | | || |______ _ __ _ __   ___ \n \\ \\ /\\ / / |_  / _` | \'__/ _` || | | | || |______| \'__| \'_ \\ / __|\n  \\ V  V /| |/ / (_| | | | (_| || | |_| || |      | |  | |_) | (__ \n   \\_/\\_/ |_/___\\__,_|_|  \\__,_||_|\\___/ |_|      |_|  | .__/ \\___|\n                                                       | |         \n  ");

let oldLineCount;
(async () => { oldLineCount = await countLines(); })();
fs.watchFile(logPath, { interval: 100 }, async (_curr, _prev) => {
	let currentLineCount = await countLines();
	await readLastLine.read(logPath, (currentLineCount - oldLineCount) * 2).then(async (logChunk) => {
		try {
			console.log(zones[/zone = (.+),/.exec(logChunk)[1]]);
		} catch(_err) { /* No zone information found in this chunk */ }

		let health = /WizClientGameEf (.+): Updating health globe \(new health: (\d+), new health max: (\d+)\)/gm.exec(logChunk);
		console.log(`new health: ${health[2]}, new max health: ${health[3]}`);
	}).catch(() => { /* No health information found in this chunk */ });
	oldLineCount = currentLineCount;
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
